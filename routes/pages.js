const validate = require('../services/validate');
const project = require('../services/project');
const user = require('../services/user');
const form = require('../services/form');
const page = require('../services/page');
const component = require('../services/component');

module.exports = {
    createForm: async function(req, res) {
        const projectData = await project.getProjectByName(req, req.params.projectName)
        if (user.isAdmin(req)) {
            res.render('page-create', {
                title: 'Create Page for ' + projectData.name,
                project: projectData,
                form: form.populateFormDefaults('page', req),
                user: user.getUser(req),
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    post: async function(req, res) {
        if (user.isAdmin(req)) {
            const projectObject = await project.getProjectByName(req, req.params.projectName)
            
            if (!projectObject) {
                res.redirect(301, '/projects')
                return
            }
            let validationErrors = await page.createPage(req.body, projectObject)
            if (validationErrors !== null) {
                validate.redirect('/projects/' + projectObject.dataname + '/page/create', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/projects/detail/' + projectObject.dataname)
            }
        }
    },
    detail: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const pageObject = await page.getPageByUuid(req, req.params.pageUuid);
        const components = await component.getComponentsForPage(req, pageObject, projectObject);
        if (!projectObject || !pageObject) {
            res.redirect(301, '/projects')
            return
        }

        res.render('page-detail', {
            title: 'glitch-hawk: ' + projectObject.name + ' - ' + pageObject.name,
            pageTitle: projectObject.name  + ': ' + pageObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            components: components,
            page: pageObject,
            user: user.getUser(req),
        })
    },
}