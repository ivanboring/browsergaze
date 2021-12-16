const db = require('./db')

const userDb = {
    createUser: async function(userData) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO users (password, first_name, last_name, role, email) VALUES (?, ?, ?, ?, ?);", 
                        userData.password,
                        userData.first_name,
                        userData.last_name,
                        userData.role,
                        userData.email,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    superAdminExists: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT id FROM users WHERE role=1;", function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    getUserFromEmail: async function(email) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT id, role, email, first_name, last_name, password FROM users WHERE email=?;", email, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    }
}

module.exports = userDb;