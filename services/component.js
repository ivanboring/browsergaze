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

const component = {
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
    createComponent: async function(componentObject, pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(componentObject, 'component');
        if (validationErrors.length) {
            return validationErrors
        }

        // Store in db
        componentObject.id = await this.componentDB(componentObject, pageObject, projectObject);
        componentObject.uuid = await this.getUuidFromId(componentObject.id);
        // Store rules
        await this.rulesDB(componentObject)
        // Store components capability/breakpoints
        await this.capabilityBreakpointDB(componentObject)
        // Store the image
        this.saveDefaultImage(componentObject, pageObject, projectObject);
        return null;
    },
    componentDB: async function(componentObject, pageObject, projectObject) {
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
    rulesDB: async function(componentObject) {
        let query = db.getDb();
        query.serialize(function() {
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
    capabilityBreakpointDB: async function(componentObject) {
        let query = db.getDb();
        query.serialize(function() {
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