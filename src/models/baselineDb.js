const db = require('./db');
const screenshot = require('../services/screenshot');

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
    deleteBaselineForComponent: async function (componentObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM baselines WHERE component_id=?;", 
                    componentObject.component_id, function(err) {
                        resolve(true);
                    });
                });
            }
        );
    },
    deleteBaselineForCapabilityId: async function (capabilityId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM baseline WHERE capability_id=?;", 
                    capabilityId, function(err) {
                        console.log('4', err);
                        resolve(true);
                    });
                });
            }
        );
    },
    deleteBaselineForProjectId: async function (projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM baselines WHERE project_id=?;", 
                    projectId, function(err) {
                        resolve(true);
                    });
                });
            }
        );
    },
    setBaseline: async function(screenshotObject) {
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