const fs = require('fs')
const validate = require('./validate')
const path = require('path')
const argon2 = require('argon2')
const crypto = require("crypto")
const permissions = require('./permissions')
const userDb = require('../model/userDb')

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
    initialSessions(sessions) {
        user.sessions = sessions;
    },
    getUser: function(req) {
        if ('glitch_hawk_session' in req.cookies && req.cookies.glitch_hawk_session in user.sessions) {
            return user.sessions[req.cookies.glitch_hawk_session]
        }
        return false
    },
    isAdmin: function(req) {
        if ('cookies' in req && (user.sessions[req.cookies.glitch_hawk_session].role == 1 || user.sessions[req.cookies.glitch_hawk_session].role == 2)) {
            return true;
        }
        return false;
    },
    isCreator: function(req) {
        if ('cookies' in req && (user.sessions[req.cookies.glitch_hawk_session].role >= 1 && user.sessions[req.cookies.glitch_hawk_session].role <= 3)) {
            return true;
        }
        return false;
    },
    hasPermission(req, permission) {
        if (!('cookies' in req)) {
            return false;
        }
        return permissions.roleHasPermission(user.sessions[req.cookies.glitch_hawk_session].role, permission);
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

        userData.password = await user.hashPassword(userData.password);
        return await userDb.createUser(userData);
    },
    superAdminExists: async function() {
        return await userDb.superAdminExists();
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
    getUserFromEmail: async function(email) {
        return await userDb.getUserFromEmail(email);
    },
    createCookie: function(user) {
        const sessionHash = crypto.randomBytes(20).toString('hex');
        this.sessions[sessionHash] = {'id': user.id, 'role': user.role, 'first_name': user.first_name, 'last_name': user.last_name, 'email': user.email}
        let currentSessions = {};
        if (fs.existsSync('/tmp/sessions')) {
            currentSessions = JSON.parse(fs.readFileSync('/tmp/sessions'));
        }
        currentSessions[sessionHash] = {'id': user.id, 'role': user.role, 'first_name': user.first_name, 'last_name': user.last_name, 'email': user.email}
        fs.writeFileSync('/tmp/sessions', JSON.stringify(currentSessions));
        return sessionHash
    }
}

module.exports = user;