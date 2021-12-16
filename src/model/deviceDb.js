const db = require('./db');
const capabilities = require('../services/capabilities');

const deviceDb = {
    saveDevices: async function(list, serverObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let part of list.device_breakpoint) {
                        let slips = part.split('--')
                        let platform = capabilities.getDataFromSelPlatform(slips[0]);
                        let browserName = capabilities.getHumanReadableFromSelBrowser(slips[1]);
                        query.run("INSERT INTO capabilities (generator_server_id, browser_name, browser_version, platform, platform_version) VALUES (?, ?, ?, ?, ?);", 
                        serverObject.id,
                        browserName,
                        'default',
                        platform.platform,
                        platform.version);
                    }
                    
                    resolve(true);
                });
            }
        );
    }
}

module.exports = deviceDb;