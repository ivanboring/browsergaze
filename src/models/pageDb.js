const db = require('./db');
const user = require('../services/user');

const pageDb = {
    getPagesByProjectId: async function(req, projectId) {
        let query = db.getDb();
        let hasProject = await user.hasProject(req, projectId);
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.hasPermission(req, 'view-all-projects') || (user.hasPermission(req, 'view-own-projects') && hasProject)) {
                        query.all("SELECT pg.* FROM pages pg WHERE pg.project_id=?;", projectId, function(err, rows) {
                            resolve(rows)
                        });
                    }else {
                        resolve([]);
                    }
                });
            }
        )
    },
    getPageById: async function(req, id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.get("SELECT pg.* FROM pages pg WHERE pg.id=?;", id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.get("SELECT pg.* FROM pages pg LEFT JOIN projects p ON p.id=pg.project_id LEFT JOIN project_user pu ON pu.project_id=p.id WHERE pu.user_id=? AND p.ids=?;", user.getUser(req).id, id, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getPageByUuid: async function(req, uuid) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.get("SELECT pg.* FROM pages pg WHERE pg.uuid=?;", uuid, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.get("SELECT pg.* FROM pages pg LEFT JOIN projects p ON p.id=pg.project_id LEFT JOIN project_user pu ON pu.project_id=p.id WHERE pu.user_id=? AND p.uuid=?;", user.getUser(req).id, uuid, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    createPage(pageObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO pages (uuid, name, path, project_id) VALUES (?, ?, ?, ?);", 
                        pageObject.uuid,
                        pageObject.name,
                        pageObject.path,
                        pageObject.project_id,
                    );
                    resolve(true)
                });
            }
        );
    },
    updatePage(pageObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE pages set uuid=?, name=?, path=?, project_id=? WHERE id=?;", 
                        pageObject.uuid,
                        pageObject.name,
                        pageObject.path,
                        pageObject.project_id,
                        pageObject.id, function(err, row) {
                            console.log(err);
                            console.log(pageObject);
                            resolve(true)
                        }
                    );
                    
                });
            }
        );
    },
    deletePage: async function(page) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM pages WHERE id=?", 
                        page.id
                    );
                    resolve(true)
                });
            }
        );
    },
    deletePageFromProjectId: async function(projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM pages WHERE project_id=?", 
                        projectId
                    );
                    resolve(true)
                });
            }
        );
    },
}

module.exports = pageDb;