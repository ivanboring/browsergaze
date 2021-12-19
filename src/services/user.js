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
    getUsers: async function() {
        return await userDb.getUsers();
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
    hasProject: async function(req, projectId) {
        let projects = await userDb.getUserProjects(user.sessions[req.cookies.glitch_hawk_session].id);
        for (let x in projects) {
            if (projects[x].project_id == projectId) {
                return true;
            }
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
            validationErrors.push({id: 'password', error: 'The passwords do not match.'});
        }

        if (await userDb.getUserFromEmail(userData.email)) {
            validationErrors.push({id: 'email', error: 'This email already exists.'});   
        }

        if ((userData.role !== "1" || userData.role !== "2") && (userData.projects == null || userData.projects.length == 0)) {
            validationErrors.push({id: 'projects', error: 'You have to choose one project at least.'});   
        }

        if (validationErrors.length) {
            return validationErrors
        }

        userData.password = await user.hashPassword(userData.password);
        let userId = await userDb.createUser(userData);
        await userDb.createUserProjects(userId, userData.projects);
        return null;
    },
    editUser: async function(userData, fullUpdateAllowed) {
        let oldUserObject = await userDb.getUserFromId(userData.id);
        const password2 = userData.password2;
        delete userData.password2;
        userData.role = parseInt(userData.role);

        // Validate normal values.
        let validationErrors = validate.validateEntity(userData, 'user');
        
        if (userData.password != password2) {
            validationErrors.push({id: 'password', error: 'The passwords do not match.'});
        }

        if (oldUserObject.email != userData.email) {
            if (await userDb.getUserFromEmail(userData.email)) {
                validationErrors.push({id: 'email', error: 'This email already exists.'});   
            }
        }

        console.log(userData.password_old, oldUserObject.password)
        if (userData.password_old) {
            let passwordMatch = await argon2.verify(oldUserObject.password, userData.password_old);
            if (!passwordMatch) {
                validationErrors.push({id: 'password_old', error: 'Please give your correct old password, to change to new password.'});  
            }
        }

        if ((userData.role !== "1" || userData.role !== "2") && (userData.projects == null || userData.projects.length == 0)) {
            validationErrors.push({id: 'projects', error: 'You have to choose one project at least.'});   
        }

        // Password can be empty, and will not be updated.
        if (validationErrors.length == 1 && validationErrors[0]['id'] == 'password' && validationErrors[0]['error'] == "This fields can't be empty.") {
            validationErrors = [];
        }
        console.log(validationErrors);

        if (validationErrors.length) {
            return validationErrors
        }

        if (userData.password) {
            userData.password = await user.hashPassword(userData.password);
        } else {
            userData.password = oldUserObject.password;
        }

        if (!fullUpdateAllowed) {
            userData.role = oldUserObject.role;
            let projects = await userDb.getUserProjects(oldUserObject.id);
            userData.projects = [];
            for (let x in projects) {
                userData.projects.push(projects[x].project_id);
            }
        }
        await userDb.editUser(userData);
        await userDb.deleteUserProjects(userData.id);
        await userDb.createUserProjects(userData.id, userData.projects);
        return null;
    },
    deleteUser: async function(userId) {
        await userDb.deleteUser(userId);
        await userDb.deleteUserProjects(userId);
    },
    superAdminExists: async function() {
        return await userDb.superAdminExists();
    },
    hashPassword: async function(password) {
        return await argon2.hash(password)
    },
    login: async function(email, password) {
        let loggedInUser = await userDb.getUserFromEmail(email);
        if (typeof loggedInUser !== 'undefined' && await argon2.verify(loggedInUser.password, password)) {
            const sessionHash = user.createCookie(loggedInUser)
            return sessionHash;
        } else {
            return false;
        }
    },
    logout: function(cookieHash) {
        delete this.sessions[cookieHash];
    },
    getUserFromEmail: async function(email) {
        return await userDb.getUserFromEmail(email);
    },
    getUserFromId: async function(userId) {
        return await userDb.getUserFromId(userId);
    },
    getUserProjects: async function(userId) {
        let projects = await userDb.getUserProjects(userId);
        let returnProjects = [];
        for (let x in projects) {
            returnProjects.push(projects[x].project_id);
        }
        return returnProjects;
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