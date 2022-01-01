const db = require('./db');

const deviceDb = {
    saveDevices: async function(list, serverObject) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let uniqueId in list) {
                        query.run("INSERT INTO capabilities (generator_server_id, browser_name, browser_version, platform, platform_version, unique_id) VALUES (?, ?, ?, ?, ?, ?);", 
                        serverObject.id,
                        list[uniqueId].browserName,
                        'default',
                        list[uniqueId].platform.platform,
                        list[uniqueId].platform.version,
                        uniqueId);
                    }
                    
                    resolve(true);
                });
            }
        );
    },
    removeDevices: async function(list) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let uniqueId of list) {
                        query.run("DELETE FROM capabilities WHERE unique_id=?;", 
                        uniqueId);
                    }
                    
                    resolve(true);
                });
            }
        );
    },

}

module.exports = deviceDb;