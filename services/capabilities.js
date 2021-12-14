const db = require('./db');

const capabilities = {
    getCapabilities: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT c.*, gs.name as server_name FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getCapabilitiesAndBreakpointsForComponent: async function (component_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT pb.*, pb.id as breakpoint_id, c.*, pc.id as capability_id, gs.name as server_name \
                        FROM component_capability_breakpoint ccb \
                        LEFT JOIN project_capabilities pc ON pc.id=ccb.capability_id \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=ccb.breakpoint_id \
                        WHERE ccb.component_id=? ;", component_id, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getCapabilityForProjectCapabilityId: async function (capability_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT c.*, gs.* \
                        FROM project_capabilities pc \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        WHERE pc.id=? ;", capability_id, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    getCapabilitiesForProject: async function(project_id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT c.*, gs.name as server_name \
                        FROM project_capabilities pc \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        WHERE pc.project_id=? ;", project_id, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getDataFromSelPlatform: function(platform) {
        switch (platform) {
            case 'WIN11':
                return {platform: 'Windows', version: '11'};
            case 'WIN10':
                return {platform: 'Windows', version: '10'};
        }
    },
    getHumanReadableFromSelPlatform: function(platform) {
        switch (platform) {
            case 'WIN11':
                return 'Windows 11';
            case 'WIN10':
                return 'Windows 10';
        }
    },
    getHumanReadableFromSelBrowser: function(browserName) {
        switch (browserName) {
            case 'opera':
                return 'Opera';
            case 'firefox':
                return 'Firefox';
            case 'MicrosoftEdge':
                return 'Microsoft Edge';
            case 'chrome':
                return 'Chrome';
        }
    },
    getDataFromHumanBrowserName: function(browserName) {
        switch (browserName) {
            case 'Opera':
                return 'opera';
            case 'Firefox':
                return 'firefox';
            case 'Microsoft Edge':
                return 'MicrosoftEdge';
            case 'Chrome':
                return 'chrome';
        }
    },
    getCapabilitiesForStyling: function(rows) {
        for (let x in rows) {
            switch (rows[x].browser_name) {
                case 'Chromium':
                    rows[x].browser_icon = 'google';
                    break;
                case 'Chrome':
                    rows[x].browser_icon = 'chrome';
                    break;
                case 'Microsoft Edge':
                case 'Edge':
                    rows[x].browser_icon = 'edge';
                    break;
                case 'IE':
                    rows[x].browser_icon = 'internet-explorer';
                    break;
                case 'Firefox':
                    rows[x].browser_icon = 'firefox-browser';
                    break;
                case 'Opera':
                    rows[x].browser_icon = 'opera';
                    break;
                case 'Safari':
                    rows[x].browser_icon = 'safari';
                    break;
            }
            switch(rows[x].platform) {
                case 'Windows':
                    if (rows[x].platform_version == '10' || rows[x].platform_version == '11') {
                        rows[x].os_icon = 'windows';
                    } else {
                        rows[x].os_icon = 'microsoft';
                    }
                    break;
                case 'OS X':
                    rows[x].os_icon = 'apple';
                    break;
                case 'Linux':
                    rows[x].os_icon = 'linux';
                    break;
                default:
                    rows[x].os_icon = 'desktop';
                    break;
            }
        }
        return rows;
    }
}

module.exports=capabilities