const db = require('./db');
const { 
    v1: uuidv1,
} = require('uuid');

const jobDb = {
    getJobFromUuid: async function (uuid) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT * FROM jobs WHERE uuid=?;", uuid, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getJobFromProjectId: async function (projectId, limit) {
        if (typeof limit !== 'number') {
            limit = 100;
        }
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT * FROM jobs WHERE project_id=? ORDER BY id DESC LIMIT ?;", projectId, limit, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getRunschemaForComponentId: async function(id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT r.* FROM rules r WHERE r.component_id=? ORDER BY r.weight ASC;", id, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    deleteJobFromProjectId: async function(projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM jobs WHERE project_id=?", 
                    projectId,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    createJob: async function(projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO jobs (uuid, project_id, max_regression, max_browser_failure, status) VALUES (?, ?, ?, ?, ?);", 
                        uuidv1(),
                        projectId,
                        0,
                        0,
                        0,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    getUuidFromId: async function(id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT uuid FROM jobs WHERE id=?;", id, function(err, row) {
                        resolve(row.uuid);
                    });
                });
            }
        );
    },
}

module.exports = jobDb;