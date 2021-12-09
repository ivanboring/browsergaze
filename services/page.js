const db = require('./db');
const fs = require('fs');
const user = require('./user');
const validate = require('./validate');
const defaults = require('./defaults')
const { 
    v1: uuidv1,
} = require('uuid');
const puppeteerDirector = require('../directors/puppeteerDirector');

const page = {
    getPagesByProjectId: async function(req, project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT pg.* FROM pages pg WHERE pg.project_id=?;", project_id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT pg.* FROM pages pg LEFT JOIN projects p ON p.id=pg.project_id LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.project_id=?;", user.getUser(req).id, project_id, function(err, rows) {
                            resolve(rows)
                        });
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
                        query.get("SELECT pg.* FROM pages pg LEFT JOIN projects p ON p.id=pg.project_id LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.ids=?;", user.getUser(req).id, id, function(err, rows) {
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
                        query.get("SELECT pg.* FROM pages pg LEFT JOIN projects p ON p.id=pg.project_id LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.uuid=?;", user.getUser(req).id, uuid, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    createPage: async function(pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(pageObject, 'page');
        // Validate so we can take screenshots
        await puppeteerDirector.init(projectObject.default_host_path);
        try {
            await puppeteerDirector.goto(pageObject.path);
        }
        catch (err) {
            validationErrors.push({id: 'path', error: 'We could not reach that path.'});
        }

        if (validationErrors.length) {
            return validationErrors
        }

        pageObject.uuid = uuidv1();
        pageObject.project_id = projectObject.id;

        let imagedir = this.createPageDir(projectObject.dataname, pageObject.uuid);

        // Download screenshot.
        await puppeteerDirector.resizeWindow(1280, 720);
        await puppeteerDirector.screenshot(imagedir + 'init.jpg');
        await puppeteerDirector.close();
        // Store in db
        this.createDb(pageObject);
        return null;
    },
    createDb(pageObject) {
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
    createPageDir(projectName, pageUuid) {
        if (!fs.existsSync(defaults.imageLocation + projectName + '/' + pageUuid)) {
            fs.mkdirSync(defaults.imageLocation + projectName + '/' + pageUuid)
        }
        return defaults.imageLocation + projectName + '/' + pageUuid + '/';
    }
}

module.exports = page;