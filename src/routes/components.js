const validate = require('../services/validate');
const project = require('../services/project');
const component = require('../services/component');
const user = require('../services/user');
const form = require('../services/form');
const page = require('../services/page');
const capabilities = require('../services/capabilities');
const runner = require('../directors/runner.js');
const rules = require('../services/rules');

const components = {
    createForm: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName)
        const pageObject = await page.getPageByUuid(req, req.params.pageUuid)
        const projectBreakpoints = await project.getProjectBreakpoints(projectObject.id);
        const projectCapabilites = await project.getProjectCapabilities(req, projectObject.id);
        if (!projectObject || !pageObject) {
            res.redirect(301, '/projects')
            return
        }
        let rulesObject = await rules.collectRules();
        if (user.isAdmin(req)) {
            res.render('component-create', {
                title: 'Create Component for ' + projectObject.name,
                project: projectObject,
                page: pageObject,
                form: form.populateFormDefaults('component', req),
                rules: rulesObject,
                user: user.getUser(req),
                buttonText: 'Create component',
                capabilities: capabilities.getCapabilitiesForStyling(projectCapabilites),
                breakpoints: projectBreakpoints,
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    editForm: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const componentObject = await component.getComponentByUuid(req, req.params.componentUuid);
        const fullComponent = await component.getFullComponent(componentObject);
        // Fix full component.
        fullComponent.device_breakpoint = [];
        for (let t in fullComponent.capabilities_and_breakpoints) {
            let mix = fullComponent.capabilities_and_breakpoints[t];
            fullComponent.device_breakpoint.push(mix.capability_id + '--' + mix.breakpoint_id);
        }
        fullComponent.selector = [];
        for (let t in fullComponent.rules) {
            let mix = fullComponent.rules[t];
            let rule = {};
            rule[mix.key] = JSON.parse(mix.ruleset);
            fullComponent.selector.push(rule)
        }
        fullComponent.tested = 1;
        const pageObject = await page.getPageById(req, componentObject.page_id);
        const projectBreakpoints = await project.getProjectBreakpoints(projectObject.id);
        const projectCapabilites = await project.getProjectCapabilities(req, projectObject.id);
        if (!projectObject || !pageObject) {
            res.redirect(301, '/projects')
            return
        }
        let rulesObject = await rules.collectRules();
        let browserDiffs = await component.getBrowserDiffs(componentObject);
        if (user.isAdmin(req)) {
            res.render('component-create', {
                title: 'Edit Component ' + componentObject.name + ' for ' + projectObject.name,
                project: projectObject,
                page: pageObject,
                id: componentObject.id,
                form: form.populateFormDefaults('component', req, componentObject),
                rules: rulesObject,
                user: user.getUser(req),
                browserDiffs: browserDiffs,
                buttonText: 'Edit component',
                capabilities: capabilities.getCapabilitiesForStyling(projectCapabilites),
                breakpoints: projectBreakpoints,
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    deleteForm: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const componentObject = await component.getComponentByUuid(req, req.params.componentUuid);
        const pageObject = await page.getPageById(req, componentObject.page_id);
        if (user.hasPermission(req, 'delete-component')) {
            res.render('component-delete', {
                title: 'Delete Component ' + componentObject.name + ' for ' + projectObject.name,
                project: projectObject,
                page: pageObject,
                id: componentObject.id,
                user: user.getUser(req),
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    deleteComponent: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const componentObject = await component.getComponentById(req, req.body.component_id);
        const pageObject = await page.getPageById(req, componentObject.page_id);
        if (user.hasPermission(req, 'delete-component')) {
            component.deleteComponent(req, componentObject);
            res.redirect(301, '/projects/' + projectObject.dataname + '/page/' + pageObject.uuid);
        } else {
            res.redirect(301, '/projects');
        }
    },
    post: async function(req, res) {
        if (user.isAdmin(req)) {
            const projectObject = await project.getProjectByName(req, req.params.projectName)
            const pageObject = await page.getPageByUuid(req, req.params.pageUuid)
            let validationErrors = "id" in req.body ? await component.editComponent(req.body, pageObject, projectObject) : await component.createComponent(req.body, pageObject, projectObject)
            if (validationErrors !== null) {
                if ("id" in req.body) {
                    const componentObject = await component.getComponentById(req, req.body.id);
                    validate.redirect('/projects/' + projectObject.dataname + '/component/' + componentObject.uuid + '/edit', req.body, validationErrors, req, res)
                } else {
                    validate.redirect('/projects/' + projectObject.dataname + '/page/' + pageObject.uuid + '/component/create', req.body, validationErrors, req, res)
                }
            } else {
                res.redirect(301, '/projects/' + projectObject.dataname + '/page/' + pageObject.uuid )
            }
        }
    },
    startRunner: async function(req, res) {
        if (('csrf' in req.body) && (req.body.csrf in form.tokens)) {
            const rulesSet = components.buildRules(req.body);
            const capabilities = await components.buildCapabilities(req.body);
            if (await user.isAdmin(req)) {
                if (runner.startJob(rulesSet, capabilities, req.body.csrf)) {
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