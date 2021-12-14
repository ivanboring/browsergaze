const db = require('./db');
const got = require('got');
const helper = require('./helper');
const servers = require('./servers');
const webdriver = require('selenium-webdriver');
const capabilities = require('./capabilities');

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
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    for (let part of list.device_breakpoint) {
                        let slips = part.split('--')
                        let platform = capabilities.getDataFromSelPlatform(slips[0]);
                        let browserName = capabilities.getHumanReadableFromSelBrowser(slips[1]);
                        query.run("INSERT INTO capabilities (generator_server_id, browser_name, browser_version, platform, platform_version) VALUES (?, ?, ?, ?, ?);", 
                        serverObject.id,
                        browserName,
                        'default',
                        platform.platform,
                        platform.version);
                    }
                    
                    resolve(true);
                });
            }
        );
    }
}

module.exports = devices;