const db = require('./db');

const screenshotDb = {
    getScreenshot: async function (screenshotId) {
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
                        WHERE s.id=? ORDER BY s.created_time ASC;", screenshotId, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    getScreenshotsFromComponentId: async function (component_id) {
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
                        WHERE s.component_id=? ORDER BY s.created_time ASC;", component_id, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getScreenshotsFromCapability: async function (capabilityId) {
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
                        WHERE s.capability_id=? ORDER BY s.created_time ASC;", capabilityId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getScreenshots: async function (projectId, conditions, sortKey, sortOrder, limit, page) {
        if (typeof conditions == 'undefined' || conditions == null) {
            conditions = {};
        }
        if (typeof sortKey == 'undefined' || sortKey == null || !sortKey.includes['created_time']) {
            sortKey = 'created_time';
        }
        if (typeof sortOrder == 'undefined' || sortOrder == null || !sortOrder.includes['ASC', 'DESC']) {
            sortOrder = 'DESC';
        }
        if (typeof limit != 'number') {
            limit = 50;
        }

        if (typeof page != 'number') {
            page = 0;
        }

        let offset = page*limit;

        let whereString = ['s.project_id=?'];
        let whereParameters = [projectId];
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
                        WHERE " + whereString.join(' AND ') + " ORDER BY " + sortKey + " " + sortOrder + " LIMIT " + offset + "," + limit + ";", whereParameters, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getScreenshotsCount: async function(projectId, conditions) {
        if (typeof conditions == 'undefined' || conditions == null) {
            conditions = {};
        }
        let whereString = ['s.project_id=?'];
        let whereParameters = [projectId];
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
                    query.get("SELECT count(*) as total \
                        FROM screenshots s LEFT JOIN pages p ON p.id=s.page_id \
                        LEFT JOIN components c ON c.id=s.component_id \
                        LEFT JOIN project_capabilities pc ON pc.id=s.capability_id \
                        LEFT JOIN capabilities cb ON pc.capability_id=cb.id \
                        LEFT JOIN generator_servers gs ON gs.id=cb.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=s.breakpoint_id \
                        WHERE " + whereString.join(' AND '), whereParameters, function(err, row) {
                            if ('total' in row) {
                                resolve(row.total);
                            }
                            resolve(0);
                    });
                });
            }
        )
    },
    getScreenshotsFromJob: async function (jobId) {
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
                        WHERE s.job_id=? ORDER BY s.created_time ASC;", jobId, function(err, rows) {
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
    setScreenshotError: async function (id, error) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE screenshots SET error=? WHERE id=?;", 
                        error,
                        id,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    createQueuedScreenshot: async function (queueData) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO screenshots \
                        (project_id, page_id, component_id, job_id, path, created_time, status, capability_id, breakpoint_id, generator_server) \
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", 
                        queueData.project_id,
                        queueData.page_id,
                        queueData.component_id,
                        queueData.job_id,
                        queueData.path,
                        queueData.created_time,
                        queueData.status,
                        queueData.capability_id,
                        queueData.breakpoint_id,
                        queueData.generator_server,
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
    deleteScreenshotForComponent: async function (componentObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM screenshots WHERE component_id=?;", 
                    componentObject.component_id, function(err) {
                        resolve(true);
                    });
                });
            }
        );
    },
    deleteScreenshot: async function (screenshotObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM screenshots WHERE id=?;", 
                    screenshotObject.id, function(err) {
                        resolve(true);
                    });
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

module.exports = screenshotDb;