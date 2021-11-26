const validate = require('../services/validate');
const project = require('../services/project');
const capabilities = require('../services/capabilities');
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
        });
    },
    detail: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName)
        if (!projectObject) {
            res.redirect(301, '/projects')
            return
        }
        const pages = await page.getPagesByProjectId(req, projectObject.id)
        res.render('project-detail', {
            title: 'glitch-hawk: ' + projectObject.name,
            pageTitle: projectObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            pages: pages,
            user: user.getUser(req),
        });
    },
    post: async function(req, res) {
        if (user.isAdmin(req)) {
            let validationErrors = await project.createProject(req.body)
            if (validationErrors !== null) {
                validate.redirect('/projects/create', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/projects')
            }
        }
    },
    createForm: async function(req, res) {
        if (user.isAdmin(req)) {
            let capabiltyRows = await capabilities.getCapabilities()
            res.render('projects-create', {
                title: 'Create Project',
                form: form.populateFormDefaults('project', req),
                user: user.getUser(req),
                capabilities: capabilities.getCapabilitiesForStyling(capabiltyRows)
            })
        } else {
            res.redirect(301, '/projects')
        }
    } 
}