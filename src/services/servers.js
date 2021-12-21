const validate = require('./validate');
const got = require('got');
const helper = require('./helper');
const serverDb = require('../models/serverDb');

const servers = {
    getServers: async function() {
        return await serverDb.getServers();
    },
    getServerById: async function(serverId) {
        return await serverDb.getServerById(serverId);
    },
    createServer: async function(server) {
        // Force numeric.
        server.port = parseInt(server.port);
        // Validate normal values.
        let validationErrors = validate.validateEntity(server, 'server');
        server.concurrency = 0;

        // Check if the server is available if no other issues exist.
        if (validationErrors.length == 0) {
            if (server.server_type == 'selenium-grid-4') {
                const statusUrl = helper.rtrim(server.hostname, '/') + ':' + server.port + '/wd/hub/status';
                let response = {};
                try {
                    response = await got(statusUrl, {responseType: 'json'});

                    if (!("body" in response)) {
                        validationErrors.push({id: 'hostname', error: 'That server did not give back a response.'});
                    } else if (!("ready" in response.body.value)) {
                        validationErrors.push({id: 'hostname', error: 'That server does not seem to be an Selenium Grid Server.'});
                    } else if (response.body.value.ready == false) {
                        validationErrors.push({id: 'hostname', error: 'That Selenium Grid Server is not ready.'});
                    } else {
                        // Count total concurrency.
                        for (let t in response.body.value.nodes) {
                            let node = response.body.value.nodes[t];
                            server.concurrency += parseInt(node.maxSessions);
                        }
                        
                    }
                } catch (e) {
                    validationErrors.push({id: 'hostname', error: 'Connection failed with the following message: ' + e.message});
                }                
            }
        }

        if (validationErrors.length) {
            return validationErrors
        }

        serverDb.saveServer(server);
        return null;
    },
    saveServer: async function(server) {
        return await serverDb.saveServer(server);    
    }
}

module.exports = servers;