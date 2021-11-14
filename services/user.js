const db = require('./db')
const path = require('path')
const argon2 = require('argon2')
const crypto = require("crypto")

const user = {
    sessions: {},
    // Middleware function for Express.
    redirectLoggedOut: function(req, res, next) {
        if ('glitch_hawk_session' in req.cookies && req.cookies.glitch_hawk_session in user.sessions) {
            next()
        } else if (req.originalUrl !== '/login' && req.originalUrl !== '/setup' && !path.extname(req.originalUrl)) {
            res.redirect(301, '/login')
        } else {
            next()
        }
    },
    checkLogin: function(req) {
        if ('glitch_hawk_session' in req.cookies && req.cookies.hawk_session in user.sessions) {
            return user.sessions[req.cookies.hawk_session]
        }
        return false
    },
    createUser: async function(userData) {
        let query = db.getDb();
        const password = await user.hashPassword(userData.password);
        query.serialize(function() {
            query.run("INSERT INTO users (username, password, first_name, last_name, role, email) VALUES (?, ?, ?, ?, ?, ?);", 
                userData.username,
                password,
                userData.firstname,
                userData.lastname,
                userData.role,
                userData.email,
            );
        });
    },
    hashPassword: async function(password) {
        return await argon2.hash(password)
    },
    login: async function(username, password) {
        return new Promise(
            (resolve, reject) => {
                this.getUser(username).then(loggedInUser => {
                    if (typeof loggedInUser == 'undefined') {
                        resolve(false);
                    } else {
                        if (argon2.verify(loggedInUser.password, password)) {
                            const sessionHash = user.createCookie(loggedInUser)
                            resolve(sessionHash);
                        } else {
                            resolve(false)
                        }
                    }
                })
            }
        )
    },
    logout: function(cookieHash) {
        delete this.sessions[cookieHash];
    },
    getUser: function(username) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT id, role, username, email, first_name, last_name, password FROM users WHERE username=?;", username, function(err, row) {

                        resolve(row)
                    });
                });
            }
        )
    },
    createCookie: function(user) {
        const sessionHash = crypto.randomBytes(20).toString('hex');
        this.sessions[sessionHash] = {'id': user.id, 'role': user.role, 'username': user.username, 'first_name': user.first_name, 'last_name': user.last_name, 'email': user.email}
        return sessionHash
    }
}

module.exports = user;