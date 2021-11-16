const db = require('./db')
const validate = require('./validate')
const path = require('path')
const argon2 = require('argon2')
const crypto = require("crypto")

const user = {
    sessions: {},
    // Middleware function for Express.
    redirectLoggedOut: async function(req, res, next) {
        if ('glitch_hawk_session' in req.cookies && req.cookies.glitch_hawk_session in user.sessions) {
            req.glitch_hawk_user = user.sessions[req.cookies.glitch_hawk_session]
            next()
        } else if (req.originalUrl == '/login') {
            const isSetup = await user.superAdminExists();
            if (!isSetup) {
                res.redirect(301, '/setup')
            }
            next()
        } else if (req.originalUrl == '/setup') {
            const isSetup = await user.superAdminExists();
            if (isSetup) {
                res.redirect(301, '/login')
            }
            next()
        } else if (path.extname(req.originalUrl)) {
            next()
        } else {
            const isSetup = await user.superAdminExists();
            if (!isSetup) {
                res.redirect(301, '/setup')
            } else {
                res.redirect(301, '/login')
            }
        }
    },
    getUser: function(req) {
        if ('glitch_hawk_session' in req.cookies && req.cookies.glitch_hawk_session in user.sessions) {
            return user.sessions[req.cookies.glitch_hawk_session]
        }
        return false
    },
    isAdmin: function(req) {
        if (user.sessions[req.cookies.glitch_hawk_session].role == 1 || user.sessions[req.cookies.glitch_hawk_session].role == 2) {
            return true;
        }
        return false;
    },
    createUser: async function(userData) {
        const password2 = userData.password2;
        delete userData.password2;
        userData.role = parseInt(userData.role);

        // Validate normal values.
        let validationErrors = validate.validateEntity(userData, 'user');
        
        if (userData.password != password2) {
            validationErrors.push({id: 'password', error: 'The passwords do not match'})
        }

        if (validationErrors.length) {
            return validationErrors
        }
        
        let query = db.getDb();
        const password = await user.hashPassword(userData.password);
        query.serialize(function() {
            query.run("INSERT INTO users (password, first_name, last_name, role, email) VALUES (?, ?, ?, ?, ?);", 
                password,
                userData.first_name,
                userData.last_name,
                userData.role,
                userData.email,
            );
        });

        return null;
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
    hashPassword: async function(password) {
        return await argon2.hash(password)
    },
    login: async function(email, password) {
        return new Promise(
            (resolve, reject) => {
                this.getUserFromEmail(email).then(loggedInUser => {
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
    getUserFromEmail: function(email) {
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
    createCookie: function(user) {
        console.log('test');
        const sessionHash = crypto.randomBytes(20).toString('hex');
        this.sessions[sessionHash] = {'id': user.id, 'role': user.role, 'first_name': user.first_name, 'last_name': user.last_name, 'email': user.email}
        return sessionHash
    }
}

module.exports = user;