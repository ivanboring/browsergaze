const servers = require('../controllers/servers');
const user = require('../controllers/user');
const form = require('../controllers/form');
const validate = require('../controllers/validate');
const devices = require('../controllers/devices');
const capabilities = require('../controllers/capabilities');

module.exports = {
    getServers: async function(req, res) {
        if (user.isAdmin(req)) {
        const serverObjects = await servers.getServers(req)
        res.render('servers', {
            title: 'Your servers',
            isAdmin: user.isAdmin(req),
            servers: serverObjects,
            user: user.getUser(req),
        });
        } else {
            res.status(401).send('No access')
        }
    },
    createServerForm: async function(req, res) {
        if (user.isAdmin(req)) {
            res.render('server-create', {
                title: 'Create Server',
                form: form.populateFormDefaults('server', req),
                user: user.getUser(req),
                action: "/servers/create"
            })
        } else {
            res.status(401).send('No access')
        }
    },
    serverPost: async function(req, res) {
        if (user.isAdmin(req)) {
            let validationErrors = await servers.createServer(req.body)
            if (validationErrors !== null) {
                validate.redirect('/servers/create', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/servers')
            }
        }
    },
    createDeviceForm: async function(req, res) {
        if (user.isAdmin(req)) {
            let serverObject = await servers.getServerById(req.params.serverId);
            let deviceList = await devices.getDevicesForServer(serverObject);
            let selectedDevices = await capabilities.getCapabilitiesForServer(serverObject.id);
            let knownDevices = [];
            for (let t in selectedDevices) {
                if (selectedDevices[t].unique_id) {
                    knownDevices.push(selectedDevices[t].unique_id);
                }
            }
            res.render('select-devices', {
                title: 'Select Devices for server: ' + serverObject.name,
                devices: deviceList,
                server: serverObject,
                chosen: knownDevices,
                user: user.getUser(req)
            })
        } else {
            res.status(401).send('No access')
        }
    },
    devicePost: async function(req, res) {
        if (user.isAdmin(req)) {
            let serverObject = await servers.getServerById(req.params.serverId);
            await devices.saveDevices(req.body, serverObject);
            res.redirect(301, '/servers');
        } else {
            res.status(401).send('No access')
        }
    },
    editServerForm: async function(req, res) {
        if (user.hasPermission(req, 'add-devices')) {
            let serverObject = await servers.getServerById(req.params.serverId);
            res.render('server-create', {
                title: 'Edit Server',
                form: form.populateFormDefaults('server', req, serverObject),
                user: user.getUser(req),
                id: serverObject.id,
                action: "/servers/" + serverObject.id + "/edit"
            })
        } else {
            res.status(401).send('No access')
        }
    },
    editServer: async function(req, res) {
        if (user.hasPermission(req, 'add-devices')) {
            let validationErrors = await servers.editServer(req.body)
            if (validationErrors !== null) {
                validate.redirect('/servers/create', req.body, validationErrors, req, res)
            } else {
                res.redirect(301, '/servers')
            }
        } else {
            res.status(401).send('No access')
        }
    },
    deleteForm: async function(req, res) {
        let serverObject = await servers.getServerById(req.params.serverId);
        if (user.hasPermission(req, 'remove-devices')) {
            res.render('server-delete', {
                title: 'Delete server: ' + serverObject.name,
                id: serverObject.id,
                server_type: serverObject.server_type,
                user: user.getUser(req),
                isAdmin: user.isAdmin(req)
            })
        } else {
            res.status(401).send('No access')
        }
    },
    deleteServer: async function(req, res) {
        let serverObject = await servers.getServerById(req.body.server_id);
        if (user.hasPermission(req, 'remove-devices') && typeof  serverObject !== 'undefined') {
            servers.deleteServer(req.body.server_id);
            res.redirect(301, '/servers');
        } else {
            res.status(401).send('No access')
        }
    }
}