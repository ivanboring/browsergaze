const db = require('./db');
const user = require('../services/user');
const { 
    v1: uuidv1,
} = require('uuid');

const component = {
    getComponentsForProject: async function(req, projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT c.* FROM components c WHERE c.project_id=?;", projectId, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.project_id=c.project_id WHERE pu.user_id=? AND c.project_id=?;", user.getUser(req).id, projectId, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getComponentsForPage: async function(req, pageObject, projectObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT c.* FROM components c WHERE c.page_id=?;", pageObject.id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.project_id=c.project_idid WHERE pu.user_id=? AND c.page_id=?;", user.getUser(req).id, pageObject.id, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getBreakpointCapabilityForComponent: async function(componentObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT ccb.threshold, pb.width, pb.height, pc.capability_id, c.*, pb.id as breakpoint_id, gs.*, co.uuid as component_uuid, pc.id as project_capabilities_id \
                        FROM component_capability_breakpoint ccb \
                        LEFT JOIN components co ON co.id=ccb.component_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=ccb.breakpoint_id \
                        LEFT JOIN project_capabilities pc ON pc.id=ccb.capability_id \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        WHERE ccb.component_id=?;", componentObject.id, function(err, rows) {
                            resolve(rows)
                    });
                });
            }
        )
    },
    getComponentById: async function(req, id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.get("SELECT c.* FROM components c WHERE c.id=?;", id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.get("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.project_id=c.project_idid WHERE pu.user_id=? AND c.id=?;", user.getUser(req).id, id, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    deleteComponentById: async function(id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("DELETE FROM components WHERE id=?;", id, function(err, rows) {
                        resolve(true)
                    });
                });
            }
        )
    },
    getComponentByUuid: async function(req, uuid) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.get("SELECT c.* FROM components c WHERE c.uuid=?;", uuid, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.get("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.project_id=c.project_idid WHERE pu.user_id=? AND c.uuid=?;", user.getUser(req).id, uuid, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getRulesForComponent: async function(componentId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT r.* FROM rules r WHERE r.component_id=? ORDER BY weight ASC;", componentId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    insertComponent: async function(componentObject, pageObject, projectObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO components (page_id, project_id, uuid, name, default_visual_regression_threshold, default_browser_regression_threshold) VALUES (?, ?, ?, ?, ?, ?);", 
                        pageObject.id,
                        projectObject.id,
                        uuidv1(),
                        componentObject.name,
                        componentObject.default_visual_regression_threshold,
                        componentObject.default_browser_regression_threshold,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    updateComponent: async function(componentObject, pageObject, projectObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE components SET page_id=?, \
                        project_id=?, \
                        uuid=?, \
                        name=?, \
                        default_visual_regression_threshold=?, \
                        default_browser_regression_threshold=? \
                        WHERE id=?;", 
                        pageObject.id,
                        projectObject.id,
                        componentObject.uuid,
                        componentObject.name,
                        componentObject.default_visual_regression_threshold,
                        componentObject.default_browser_regression_threshold,
                        componentObject.id,
                    function(err) {
                        resolve(true)
                    });
                });
            }
        );
    },
    saveRules: async function(componentObject, remove) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (typeof remove == "boolean" && remove) {
                        query.run("DELETE FROM rules WHERE component_id=?", componentObject.id);
                    }
                    for (let weight in componentObject.selector) {
                        for (let ruleKey in componentObject.selector[weight]) {
                            let rule = componentObject.selector[weight][ruleKey];
                            query.run("INSERT INTO rules (component_id, key, weight, ruleset) VALUES (?, ?, ?, ?);", 
                                componentObject.id,
                                ruleKey,
                                parseInt(weight),
                                JSON.stringify(rule),
                            );
                        }
                    }
                    resolve(true);
                });
            }
        );
    },
    deleteRulesFromComponent: async function(componentObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM rules WHERE component_id=?", componentObject.id);
                    resolve(true);
                });
            }
        );
    },
    saveCapabilityBreakpoint: async function(componentObject, remove) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (typeof remove == "boolean" && remove) {
                        query.run("DELETE FROM component_capability_breakpoint WHERE component_id=?", componentObject.id);
                    }
                    for (let i in componentObject.device_breakpoint) {
                        let parts = componentObject.device_breakpoint[i].split('--');
                        query.run("INSERT INTO component_capability_breakpoint (component_id, capability_id, breakpoint_id, threshold) VALUES (?, ?, ?, ?);", 
                            componentObject.id,
                            parts[0],
                            parts[1],
                            componentObject.default_visual_regression_threshold,
                        );
                    }
                    resolve(true);
                });
            }
        )
    },
    createBrowserDiffs: async function(componentObject, projectObject, matrix) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let main in matrix) {
                        for (let br in matrix[main]) {
                            for (let diff in matrix[main][br]) {
                                query.run("INSERT INTO browser_threshold (capabilities_id_from, capabilities_id_to, breakpoint_id, browser_threshold, component_id, project_id, active) \
                                values (?, ?, ?, ?, ?, ?, 1)",
                                main,
                                diff,
                                br,
                                componentObject.default_browser_regression_threshold,
                                componentObject.id,
                                projectObject.id
                                )
                            }
                        }
                    }
                    resolve(true);
                })
            }
        );
    },
    updateBrowserDiffs: async function(componentObject, projectObject, matrix) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT * FROM browser_threshold WHERE component_id=?", componentObject.id, function(err, rows) {
                        for (let main in matrix) {
                            for (let br in matrix[main]) {
                                for (let diff in matrix[main][br]) {
                                    let found = false;
                                    for (let i in rows) {
                                        let row = rows[i];
                                        if (row.capabilities_id_from == main && row.capabilities_id_to == diff && row.breakpoint_id == br) {
                                            found = true;
                                            rows.splice(i, 1);
                                        }
                                    }
                                    if (!found) {
                                        query.run("INSERT INTO browser_threshold (capabilities_id_from, capabilities_id_to, breakpoint_id, browser_threshold, component_id, project_id, active) \
                                        values (?, ?, ?, ?, ?, ?, 1)",
                                        main,
                                        diff,
                                        br,
                                        componentObject.default_browser_regression_threshold,
                                        componentObject.id,
                                        projectObject.id
                                        )
                                    }
                                }
                            }
                        }
                        
                        // Let's destroy!!!
                        for (let row of rows) {
                            query.run("DELETE FROM browser_threshold WHERE id=?", row.id);
                        }
                        resolve(true);
                    })
                });
            }
        )
    },
    getBrowserDiffsForComponent: async function(componentId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT * FROM browser_threshold WHERE component_id=?", componentId, function(err, rows) {
                        resolve(rows)
                    })
                })
            }
        );
    },
    getBrowserThreshold: async function(thresholdId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT * FROM browser_threshold WHERE id=?", thresholdId, function(err, row) {
                        resolve(row)
                    })
                })
            }
        );
    },
    updateBrowserThreshold: async function(thresholdId, threshold) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE browser_threshold SET browser_threshold=? WHERE id=?", threshold, thresholdId, function (err, row) {
                        resolve(true)
                    })
                })
            }
        )
    },
    deleteBrowserThresholdFromCapability: async function(capabilityId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM browser_threshold WHERE capabilities_id_to=? OR capabilities_id_from=?", capabilityId, capabilityId, function(err) {
                        console.log('3', err);
                        resolve(true);
                    });
                    
                });
            }
        );
    },
    deleteCapabilityBreakpointFromComponent: async function(componentObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM component_capability_breakpoint WHERE component_id=?", componentObject.id);
                    resolve(true);
                });
            }
        );
    },
    deleteCapabilityBreakpointFromCapability: async function(capabilityId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM component_capability_breakpoint WHERE capability_id=?", capabilityId, function(err, row) {
                        console.log('1', err);
                        resolve(true);
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
                    query.get("SELECT uuid FROM components WHERE id=?;", id, function(err, row) {
                        resolve(row.uuid);
                    });
                });
            }
        );
    }
}

module.exports = component;