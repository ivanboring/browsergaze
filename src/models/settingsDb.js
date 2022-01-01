const db = require('./db');

const settingsDb = {
    getAllSettings: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT * FROM settings;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getSetting: async function(key) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT * FROM settings key=?;", key, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    setSetting: async function(key, value) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT * FROM settings WHERE key=?;", key, function(err, row) {
                        if (row) {
                            query.run("UPDATE settings SET value=? WHERE key=?", value, key, function(err) {
                                resolve(true);
                            })
                        } else {
                            query.run("INSERT INTO settings (key, value) VALUES (?, ?);", key, value,
                            function(err) {
                                resolve(true);
                            });
                        }
                    });
                    
                });
            }
        );       
    }
}

module.exports = settingsDb;