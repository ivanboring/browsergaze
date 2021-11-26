const validate = require('../services/validate');
const project = require('../services/project');
const component = require('../services/component');
const user = require('../services/user');
const form = require('../services/form');
const page = require('../services/page');
const capabilities = require('../services/capabilities');
const runner = require('../directors/runner.js');
const fs = require('fs');
const yaml = require('js-yaml');

const components = {
    createForm: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName)
        const pageObject = await page.getPageByUuid(req, req.params.pageUuid)
        const projectBreakpoints = await project.getProjectBreakpoints(req, projectObject.id);
        const projectCapabilites = await project.getProjectCapabilities(req, projectObject.id);
        if (!projectObject || !pageObject) {
            res.redirect(301, '/projects')
            return
        }
        if (user.isAdmin(req)) {
            res.render('component-create', {
                title: 'Create Component for ' + projectObject.name,
                project: projectObject,
                page: pageObject,
                form: form.populateFormDefaults('component', req),
                rules: yaml.load(fs.readFileSync('./directors/rules.yaml')),
                user: user.getUser(req),
                capabilities: capabilities.getCapabilitiesForStyling(projectCapabilites),
                breakpoints: projectBreakpoints,
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    post: async function(req, res) {
        if (user.isAdmin(req)) {
            const projectObject = await project.getProjectByName(req, req.params.projectName)
            const pageObject = await page.getPageByUuid(req, req.params.pageUuid)
            let validationErrors = await component.createComponent(req.body, pageObject, projectObject)
            if (validationErrors !== null) {
                validate.redirect('/projects/' + projectObject.dataname + '/page/' + pageObject.uuid + '/component/create', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/projects/' + projectObject.dataname + '/page/' + pageObject.uuid )
            }
        }
    },
    startRunner: async function(req, res) {
        if (('csrf' in req.body) && (req.body.csrf in form.tokens)) {
            const rules = components.buildRules(req.body);
            const capabilities = await components.buildCapabilities(req.body);
            if (await user.isAdmin(req)) {
                if (runner.startJob(rules, capabilities, req.body.csrf)) {
                    res.json({'status': true})
                    return;
                }
            }
        }
        res.json({'status': false, 'error': 'could not start'});
    },
    statusRunner: async function(req, res) {
        if (await user.isAdmin(req)) {
            res.json(runner.getStatus(req.params.jobId));
        } else {
            res.json({status: false});
        }
    },
    cancelRunner: async function(req, res) {
        if (!('csrf' in req.body) || !(req.body.csrf in form.tokens)) {
            res.json({'error': 'no csrf'});
        } else {
            if (await user.isAdmin(req)) {
                runner.cancelJob(req.body.csrf);
            }
        }
    },
    buildRules: function(body) {
        return body.rules;
    },
    buildCapabilities: function(body) {
        return body.capabilities;
    }
}

module.exports=components