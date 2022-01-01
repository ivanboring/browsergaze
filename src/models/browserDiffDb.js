const db = require('./db');

const browserDiffDb = {
    createBrowserDiff: async function (browserDiffObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO browser_diffs \
                        (job_id, component_id, page_id, project_id, from_capability, to_capability, from_screenshot_id, to_screenshot_id, breakpoint_id, diff, status, created_time, threshold_id, path) \
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        browserDiffObject.job_id,
                        browserDiffObject.component_id,
                        browserDiffObject.page_id,
                        browserDiffObject.project_id,
                        browserDiffObject.from_capability,
                        browserDiffObject.to_capability,
                        browserDiffObject.from_screenshot_id,
                        browserDiffObject.to_screenshot_id,
                        browserDiffObject.breakpoint_id,
                        browserDiffObject.diff,
                        browserDiffObject.status,
                        browserDiffObject.created_time,
                        browserDiffObject.threshold_id,
                        browserDiffObject.path, function(err, row) {
                            resolve(row)
                    });
                });
            }
        )
    },
    getBrowserDiff: async function(browserDiffId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT b.*, c.name as component_name, p.name as page_name, pb.width, pb.height, s1.path as from_path, s2.path as to_path, \
                        cb1.browser_name as from_browser_name, cb1.browser_version as from_browser_version, cb1.platform as from_platform, \
                        cb1.platform_version as from_platform_version, gs1.server_type as from_server_type, \
                        cb2.browser_name as to_browser_name, cb2.browser_version as to_browser_version, cb2.platform as to_platform, \
                        cb2.platform_version as to_platform_version, gs2.server_type as to_server_type \
                        FROM browser_diffs b \
                        LEFT JOIN pages p ON p.id=b.page_id \
                        LEFT JOIN components c ON c.id=b.component_id \
                        LEFT JOIN screenshots s1 ON s1.id=b.from_screenshot_id \
                        LEFT JOIN screenshots s2 ON s2.id=b.to_screenshot_id \
                        LEFT JOIN project_capabilities pc1 ON pc1.id=b.from_capability \
                        LEFT JOIN capabilities cb1 ON pc1.capability_id=cb1.id \
                        LEFT JOIN generator_servers gs1 ON gs1.id=cb1.generator_server_id \
                        LEFT JOIN project_capabilities pc2 ON pc2.id=b.to_capability \
                        LEFT JOIN capabilities cb2 ON pc2.capability_id=cb2.id \
                        LEFT JOIN generator_servers gs2 ON gs2.id=cb2.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=b.breakpoint_id \
                        WHERE b.id=?", browserDiffId, function(err, row) {
                            resolve(row)
                        }
                    )
                })
            }
        );
    },
    deleteBrowserDiff: async function(browserDiffId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM browser_diffs WHERE id=?", browserDiffId, function(err, row) {
                            resolve(true)
                        }
                    )
                })
            }
        );
    },
    deleteBrowserDiffFromCapabilityId: async function(capabilityId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM browser_diffs WHERE from_capability=? OR to_capability=?", capabilityId, capabilityId, function(err, row) {
                            console.log('2', err);
                            resolve(true)
                        }
                    )
                })
            }
        );
    },
    getBrowserDiffs: async function (projectId, conditions, sortKey, sortOrder, limit, page) {
        if (typeof conditions == 'undefined') {
            conditions = {};
        }
        if (typeof sortKey == 'undefined' || sortKey == null || !sortKey.includes['id']) {
            sortKey = 'id';
        }
        if (typeof sortOrder == 'undefined' || sortOrder == null || !sortOrder.includes['ASC', 'DESC']) {
            sortOrder = 'DESC';
        }
        if (typeof limit != 'number') {
            limit = 50;
        }
        if (typeof page != 'number') {
            limit = 0;
        }

        let offset = page*limit;

        let whereString = ['b.project_id=?'];
        let whereParameters = [projectId];
        for (let key in conditions) {
            switch (key) {
                case 'page_id':
                case 'component_id':
                case 'job_id':
                case 'status':
                case 'breakpoint_id':
                    if (conditions[key]) {
                        whereString.push('b.' + key + '=?');
                        whereParameters.push(conditions[key]);
                    }
                    break;
            }
        }
        if ('capability_id_1' in conditions && conditions['capability_id_1'] && 'capability_id_2' in conditions && conditions['capability_id_2']) {
            whereString.push('(b.from_capability=? OR b.to_capability=?) AND (b.from_capability=? OR b.to_capability=?)');
            whereParameters.push(conditions['capability_id_1']);
            whereParameters.push(conditions['capability_id_1']);
            whereParameters.push(conditions['capability_id_2']);
            whereParameters.push(conditions['capability_id_2']);
        } else if ('capability_id_1' in conditions && conditions['capability_id_1']) {
            whereString.push('(b.from_capability=? OR b.to_capability=?)');
            whereParameters.push(conditions['capability_id_1']);
            whereParameters.push(conditions['capability_id_1']);
        } else if ('capability_id_2' in conditions && conditions['capability_id_2']) {
            whereString.push('(b.from_capability=? OR b.to_capability=?)');
            whereParameters.push(conditions['capability_id_2']);
            whereParameters.push(conditions['capability_id_2']);
        }
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT b.*, c.name as component_name, p.name as page_name, pb.width, pb.height, s1.path as from_path, s2.path as to_path, \
                        cb1.browser_name as from_browser_name, cb1.browser_version as from_browser_version, cb1.platform as from_platform, \
                        cb1.platform_version as from_platform_version, gs1.server_type as from_server_type, \
                        cb2.browser_name as to_browser_name, cb2.browser_version as to_browser_version, cb2.platform as to_platform, \
                        cb2.platform_version as to_platform_version, gs2.server_type as to_server_type \
                        FROM browser_diffs b \
                        LEFT JOIN pages p ON p.id=b.page_id \
                        LEFT JOIN components c ON c.id=b.component_id \
                        LEFT JOIN screenshots s1 ON s1.id=b.from_screenshot_id \
                        LEFT JOIN screenshots s2 ON s2.id=b.to_screenshot_id \
                        LEFT JOIN project_capabilities pc1 ON pc1.id=b.from_capability \
                        LEFT JOIN capabilities cb1 ON pc1.capability_id=cb1.id \
                        LEFT JOIN generator_servers gs1 ON gs1.id=cb1.generator_server_id \
                        LEFT JOIN project_capabilities pc2 ON pc2.id=b.to_capability \
                        LEFT JOIN capabilities cb2 ON pc2.capability_id=cb2.id \
                        LEFT JOIN generator_servers gs2 ON gs2.id=cb2.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=b.breakpoint_id \
                        WHERE " + whereString.join(' AND ') + " ORDER BY " + sortKey + " " + sortOrder + " LIMIT " + offset + "," + limit + ";", whereParameters, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getBrowserDiffsCount: async function (projectId, conditions) {
        if (typeof conditions == 'undefined') {
            conditions = {};
        }

        let whereString = ['b.project_id=?'];
        let whereParameters = [projectId];
        for (let key in conditions) {
            switch (key) {
                case 'page_id':
                case 'component_id':
                case 'job_id':
                case 'status':
                case 'breakpoint_id':
                    if (conditions[key]) {
                        whereString.push('b.' + key + '=?');
                        whereParameters.push(conditions[key]);
                    }
                    break;
            }
        }
        if ('capability_id_1' in conditions && conditions['capability_id_1'] && 'capability_id_2' in conditions && conditions['capability_id_2']) {
            whereString.push('(b.from_capability=? OR b.to_capability=?) AND (b.from_capability=? OR b.to_capability=?)');
            whereParameters.push(conditions['capability_id_1']);
            whereParameters.push(conditions['capability_id_1']);
            whereParameters.push(conditions['capability_id_2']);
            whereParameters.push(conditions['capability_id_2']);
        } else if ('capability_id_1' in conditions && conditions['capability_id_1']) {
            whereString.push('(b.from_capability=? OR b.to_capability=?)');
            whereParameters.push(conditions['capability_id_1']);
            whereParameters.push(conditions['capability_id_1']);
        } else if ('capability_id_2' in conditions && conditions['capability_id_2']) {
            whereString.push('(b.from_capability=? OR b.to_capability=?)');
            whereParameters.push(conditions['capability_id_2']);
            whereParameters.push(conditions['capability_id_2']);
        }
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT COUNT(*) as total \
                        FROM browser_diffs b \
                        LEFT JOIN pages p ON p.id=b.page_id \
                        LEFT JOIN components c ON c.id=b.component_id \
                        LEFT JOIN screenshots s1 ON s1.id=b.from_screenshot_id \
                        LEFT JOIN screenshots s2 ON s2.id=b.to_screenshot_id \
                        LEFT JOIN project_capabilities pc1 ON pc1.id=b.from_capability \
                        LEFT JOIN capabilities cb1 ON pc1.capability_id=cb1.id \
                        LEFT JOIN generator_servers gs1 ON gs1.id=cb1.generator_server_id \
                        LEFT JOIN project_capabilities pc2 ON pc2.id=b.to_capability \
                        LEFT JOIN capabilities cb2 ON pc2.capability_id=cb2.id \
                        LEFT JOIN generator_servers gs2 ON gs2.id=cb2.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=b.breakpoint_id \
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
}

module.exports = browserDiffDb;