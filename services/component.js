const db = require('./db');
const fs = require('fs');
const user = require('./user');
const validate = require('./validate');
const defaults = require('./defaults')
const { 
    v1: uuidv1,
} = require('uuid');
const puppeteerDirector = require('../directors/puppeteerDirector');
const { resolve } = require('path');
const { query } = require('express');
const capabilities = require('./capabilities');

const component = {
    getComponentsForProject: async function(req, project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    if (user.isAdmin(req)) {
                        query.all("SELECT c.* FROM components c WHERE c.project_id=?;", project_id, function(err, rows) {
                            resolve(rows)
                        });
                    } else {
                        query.all("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.page_id=c.project_id WHERE pu.user_id=? AND c.project_id=?;", user.getUser(req).id, project_id, function(err, rows) {
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
                        query.all("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.page_id=c.project_idid WHERE pu.user_id=? AND c.page_id=?;", user.getUser(req).id, pageObject.id, function(err, rows) {
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
                    query.all("SELECT ccb.threshold, pb.width, pb.height, pc.capability_id, c.*, pb.id as breakpoint_id, gs.*, co.uuid as component_uuid \
                        FROM component_capability_breakpoint ccb \
                        LEFT JOIN components co ON co.id=ccb.component_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=ccb.breakpoint_id \
                        LEFT JOIN project_capabilities pc ON pc.id=ccb.capability_id \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        WHERE ccb.component_id=?;", componentObject.id, function(err, rows) {
                            let groupedResult = {};
                            for (let t in rows) {
                                if (!(rows[t].capability_id in groupedResult)) {
                                    groupedResult[rows[t].capability_id] = [];
                                }
                                groupedResult[rows[t].capability_id].push(rows[t]);
                            }
                            resolve(groupedResult)
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
                        query.get("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.page_id=c.project_idid WHERE pu.user_id=? AND c.id=?;", user.getUser(req).id, id, function(err, rows) {
                            resolve(rows)
                        });
                    }
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
                        query.get("SELECT c.* FROM components c LEFT JOIN project_user pu ON pu.page_id=c.project_idid WHERE pu.user_id=? AND c.uuid=?;", user.getUser(req).id, uuid, function(err, rows) {
                            resolve(rows)
                        });
                    }
                });
            }
        )
    },
    getFullComponent: async function (componentObject) {
        componentObject.capabilities_and_breakpoints = await capabilities.getCapabilitiesAndBreakpointsForComponent(componentObject.id);
        componentObject.rules = await this.getRulesForComponent(componentObject.id);
        return componentObject;
    },
    createComponent: async function(componentObject, pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(componentObject, 'component');
        if (validationErrors.length) {
            return validationErrors
        }

        // Store in db
        componentObject.id = await this.insertComponent(componentObject, pageObject, projectObject);
        componentObject.uuid = await this.getUuidFromId(componentObject.id);
        // Store rules
        await this.rulesDB(componentObject)
        // Store components capability/breakpoints
        await this.capabilityBreakpointDB(componentObject)
        // Store the image
        this.saveDefaultImage(componentObject, pageObject, projectObject);
        return null;
    },
    editComponent: async function(componentObject, pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(componentObject, 'component');
        if (validationErrors.length) {
            return validationErrors
        }

        // Store in db
        componentObject.uuid = await this.getUuidFromId(componentObject.id);
        await this.updateComponent(componentObject, pageObject, projectObject);
        
        // Store rules
        await this.rulesDB(componentObject, true)
        // Store components capability/breakpoints
        await this.capabilityBreakpointDB(componentObject, true)
        return null;
    },
    getRulesForComponent: async function(component_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT r.* FROM rules r WHERE r.component_id=? ORDER BY weight ASC;", component_id, function(err, rows) {
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
    rulesDB: async function(componentObject, remove) {
        let query = db.getDb();
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
            resolve("true");
        });
    },
    capabilityBreakpointDB: async function(componentObject, remove) {
        let query = db.getDb();
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
            resolve("true");
        });
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
    },
    saveDefaultImage(componentObject, pageObject, projectObject) {
        let newDir = defaults.imageLocation + projectObject.dataname + '/' + pageObject.uuid + '/' + componentObject.uuid;
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir)
        }
        // Copy the tmp preview.
        fs.copyFileSync(defaults.imageLocation + projectObject.dataname + '/tmp/preview.png', newDir + '/default.png')

        return true;
    }
}

module.exports = component;