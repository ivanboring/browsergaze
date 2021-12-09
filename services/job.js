const db = require('./db');
const helper = require('./helper');
const { 
    v1: uuidv1,
} = require('uuid');
const capabilities = require('./capabilities');

const job = {
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
    getJobFromProjectId: async function (project_id, limit) {
        if (typeof limit !== 'number') {
            limit = 100;
        }
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT * FROM jobs WHERE project_id=? ORDER BY id DESC LIMIT ?;", project_id, limit, function(err, rows) {
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
    createJob: async function(project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO jobs (uuid, project_id, max_regression, max_browser_failure, status) VALUES (?, ?, ?, ?, ?);", 
                        uuidv1(),
                        project_id,
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

module.exports = job;