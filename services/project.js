const fs = require('fs');
const db = require('./db');
const user = require('./user');
const validate = require('./validate');
const defaults = require('./defaults');
const helper = require('./helper');
const puppeteerDirector = require('../directors/puppeteerDirector');
const svgexport = require('svgexport');

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
    getProjectCapabilities: async function(req, project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT c.*, gs.name as server_name FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id LEFT JOIN project_capabilities pc ON c.id=pc.capability_id LEFT JOIN projects p ON p.id=pc.project_id WHERE p.id=?;", project_id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT c.*, gs.name as server_name FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id LEFT JOIN project_capabilities pc ON c.id=pc.capability_id LEFT JOIN FROM projects p ON p.id=pc.project_id LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.project_id=?;", user.getUser(req).id, project_id, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getProjectBreakpoints: async function(req, project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT pb.* FROM project_breakpoints pb LEFT JOIN projects p ON p.id=pb.project_id WHERE p.id=?;", project_id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT pb.* FROM project_breakpoints pb LEFT JOIN projects p ON p.id=pb.project_id LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.project_id=?;", user.getUser(req).id, project_id, function(err, rows) {
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
        await puppeteerDirector.init(project.default_host_path, 'test');
        try {
            await puppeteerDirector.goto('/', 'test');
        }
        catch (err) {
            validationErrors.push({id: 'default_host_path', error: 'We could not reach that domain.'});
        }

        // Validate that the dataname is unique.
        let oldProject = await this.findDataName(project.dataname);

        if (typeof oldProject == 'object') {
            validationErrors.push({id: 'dataname', error: 'That dataname already exists for a project.'});
        }

        // Validate that one capability is chosen.
        if (this.validateCapabilities(project)) {
            validationErrors.push({id: 'capability', error: 'You have to check at least one capability.'});
        }

        if (validationErrors.length) {
            return validationErrors
        }
        
        // Download favicon.
        let url = await puppeteerDirector.getFaviconUrl('test');

        let imageDir = this.createProjectDir(project.dataname);
        if (url) {
            if (url.substr(-4) == '.svg') {
                svgexport.render([{
                    input: [url],
                    output: imageDir + 'icon.png'
                }]);
            } else {
                helper.download(url, imageDir + 'icon.png');
            }
        }
        // Download screenshot.
        await puppeteerDirector.resizeWindow(1280, 720, 'test');
        await puppeteerDirector.screenshot(imageDir + 'init.jpg', 'test');
        await puppeteerDirector.close('test');
        // Store in db.
        let projectId = await this.createDb(project);
        // Store capabilities and breakpoints.
        await this.createProjectCapabilities(projectId, project.capability);
        await this.createProjectBreakpoints(projectId, project.breakpoint_width, project.breakpoint_height);
        return null;
    },
    createDb(project) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO projects (name, dataname, fail_directly, run_sync, default_host_path, default_username, default_password) VALUES (?, ?, ?, ?, ?, ?, ?);", 
                        project.name,
                        project.dataname,
                        project.fail_directly,
                        project.run_sync,
                        project.default_host_path,
                        project.default_username,
                        project.default_password,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    createProjectCapabilities(projectId, capabilities) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let capability of capabilities) {
                        query.run("INSERT INTO project_capabilities (project_id, capability_id) VALUES (?, ?);", 
                            projectId,
                            capability,
                        );
                    }
                    resolve(true)
                });
            }
        );
    },
    createProjectBreakpoints(projectId, breakpointWidth, breakpointHeight) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let x in breakpointWidth) {
                        query.run("INSERT INTO project_breakpoints (project_id, width, height) VALUES (?, ?, ?);", 
                            projectId,
                            breakpointWidth[x],
                            breakpointHeight[x],
                        );
                    }
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
    },
    validateCapabilities(project) {
        return 'capability' in project ? false : true;
    }
}

module.exports = project;