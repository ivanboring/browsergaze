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
    editUser: async function(userData) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("UPDATE users SET password=?, first_name=?, last_name=?, role=?, email=? WHERE id=?;", 
                        userData.password,
                        userData.first_name,
                        userData.last_name,
                        userData.role,
                        userData.email,
                        userData.id,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );
    },
    createUserProjects: async function(userId, projects) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let x in projects) {
                        query.run("INSERT INTO project_user (user_id, project_id) VALUES (?, ?);", 
                            userId,
                            projects[x],
                        );
                    }
                    resolve(true);
                });
            }
        );
    },
    deleteUserFromProjectId: async function(projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("DELETE FROM project_user WHERE project_id=?;", projectId);
                    resolve(true);
                });
            }
        );
    },
    getUserProjects: async function(userId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT project_id FROM project_user WHERE user_id=?;", userId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    deleteUser: async function(userId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("DELETE FROM users WHERE id=?;", userId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    deleteUserProjects: async function(userId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("DELETE FROM project_user WHERE user_id=?;", userId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getUsers: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT id, role, email, first_name, last_name, password FROM users ORDER BY id DESC;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
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
    },
    getUserFromId: async function(id) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT id, role, email, first_name, last_name, password FROM users WHERE id=?;", id, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    }
}

module.exports = userDb;