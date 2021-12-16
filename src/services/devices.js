const got = require('got');
const helper = require('./helper');
const capabilities = require('./capabilities');
const deviceDb = require('../model/deviceDb');

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
                        if (!(slot.stereotype.platformName in returnCapabilities)) {
                            returnCapabilities[slot.stereotype.platformName] = {
                                'platformName': capabilities.getHumanReadableFromSelPlatform(slot.stereotype.platformName), 
                                'browsers': {}
                            }
                        }
                        returnCapabilities[slot.stereotype.platformName]['browsers'][slot.stereotype.browserName] = {
                            'browserName': capabilities.getHumanReadableFromSelBrowser(slot.stereotype.browserName),
                            'version': 'default',
                        }
                        
                    }
                }
                return returnCapabilities;
            }
        } catch (e) {
            return null;
        }    
    },
    saveDevices: async function(list, serverObject) {
        return await deviceDb.saveDevices(list, serverObject);
    }
}

module.exports = devices;