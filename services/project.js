const fs = require('fs');
const db = require('./db');
const user = require('./user');
const validate = require('./validate');
const defaults = require('./defaults');
const helper = require('./helper');
const puppeteerDirector = require('../directors/puppeteerDirector');
const svgexport = require('svgexport');
const capabilities = require('./capabilities');

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
    getProjectById: async function(req, id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.get("SELECT * FROM projects WHERE id=?;", id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.get("SELECT p.* FROM projects p LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.id=?;", user.getUser(req).id, id, function(err, rows) {
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
    getEditableProjectByName: async function(req, name) {
        let projectObject = await this.getProjectByName(req, name);
        let capabilitiesList = await capabilities.getCapabilitiesForProject(projectObject.id);
        projectObject.capability = [];
        for (let x in capabilitiesList) {
            projectObject.capability.push(capabilitiesList[x].id)
        }
        projectObject.breakpoint_height = [];
        projectObject.breakpoint_width = [];
        let breakpoints = await this.getProjectBreakpoints(projectObject.id);
        for (let x in breakpoints) {
            projectObject.breakpoint_width.push(breakpoints[x].width);
            projectObject.breakpoint_height.push(breakpoints[x].height);
        }
        return projectObject;
    },
    getProjectCapabilities: async function(req, project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT DISTINCT c.*, gs.name as server_name, pc.id as id FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id LEFT JOIN project_capabilities pc ON c.id=pc.capability_id LEFT JOIN projects p ON p.id=pc.project_id WHERE p.id=?;", project_id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT c.*, gs.name as server_name, pc.id as id FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id LEFT JOIN project_capabilities pc ON c.id=pc.capability_id LEFT JOIN FROM projects p ON p.id=pc.project_id LEFT JOIN project_user pu ON pu.page_id=p.id WHERE pu.user_id=? AND p.project_id=?;", user.getUser(req).id, project_id, function(err, rows) {
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
        let formErrors = validate.validateEntity(project, 'project');
        let validationErrors = formErrors.concat(await this.extraProjectValidation(project, true));
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
        let projectId = await this.createProjectDb(project);
        // Store capabilities and breakpoints.
        await this.createProjectCapabilities(projectId, project.capability);
        await this.createProjectBreakpoints(projectId, project.breakpoint_width, project.breakpoint_height);
        return null;
    },
    updateProject: async function(project) {
        let formErrors = validate.validateEntity(project, 'project');
        let validationErrors = formErrors.concat(await this.extraProjectValidation(project, false));
        if (validationErrors.length) {
            return validationErrors
        }
        await this.updateProjectDb(project);
        await this.updateProjectCapabilities(project.id, project.capability);
        //TODO: update breakpoints
        return null;
    },
    extraProjectValidation: async function(project, checkDataname) {
        let validationErrors = [];
        // Validate so we can take screenshots
        await puppeteerDirector.init(project.default_host_path, 'test');
        try {
            await puppeteerDirector.goto('/', 'test');
        }
        catch (err) {
            validationErrors.push({id: 'default_host_path', error: 'We could not reach that domain.'});
        }

        // Validate that the dataname is unique.
        if (checkDataname) {
            let oldProject = await this.findDataName(project.dataname);

            if (typeof oldProject == 'object') {
                validationErrors.push({id: 'dataname', error: 'That dataname already exists for a project.'});
            }
        }

        // Validate that one capability is chosen.
        if (this.validateCapabilities(project)) {
            validationErrors.push({id: 'capability', error: 'You have to check at least one capability.'});
        }
        return validationErrors;
    },
    updateProjectDb(project) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE projects SET name=?, dataname=?, fail_directly=?, run_sync=?, default_host_path=?, default_username=?, default_password=? WHERE id=?;", 
                        project.name,
                        project.dataname,
                        project.fail_directly,
                        project.run_sync,
                        project.default_host_path,
                        project.default_username,
                        project.default_password,
                        project.id,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    updateProjectCapabilities(projectId, capabilities) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    let currentCapabilities = [];
                    let newCapabilities = [];
                    query.all('SELECT * FROM project_capabilities WHERE project_id=?', projectId, (err, rows) => {
                        if (typeof rows !== 'undefined') {
                            for (let x in rows) {
                                currentCapabilities.push(rows[x].id.toString());
                            }
                        }

                        for (let x in capabilities) {
                            if (!currentCapabilities.includes(capabilities[x])) {
                                newCapabilities.push(capabilities[x]);
                            } else {
                                const index = currentCapabilities.indexOf(capabilities[x]);
                                if (index > -1) {
                                    currentCapabilities.splice(index, 1);
                                }
                            }
                        }

                        for (let capability of newCapabilities) {
                            query.run("INSERT INTO project_capabilities (project_id, capability_id) VALUES (?, ?);", 
                                projectId,
                                capability,
                            );
                        }

                        for (let capability of currentCapabilities) {
                            query.run("DELETE FROM project_capabilities WHERE project_id=? AND capability_id=?;", 
                                projectId,
                                capability,
                            );
                        }

                        resolve(true)
                    });
                });
            }
        );
    },
    createProjectDb(project) {
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
    getProjectBreakpoints: async function(projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                        query.all("SELECT * FROM project_breakpoints WHERE project_id=?;", projectId, function(err, rows) {
                            resolve(rows)
                        });
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