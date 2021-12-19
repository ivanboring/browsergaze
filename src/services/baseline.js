const baselineDb = require('../model/baselineDb');

const baseline = {
    getBaseline: async function (project_id, component_id, capability_id, breakpoint_id) {
        return await baselineDb.getBaseline(project_id, component_id, capability_id, breakpoint_id);
    },
    getBaselineForScreenshot: async function (screenshotObject) {
        return await baselineDb.getBaseline(screenshotObject.project_id, screenshotObject.component_id, screenshotObject.capability_id, screenshotObject.breakpoint_id)
    },
    getBaselineForScreenshots: async function (screenshots, project_id) {
        let baselines = await baselineDb.getBaselineForProject(project_id);
        let newBaselines = [];
        for (let i in screenshots) {
            let found = false;
            for (let x in baselines) {
                let s = screenshots[i];
                let b = baselines[x];
                if (s.component_id == b.component_id && s.capability_id == b.capability_id && s.breakpoint_id == b.breakpoint_id) {
                    newBaselines.push(b);
                    found = true;
                    break;
                }
            }
            if (!found) {
                newBaselines.push({});
            }
        }
        return newBaselines;
    },
    getBaselineForProject: async function (project_id) {
        return await baselineDb.getBaselineForProject(project_id);
    },
    deleteBaselineForComponent: async function (componentObject) {
        return await baselineDb.deleteBaselineForComponent(componentObject);
    },
    setBaseline: async function(screenshotObject) {
        return await baselineDb.setBaseline(screenshotObject);
    }
}

module.exports = baseline;