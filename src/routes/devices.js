const servers = require('../services/servers');
const user = require('../services/user');
const form = require('../services/form');
const validate = require('../services/validate');
const devices = require('../services/devices');
const capabilities = require('../services/capabilities');

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
                user: user.getUser(req)
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
    }
}