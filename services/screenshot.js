const db = require('./db');
const helper = require('./helper');
const { 
    v1: uuidv1,
} = require('uuid');
const capabilities = require('./capabilities');

const screenshot = {
    getScreenshot: async function (screenshot_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT s.*, c.name as component_name, p.name as page_name, pb.width, pb.height, cb.browser_name, cb.browser_version, \
                        cb.platform, cb.platform_version, gs.server_type \
                        FROM screenshots s LEFT JOIN pages p ON p.id=s.page_id \
                        LEFT JOIN components c ON c.id=s.component_id \
                        LEFT JOIN project_capabilities pc ON pc.id=s.capability_id \
                        LEFT JOIN capabilities cb ON pc.capability_id=cb.id \
                        LEFT JOIN generator_servers gs ON gs.id=cb.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=s.breakpoint_id \
                        WHERE s.id=? ORDER BY s.created_time ASC;", screenshot_id, function(err, row) {
                        row.created_time = helper.prettyDate(row.created_time);
                        resolve(row)
                    });
                });
            }
        )
    },
    getScreenshots: async function (project_id, conditions, sort_key, sort_order, limit, page) {
        if (typeof conditions == 'undefined') {
            conditions = {};
        }
        if (typeof sort_key == 'undefined' || !sort_key.includes['created_time']) {
            sort_key = 'created_time';
        }
        if (typeof sort_order == 'undefined' || !sort_order.includes['ASC', 'DESC']) {
            sort_order = 'DESC';
        }
        if (typeof limit != 'number') {
            limit = 50;
        }
        if (typeof page != 'number') {
            limit = 0;
        }

        let whereString = ['s.project_id=?'];
        let whereParameters = [project_id];
        for (let key in conditions) {
            switch (key) {
                case 'page_id':
                case 'component_id':
                case 'job_id':
                case 'status':
                case 'capability_id':
                case 'breakpoint_id':
                case 'is_baseline':
                case 'error':
                    if (conditions[key]) {
                        whereString.push('s.' + key + '=?');
                        whereParameters.push(conditions[key]);
                    }
                    break;
            }
        }
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT s.*, c.name as component_name, p.name as page_name, pb.width, pb.height, cb.browser_name, cb.browser_version, \
                        cb.platform, cb.platform_version, gs.server_type \
                        FROM screenshots s LEFT JOIN pages p ON p.id=s.page_id \
                        LEFT JOIN components c ON c.id=s.component_id \
                        LEFT JOIN project_capabilities pc ON pc.id=s.capability_id \
                        LEFT JOIN capabilities cb ON pc.capability_id=cb.id \
                        LEFT JOIN generator_servers gs ON gs.id=cb.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=s.breakpoint_id \
                        WHERE " + whereString.join(' AND ') + " ORDER BY " + sort_key + " " + sort_order + ";", whereParameters, function(err, rows) {
                        for (let i in rows) {
                            rows[i].created_time_formatted = helper.prettyDate(rows[i].created_time);
                        }
                        rows = capabilities.getCapabilitiesForStyling(rows);
                        resolve(rows)
                    });
                });
            }
        )
    },
    getScreenshotsFromJob: async function (jobObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT s.*, c.name as component_name, p.name as page_name, pb.width, pb.height, cb.browser_name, cb.browser_version, \
                        cb.platform, cb.platform_version, gs.server_type \
                        FROM screenshots s LEFT JOIN pages p ON p.id=s.page_id \
                        LEFT JOIN components c ON c.id=s.component_id \
                        LEFT JOIN project_capabilities pc ON pc.id=s.capability_id \
                        LEFT JOIN capabilities cb ON pc.capability_id=cb.id \
                        LEFT JOIN generator_servers gs ON gs.id=cb.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=s.breakpoint_id \
                        WHERE s.job_id=? ORDER BY s.created_time ASC;", jobObject.id, function(err, rows) {
                        for (let i in rows) {
                            rows[i].created_time_formatted = helper.prettyDate(rows[i].created_time);
                        }
                        rows = capabilities.getCapabilitiesForStyling(rows);
                        resolve(rows)
                    });
                });
            }
        )
    },
    getScreenshotsFromIds: async function (ids) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    let args = [];
                    for (let t in ids) {
                        args.push('?');
                    }
                    query.all("SELECT s.*, c.name as component_name, p.name as page_name, pb.width, pb.height, cb.browser_name, cb.browser_version, \
                        cb.platform, cb.platform_version, gs.server_type \
                        FROM screenshots s LEFT JOIN pages p ON p.id=s.page_id \
                        LEFT JOIN components c ON c.id=s.component_id \
                        LEFT JOIN project_capabilities pc ON pc.id=s.capability_id \
                        LEFT JOIN capabilities cb ON pc.capability_id=cb.id \
                        LEFT JOIN generator_servers gs ON gs.id=cb.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=s.breakpoint_id \
                        WHERE s.id IN (" + args.join(',') + ") ORDER BY s.created_time ASC;", ids, function(err, rows) {
                        for (let i in rows) {
                            rows[i].created_time_formatted = helper.prettyDate(rows[i].created_time);
                        }
                        rows = capabilities.getCapabilitiesForStyling(rows);
                        resolve(rows)
                    });
                });
            }
        )
    },
    getUnrunScreenshots: async function (lastId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT s.*, c.name as component_name, p.name as page_name, p.path as page_path, pt.default_host_path, pb.width, pb.height \
                        FROM screenshots s \
                        LEFT JOIN pages p ON p.id=s.page_id \
                        LEFT JOIN projects pt ON s.project_id=pt.id \
                        LEFT JOIN components c ON c.id=s.component_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=s.breakpoint_id \
                        WHERE s.id > ? AND s.status=0 ORDER BY s.id ASC;", lastId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        );
    },
    getUndiffedScreenshots: async function (lastId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT s.*, c.name as component_name, p.name as page_name, p.path as page_path, pt.default_host_path, pb.width, pb.height \
                        FROM screenshots s \
                        LEFT JOIN pages p ON p.id=s.page_id \
                        LEFT JOIN projects pt ON s.project_id=pt.id \
                        LEFT JOIN components c ON c.id=s.component_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=s.breakpoint_id \
                        WHERE s.id > ? AND s.status=2 ORDER BY s.id ASC;", lastId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        );
    },
    setScreenshotStatus: async function (id, status) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE screenshots SET status=? WHERE id=?;", 
                        status,
                        id,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    createQueuedScreenshot: async function (queue_data) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO screenshots (project_id, page_id, component_id, job_id, path, created_time, status, capability_id, breakpoint_id, generator_server) \
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", 
                        queue_data.project_id,
                        queue_data.page_id,
                        queue_data.component_id,
                        queue_data.job_id,
                        queue_data.path,
                        queue_data.created_time,
                        queue_data.status,
                        queue_data.capability_id,
                        queue_data.breakpoint_id,
                        queue_data.generator_server,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    updateScreenshot: async function (screenshotObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE screenshots SET \
                        project_id=?, \
                        page_id=?, \
                        component_id=?, \
                        job_id=?, \
                        path=?, \
                        capture_failure=?, \
                        width=?, \
                        height=?, \
                        created_time=?, \
                        error=?, \
                        screenshot_time=?, \
                        capability_id=?, \
                        breakpoint_id=?, \
                        is_baseline=?, \
                        status=?, \
                        visual_regression=?, \
                        browser_regression=? \
                        WHERE id=?;",
                        screenshotObject.project_id,
                        screenshotObject.page_id,
                        screenshotObject.component_id,
                        screenshotObject.job_id,
                        screenshotObject.path,
                        screenshotObject.capture_failure,
                        screenshotObject.width,
                        screenshotObject.height,
                        screenshotObject.created_time,
                        '',
                        screenshotObject.screenshot_time,
                        screenshotObject.capability_id,
                        screenshotObject.breakpoint_id,
                        screenshotObject.is_baseline,
                        screenshotObject.status,
                        screenshotObject.visual_regression,
                        screenshotObject.browser_regression,
                        screenshotObject.id, 
                        function(err) {
                            resolve(this.lastID)
                        }
                    );
                });
            }
        );
    },
    updateBaseline: async function (screenshotObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE screenshots SET is_baseline=0, visual_regression=0, status=4 WHERE component_id=? AND breakpoint_id=? AND project_id=? AND capability_id=?;", 
                        screenshotObject.component_id,
                        screenshotObject.breakpoint_id,
                        screenshotObject.project_id,
                        screenshotObject.capability_id);
                    query.run("UPDATE screenshots SET is_baseline=1  WHERE id=?", screenshotObject.id, function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
}

module.exports = screenshot;