const db = require('./db');
const helper = require('./helper');
const { 
    v1: uuidv1,
} = require('uuid');
const capabilities = require('./capabilities');
const screenshot = require('./screenshot');

const baseline = {
    getBaseline: async function (project_id, component_id, capability_id, breakpoint_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT * \
                        FROM baseline \
                        WHERE project_id=? \
                        AND component_id=? \
                        AND capability_id=? \
                        AND breakpoint_id=?;", project_id, component_id, capability_id, breakpoint_id, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    getBaselineForScreenshot: async function (screenshotObject) {
        return await this.getBaseline(screenshotObject.project_id, screenshotObject.component_id, screenshotObject.capability_id, screenshotObject.breakpoint_id)
    },
    getBaselineForScreenshots: async function (screenshots, project_id) {
        let baselines = await this.getBaselineForProject(project_id);
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
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT * \
                        FROM baseline \
                        WHERE project_id=?;", project_id, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    newBaseline: async function(screenshotObject) {
        let query = db.getDb();
        await screenshot.updateBaseline(screenshotObject);
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE \
                        FROM baseline \
                        WHERE project_id=? \
                        AND component_id=? \
                        AND capability_id=? \
                        AND breakpoint_id=?;", 
                        screenshotObject.project_id,
                        screenshotObject.component_id,
                        screenshotObject.capability_id,
                        screenshotObject.breakpoint_id
                    );
                    query.run("INSERT INTO baseline (project_id, component_id, capability_id, breakpoint_id, created, path, screenshot_id) \
                        VALUES (?, ?, ?, ?, ?, ?, ?);", 
                        screenshotObject.project_id,
                        screenshotObject.component_id,
                        screenshotObject.capability_id,
                        screenshotObject.breakpoint_id,
                        Date.now(),
                        screenshotObject.path,
                        screenshotObject.id,
                        function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    }
}

module.exports = baseline;