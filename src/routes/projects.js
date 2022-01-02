const validate = require('../services/validate');
const project = require('../services/project');
const capabilities = require('../services/capabilities');
const user = require('../services/user');
const form = require('../services/form');
const page = require('../services/page');

module.exports = {
    get: async function(req, res) {
        const projects = await project.getProjects(req);
        res.render('projects', {
            title: 'Your projects',
            isAdmin: user.isAdmin(req),
            projects: projects,
            user: user.getUser(req),
        });
    },
    detail: async function(req, res) {
        const pagination = 12;
        const projectObject = await project.getProjectByName(req, req.params.projectName)
        if (!projectObject) {
            res.redirect(301, '/projects')
            return
        }
        let pageNumber = req.query.page ? parseInt(req.query.page) : 0;
        const pages = await page.getPagesByProjectId(req, projectObject.id, pagination, pageNumber)
        const count = await page.getCountPagesByProjectId(req, projectObject.id);
        const total = Math.ceil(count/pagination);
        res.render('project-detail', {
            title: 'glitch-hawk: ' + projectObject.name,
            pageTitle: projectObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            pages: pages,
            user: user.getUser(req),
            currentPage: pageNumber,
            paginationTotal: total,
            basePath: '/projects/detail/' + projectObject.dataname,
        });
    },
    post: async function(req, res) {
        if (user.hasPermission(req, "create project")) {
            let validationErrors = await project.createProject(req.body)
            if (validationErrors !== null) {
                validate.redirect('/projects/create', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/projects')
            }
        }
    },
    update: async function(req, res) {
        if (user.isAdmin(req)) {
            let validationErrors = await project.updateProject(req.body)
            if (validationErrors !== null) {
                validate.redirect('/projects/' + req.params.projectName + '/edit', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/projects/detail/' + req.params.projectName);
            }
        }
    },
    createForm: async function(req, res) {
        if (user.hasPermission(req, "create project")) {
            let capabiltyRows = await capabilities.getCapabilities()
            res.render('projects-create', {
                title: 'Create Project',
                action: '/projects/create',
                form: form.populateFormDefaults('project', req),
                user: user.getUser(req),
                capabilities: capabilities.getCapabilitiesForStyling(capabiltyRows)
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    editForm: async function(req, res) {
        if (user.hasPermission(req, "edit project")) {
            let capabiltyRows = await capabilities.getCapabilities()
            const projectObject = await project.getEditableProjectByName(req, req.params.projectName);
            res.render('projects-create', {
                title: 'Edit Project',
                form: form.populateFormDefaults('project', req, projectObject),
                id: projectObject.id,
                action: '/projects/' + projectObject.dataname + '/edit',
                user: user.getUser(req),
                capabilities: capabilities.getCapabilitiesForStyling(capabiltyRows)
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    deleteForm: async function(req, res) {
        if (user.hasPermission(req, "delete-project")) {
            const projectObject = await project.getEditableProjectByName(req, req.params.projectName);
            res.render('project-delete', {
                title: 'Delete Project ' + projectObject.name,
                id: projectObject.id,
                project: projectObject,
                user: user.getUser(req)
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    delete: async function(req, res) {
        if (user.hasPermission(req, "delete-project")) {
            const projectObject = await project.getProjectByName(req, req.params.projectName)
            await project.deleteProject(req, projectObject);
        }
        res.redirect(301, '/projects');
    },
}