const db = require('./db');
const user = require('../services/user');

const projectDb = {
    getProjects: async function(req) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT * FROM projects ORDER BY name ASC;", function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT p.* FROM projects p LEFT JOIN project_user pu ON pu.project_id=p.id WHERE pu.user_id=? ORDER BY name ASC;", user.getUser(req).id, function(err, rows) {
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
                        query.get("SELECT p.* FROM projects p LEFT JOIN project_user pu ON pu.project_id=p.id WHERE pu.user_id=? AND p.id=?;", user.getUser(req).id, id, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getProjectByIdWithoutReq: async function(id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT * FROM projects WHERE id=?;", id, function(err, rows) {
                        resolve(rows)
                    });
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
                        query.get("SELECT p.* FROM projects p LEFT JOIN project_user pu ON pu.project_id=p.id WHERE pu.user_id=? AND p.dataname=?;", user.getUser(req).id, name, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getProjectCapabilities: async function(req, projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT DISTINCT c.*, gs.name as server_name, pc.id as id FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id LEFT JOIN project_capabilities pc ON c.id=pc.capability_id LEFT JOIN projects p ON p.id=pc.project_id WHERE p.id=?;", projectId, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT c.*, gs.name as server_name, pc.id as id FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id LEFT JOIN project_capabilities pc ON c.id=pc.capability_id LEFT JOIN FROM projects p ON p.id=pc.project_id LEFT JOIN project_user pu ON pu.project_id=p.id WHERE pu.user_id=? AND p.project_id=?;", user.getUser(req).id, projectId, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getProjectBreakpoints: async function(req, projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT pb.* FROM project_breakpoints pb LEFT JOIN projects p ON p.id=pb.project_id WHERE p.id=?;", projectId, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT pb.* FROM project_breakpoints pb LEFT JOIN projects p ON p.id=pb.project_id LEFT JOIN project_user pu ON pu.project_id=p.id WHERE pu.user_id=? AND p.project_id=?;", user.getUser(req).id, projectId, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    updateProject(project) {
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
                                currentCapabilities.push(rows[x].capability_id.toString());
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
    updateProjectBreakpoints: async function(projectId, breakpoint_width, breakpoint_height) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    let currentBreakpoints = [];
                    let newBreakpoints = [];
                    query.all('SELECT * FROM project_breakpoints WHERE project_id=?', projectId, (err, rows) => {
                        if (typeof rows !== 'undefined') {
                            for (let x in rows) {
                                currentBreakpoints.push(rows[x].width.toString() + '__' + rows[x].height.toString());
                            }
                        }

                        for (let x in breakpoint_width) {
                            let newIndex = breakpoint_width[x] + '__' + breakpoint_height[x];
                            if (!currentBreakpoints.includes(newIndex)) {
                                newBreakpoints.push(newIndex);
                            } else {
                                const index = currentBreakpoints.indexOf(newIndex);
                                if (index > -1) {
                                    currentBreakpoints.splice(index, 1);
                                }
                            }
                        }

                        for (let capability of newBreakpoints) {
                            let parts = capability.split('__');
                            query.run("INSERT INTO project_breakpoints (project_id, width, height) VALUES (?, ?, ?);", 
                                projectId,
                                parts[0],
                                parts[1],
                            );
                        }

                        for (let capability of currentBreakpoints) {
                            let parts = capability.split('__');
                            query.run("DELETE FROM project_breakpoints WHERE project_id=? AND width=? AND height=?;", 
                                projectId,
                                parts[0],
                                parts[1],
                            );
                        }

                        resolve(true)
                    });
                })
            }
        )       
    },
    createProject(project) {
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
    deleteProject: async function(project) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM projects WHERE id=?;", 
                        project.id,
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
    }
}

module.exports = projectDb;