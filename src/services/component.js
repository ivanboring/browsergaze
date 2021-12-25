const componentDb = require('../models/componentDb');
const fs = require('fs');
const validate = require('./validate');
const defaults = require('./defaults')
const capabilities = require('./capabilities');
const project = require('./project');
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

        // Check so two main diffs does not exist.
        let mainCount = 0;
        let diffCount = 0;
        for (let diff of componentObject.browser_diffs) {
            if (diff.substr(0, 5) == 'main_') {
                mainCount++;
            }
            if (diff.substr(0, 5) == 'diff_') {
                diffCount++;
            }
        }
        if (mainCount > 1 || mainCount == 1 && diffCount == 0 || diffCount > 0 && mainCount == 0) {
            validationErrors.push({id: 'device_breakpoint', error: 'You have to only have one main and at least one diff or nothing at all.'});
        }
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
        await component.createBrowserDiffs(componentObject, projectObject);
        return null;
    },
    editComponent: async function(componentObject, pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(componentObject, 'component');

        // Check so two main diffs does not exist.
        let mainCount = 0;
        let diffCount = 0;
        for (let diff of componentObject.browser_diffs) {
            if (diff.substr(0, 5) == 'main_') {
                mainCount++;
            }
            if (diff.substr(0, 5) == 'diff_') {
                diffCount++;
            }
        }
        if (mainCount > 1 || mainCount == 1 && diffCount == 0 || diffCount > 0 && mainCount == 0) {
            validationErrors.push({id: 'device_breakpoint', error: 'You have to only have one main and at least one diff or nothing at all.'});
        }
        if (validationErrors.length) {
            return validationErrors
        }

        // Store in db
        componentObject.uuid = await componentDb.getUuidFromId(componentObject.id);
        await componentDb.updateComponent(componentObject, pageObject, projectObject);
        
        // Store rules
        await componentDb.saveRules(componentObject, true)
        // Store components capability/breakpoints
        await componentDb.saveCapabilityBreakpoint(componentObject, true);
        // Store browser diffs
        await component.updateBrowserDiffs(componentObject, projectObject);
        return null;
    },
    deleteComponent: async function(req, componentObject, pageObject) {
        const projectObject = await project.getProjectById(req, componentObject.project_id);
        this.deleteComponentForProject(req, componentObject, projectObject, pageObject);
    },
    deleteComponentForProject: async function(req, componentObject, projectObject, pageObject) {
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
    },
    createBrowserDiffs: async function(componentObject, projectObject) {
        let matrix = this.getBrowserDiffMatrix(componentObject);
        componentDb.createBrowserDiffs(componentObject, projectObject, matrix);
    },
    updateBrowserDiffs: async function(componentObject, projectObject) {
        let matrix = this.getBrowserDiffMatrix(componentObject);
        componentDb.updateBrowserDiffs(componentObject, projectObject, matrix);
    },
    getBrowserDiffsForComponent: async function(componentId) {
        return await componentDb.getBrowserDiffsForComponent(componentId);
    },
    getBrowserDiffs: async function(componentObject) {
        let browserDiffs = await componentDb.getBrowserDiffsForComponent(componentObject.id);
        let values = [];
        for (let row of browserDiffs) {
            let mainValue = 'main_' + row.capabilities_id_from;
            let diffValue = 'diff_' + row.capabilities_id_to;
            if (!values.includes(mainValue)) {
                values.push(mainValue);
            }
            if (!values.includes(diffValue)) {
                values.push(diffValue);
            }
        }
        return values;
    },
    getBrowserDiffMatrix: function(componentObject) {
        let diffs = [];
        let main = '';

        for (let diff of componentObject.browser_diffs) {
            switch (diff.substr(0, 5)) {
                case 'diff_':
                    diffs.push(diff.substr(5));
                    break;
                case 'main_':
                    main = diff.substr(5);
                    break;
            }
        }

        let breakpoints = [];
        let others = {};
        for (let devbr of componentObject.device_breakpoint) {
            let parts = devbr.split('--');
            if (parts[0] == main) {
                breakpoints.push(parts[1])
            } else {
                if (!(parts[1] in others)) {
                    others[parts[1]] = {};
                }
                others[parts[1]][parts[0]] = parts[0];
            }
        }
        
        let matrix = {}
        matrix[main] = {}
        for (let mainbr of breakpoints) {
            if (mainbr in others) {
                if (!(mainbr in matrix)) {
                    matrix[main][mainbr] = {};
                }
                for (let i in others[mainbr]) {
                    if (diffs.includes(i)) {
                        matrix[main][mainbr][i] = i;
                    }
                }
            }
        }
        return matrix;
    }
}

module.exports = component;