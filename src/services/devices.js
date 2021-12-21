const got = require('got');
const helper = require('./helper');
const capabilities = require('./capabilities');
const deviceDb = require('../models/deviceDb');
const crypto = require("crypto");

const devices = {
    getDevicesForServer: async function(server) {
        const statusUrl = helper.rtrim(server.hostname, '/') + ':' + server.port + '/wd/hub/status';
        let response = {};
        try {
            response = await got(statusUrl, {responseType: 'json'});

            if (!("body" in response)) {
                return null;
            } else if (!("ready" in response.body.value)) {
                return null;
            } else if (response.body.value.ready == false) {
                return null;
            } else {
                let returnCapabilities = {};
                // Count total concurrency.
                for (let t in response.body.value.nodes) {
                    let node = response.body.value.nodes[t];
                    for (let o in node.slots) {
                        let slot = node.slots[o];
                        let platform = capabilities.getDataFromSelPlatform(slot.stereotype.platformName);
                        if (!(slot.stereotype.platformName in returnCapabilities)) {
                            returnCapabilities[slot.stereotype.platformName] = {
                                'platformName': capabilities.getHumanReadableFromSelPlatform(slot.stereotype.platformName), 
                                'browsers': {}
                            }
                        }
                        returnCapabilities[slot.stereotype.platformName]['browsers'][slot.stereotype.browserName] = {
                            'browserName': capabilities.getHumanReadableFromSelBrowser(slot.stereotype.browserName),
                            'version': 'default',
                            'uniqueId': this.getUniqueId({
                                'generator_server_id': server,
                                'browser_name': slot.stereotype.browserName,
                                'browser_version': 'default',
                                'platform': platform.platform,
                                'platform_version': platform.version,
                            })
                        }
                    }
                }
                return returnCapabilities;
            }
        } catch (e) {
            return null;
        }    
    },
    getUniqueId(device) {
        let deviceName = device.generator_server_id + '__' + device.browser_name + '__' + device.browser_version + '__' + device.platform + '__' + device.platform_version;
        return crypto.createHash('md5').update(deviceName).digest('hex');
    },
    saveDevices: async function(list, serverObject) {
        let newDevices = {};
        for (let part of list.devices) {
            let parts = part.split('--');
            newDevices[parts[2]] = {platform: capabilities.getDataFromSelPlatform(parts[0]), browserName: capabilities.getHumanReadableFromSelBrowser(parts[1])};
        }

        let deleteDevices = [];
        let currentDevices = await capabilities.getCapabilitiesForServer(serverObject.id);
        if (currentDevices) {
            for (let part of currentDevices) {
                if (part.unique_id in newDevices) {
                    delete newDevices[part.unique_id];
                } else {
                    deleteDevices.push(part.unique_id);
                }
            }
        }
        if (Object.keys(newDevices).length > 0) {
            await deviceDb.saveDevices(newDevices, serverObject);
        }
        if (deleteDevices.length > 0) {
            await deviceDb.removeDevices(deleteDevices, serverObject);
        }
        return null;
    }
}

module.exports = devices;