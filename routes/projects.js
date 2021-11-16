const validate = require('../services/validate');
const project = require('../services/project');
const user = require('../services/user');
const form = require('../services/form');
const page = require('../services/page');

module.exports = {
    get: async function(req, res) {
        const projects = await project.getProjects(req)
        res.render('projects', {
            title: 'Your projects',
            isAdmin: user.isAdmin(req),
            projects: projects,
            user: user.getUser(req),
        })
        
    },
    detail: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName)
        const pages = await page.getPageForProject(req, req.params.projectName)
        res.render('project-detail', {
            title: 'glitch-hawk: ' + projectObject.name,
            pageTitle: projectObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            pages: pages,
            user: user.getUser(req),
        })
        res.send();
    },
    post: async function(req, res) {
        let validationErrors = await project.createProject(req.body)
        if (validationErrors !== null) {
            validate.redirect('/projects/create', req.body, validationErrors, req, res)
        } else {
            res.redirect(301, '/projects')
        }
    },
    createForm: async function(req, res) {
        if (user.isAdmin(req)) {
            res.render('projects-create', {
                title: 'Create Project',
                form: form.populateFormDefaults('project', req),
                user: user.getUser(req),
            })
        } else {
            res.redirect(301, '/projects')
        }
    } 
}