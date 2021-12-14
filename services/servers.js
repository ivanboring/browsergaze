const db = require('./db');
const validate = require('./validate');

const { 
    v1: uuidv1,
} = require('uuid');
const puppeteerDirector = require('../directors/puppeteerDirector');
const { resolve } = require('path');
const { query, response } = require('express');
const capabilities = require('./capabilities');
const got = require('got');
const helper = require('./helper');

const servers = {
    getServers: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT s.* FROM generator_servers s ORDER BY s.name;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getServerById: async function(serverId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT s.* FROM generator_servers s WHERE s.id=?;", serverId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
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

        this.saveServer(server);
        return null;
    },
    saveServer: async function(server) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.run("INSERT INTO generator_servers (name, hostname, port, server_type, concurrency) VALUES (?, ?, ?, ?, ?);", 
                        server.name,
                        server.hostname,
                        server.port,
                        server.server_type,
                        server.concurrency,
                    function(err) {
                        resolve(this.lastID)
                    });
                });
            }
        );       
    }
}

module.exports = servers;