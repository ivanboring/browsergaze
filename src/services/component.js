const componentDb = require('../model/componentDb');
const fs = require('fs');
const validate = require('./validate');
const defaults = require('./defaults')
const capabilities = require('./capabilities');
const project = require('./project');
const page = require('./page');
const screenshot = require('./screenshot');
const baseline = require('./baseline');

const component = {
    getComponentsForProject: async function(req, projectId) {
        return await componentDb.getComponentsForProject(req, projectId);
    },
    getComponentsForPage: async function(req, pageObject, projectObject) {
        return await componentDb.getComponentsForPage(req, pageObject, projectObject);
    },
    getBreakpointCapabilityForComponent: async function(componentObject) {
        let rows = await componentDb.getBreakpointCapabilityForComponent(componentObject);
        let groupedResult = {};
        for (let t in rows) {
            if (!(rows[t].capability_id in groupedResult)) {
                groupedResult[rows[t].capability_id] = [];
            }
            groupedResult[rows[t].capability_id].push(rows[t]);
        }
        return groupedResult;
    },
    getComponentById: async function(req, id) {
        return await componentDb.getComponentById(req, id);
    },
    getComponentByUuid: async function(req, uuid) {
        return await componentDb.getComponentByUuid(req, uuid);
    },
    getFullComponent: async function (componentObject) {
        componentObject.capabilities_and_breakpoints = await capabilities.getCapabilitiesAndBreakpointsForComponent(componentObject.id);
        componentObject.rules = await componentDb.getRulesForComponent(componentObject.id);
        return componentObject;
    },
    createComponent: async function(componentObject, pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(componentObject, 'component');
        if (validationErrors.length) {
            return validationErrors
        }

        // Store in db
        componentObject.id = await componentDb.insertComponent(componentObject, pageObject, projectObject);
        componentObject.uuid = await componentDb.getUuidFromId(componentObject.id);
        // Store rules
        await componentDb.saveRules(componentObject)
        // Store components capability/breakpoints
        await componentDb.saveCapabilityBreakpoint(componentObject)
        // Store the image
        this.saveDefaultImage(componentObject, pageObject, projectObject);
        return null;
    },
    editComponent: async function(componentObject, pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(componentObject, 'component');
        if (validationErrors.length) {
            return validationErrors
        }

        // Store in db
        componentObject.uuid = await componentDb.getUuidFromId(componentObject.id);
        await componentDb.updateComponent(componentObject, pageObject, projectObject);
        
        // Store rules
        await componentDb.saveRules(componentObject, true)
        // Store components capability/breakpoints
        await componentDb.saveCapabilityBreakpoint(componentObject, true)
        return null;
    },
    deleteComponent: async function(req, componentObject) {
        console.log(componentObject);
        const pageObject = await page.getPageById(req, componentObject.page_id);
        const projectObject = await project.getProjectById(req, componentObject.project_id);
        await componentDb.deleteComponentById(componentObject.id);
        await this.deleteDefaultImage(componentObject, pageObject, projectObject);
        await componentDb.deleteCapabilityBreakpointFromComponent(componentObject);
        await componentDb.deleteRulesFromComponent(componentObject);
        await screenshot.deleteScreenshotForComponent(componentObject);
        await baseline.deleteBaselineForComponent(componentObject);

    },
    getRulesForComponent: async function(componentId) {
        return await componentDb.getRulesForComponent(componentId);
    },
    getUuidFromId: async function(id) {
        return await componentDb.getUuidFromId(id);
    },
    saveDefaultImage(componentObject, pageObject, projectObject) {
        let newDir = defaults.imageLocation + projectObject.dataname + '/' + pageObject.uuid + '/' + componentObject.uuid;
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir)
        }
        // Copy the tmp preview.
        fs.copyFileSync(defaults.imageLocation + projectObject.dataname + '/tmp/preview.png', newDir + '/default.png')

        return true;
    },
    deleteDefaultImage(componentObject, pageObject, projectObject) {
        let file = defaults.imageLocation + projectObject.dataname + '/' + pageObject.uuid + '/' + componentObject.uuid + '/default.png';
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }
}

module.exports = component;