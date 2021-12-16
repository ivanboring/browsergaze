const db = require('./db');

const serverDb = {
    getServers: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT s.* FROM generator_servers s ORDER BY s.name;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getServerById: async function(serverId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT s.* FROM generator_servers s WHERE s.id=?;", serverId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    saveServer: async function(server) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO generator_servers (name, hostname, port, server_type, concurrency) VALUES (?, ?, ?, ?, ?);", 
                        server.name,
                        server.hostname,
                        server.port,
                        server.server_type,
                        server.concurrency,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );       
    }
}

module.exports = serverDb;