const permissions = require('../controllers/permissions');
const user = require('../controllers/user');
const form = require('../controllers/form');
const validate = require('../controllers/validate');
const project = require('../controllers/project');

module.exports = {
    listUsers: async function(req, res) {
        if (user.hasPermission(req, 'manage-users')) {
            const usersList = await user.getUsers();
            res.render('users', {
                title: 'All users',
                isAdmin: user.isAdmin(req),
                users: usersList,
                roles: permissions.roleNames,
                user: user.getUser(req),
            });
        } else {
            res.redirect(301, '/projects')
        }
    },
    createUser: async function(req, res) {
        if (user.hasPermission(req, 'manage-users')) {
            const usersList = await user.getUsers();
            const projectList = await project.getProjects(req);
            let cleanedRoles = {'0': 'Choose one'};
            for (let x in permissions.roleNames) {
                if (x !== "1") {
                    cleanedRoles[x] = permissions.roleNames[x];
                }
            }
            res.render('users-create', {
                title: 'Create new user',
                isAdmin: user.isAdmin(req),
                form: form.populateFormDefaults('user', req),
                users: usersList,
                roles: cleanedRoles,
                projects: projectList,
                user: user.getUser(req),
            });
        } else {
            res.redirect(301, '/projects')
        }
    },
    editUser: async function(req, res) {
        let currentUser = await user.getUser(req);
        let userObject = await user.getUserFromId(req.params.userId);
        if (currentUser.id === userObject.id || (user.hasPermission(req, 'manage-users') && userObject.id !== 1)) {
            const usersList = await user.getUsers();
            const projectList = await project.getProjects(req);
            let cleanedRoles = {'0': 'Choose one'};
            for (let x in permissions.roleNames) {
                if (x !== "1") {
                    cleanedRoles[x] = permissions.roleNames[x];
                }
            }
            userObject.projects = await user.getUserProjects(userObject.id);
            res.render('users-edit', {
                title: 'Edit user',
                isAdmin: user.isAdmin(req),
                form: form.populateFormDefaults('user', req, userObject),
                users: usersList,
                id: userObject.id,
                own: currentUser.id === userObject.id,
                roles: cleanedRoles,
                projects: projectList,
                extended: user.hasPermission(req, 'manage-users'),
                user: user.getUser(req),
            });
        } else {
            res.redirect(301, '/projects')
        }
    },
    deleteUser: async function(req, res) {
        let userObject = await user.getUserFromId(req.params.userId);
        if (user.hasPermission(req, 'manage-users') || userObject !== "1") {
            res.render('users-delete', {
                title: 'Delete user',
                isAdmin: user.isAdmin(req),
                id: userObject.id,
                user: user.getUser(req),
            });
        } else {
            res.redirect(301, '/projects')
        }
    },
    postCreateUser: async function(req, res) {
        if (user.hasPermission(req, 'manage-users')) {
            let validationErrors = await user.createUser(req.body);
            if (validationErrors !== null) {
                validate.redirect('/users/create', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/users')
            }
        }
    },
    postEditUser: async function(req, res) {
        let currentUser = await user.getUser(req);
        let userObject = await user.getUserFromId(req.params.userId);
        if (currentUser.id === userObject.id || (user.hasPermission(req, 'manage-users') && userObject.id !== 1)) {
            let validationErrors = await user.editUser(req.body, user.hasPermission(req, 'manage-users'));
            if (validationErrors !== null) {
                validate.redirect('/users/' + req.params.userId + '/edit', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/users')
            }
        }
    },
    postDeleteUser: async function(req, res) {
        if (user.hasPermission(req, 'manage-users')) {
            user.deleteUser(req.body.user_id);
            res.redirect(301, '/users');
        }
    },
}