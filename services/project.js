const fs = require('fs');
const db = require('./db');
const user = require('./user');
const validate = require('./validate');
const defaults = require('./defaults');
const helper = require('./helper');

const puppeteerController = require('../director/puppeteerController');

const project = {
    getProjects: async function(req) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT * FROM projects;", function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT p.* FROM projects p LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=?;", user.getUser(req).id, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getProjectByName: async function(req, name) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.get("SELECT * FROM projects WHERE dataname=?;", name, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.get("SELECT p.* FROM projects p LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.dataname=?;", user.getUser(req).id, name, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    createProject: async function(project) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(project, 'project');
        // Validate so we can take screenshots
        await puppeteerController.init(project.default_host);
        try {
            await puppeteerController.goto('/');
        }
        catch (err) {
            validationErrors.push({id: 'default_host', error: 'We could not reach that domain.'});
        }

        // Validate that the dataname is unique.
        let oldProject = await this.findDataName(project.dataname);

        if (typeof oldProject == 'object') {
            validationErrors.push({id: 'dataname', error: 'That dataname already exists for a project.'});
        }

        if (validationErrors.length) {
            return validationErrors
        }
        
        // Download favicon.
        let url = await puppeteerController.getFaviconUrl();
        let imageDir = this.createProjectDir(project.dataname);
        if (url) {
            helper.download(url, imageDir + 'icon.png');
        }
        // Download screenshot.
        await puppeteerController.resizeWindow(1280, 720);
        await puppeteerController.screenshot(imageDir + 'init.jpg');
        await puppeteerController.close();
        // Store in db
        this.createDb(project);
        return null;
    },
    createDb(project) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO projects (name, dataname, fail_directly, run_sync, default_host, default_username, default_password) VALUES (?, ?, ?, ?, ?, ?, ?);", 
                        project.name,
                        project.dataname,
                        project.fail_directly,
                        project.run_sync,
                        project.default_host,
                        project.default_username,
                        project.default_password,
                    );
                    resolve(true)
                });
            }
        );
    },
    findDataName: async function(dataname) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT * FROM projects WHERE dataname=?;", dataname, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    createProjectDir(dataname) {
        if (!fs.existsSync(defaults.imageLocation + dataname)) {
            fs.mkdirSync(defaults.imageLocation + dataname)
        }
        return defaults.imageLocation + dataname + '/';
    }
}

module.exports = project;