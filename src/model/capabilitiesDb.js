const db = require('./db');

const capabilities = {
    getCapabilities: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT c.*, gs.name as server_name \
                              FROM capabilities c \
                              LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getCapabilitiesAndBreakpointsForComponent: async function (componentId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT pb.*, pb.id as breakpoint_id, c.*, pc.id as capability_id, gs.name as server_name \
                        FROM component_capability_breakpoint ccb \
                        LEFT JOIN project_capabilities pc ON pc.id=ccb.capability_id \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        LEFT JOIN project_breakpoints pb ON pb.id=ccb.breakpoint_id \
                        WHERE ccb.component_id=? ;", componentId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getCapabilityForProjectCapabilityId: async function (capabilityId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.get("SELECT c.*, gs.* \
                        FROM project_capabilities pc \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        WHERE pc.id=? ;", capabilityId, function(err, row) {
                        resolve(row)
                    });
                });
            }
        )
    },
    getCapabilitiesForProject: async function(projectId) {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT c.*, gs.name as server_name \
                        FROM project_capabilities pc \
                        LEFT JOIN capabilities c ON c.id=pc.capability_id \
                        LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id \
                        WHERE pc.project_id=? ;", projectId, function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    }
}

module.exports=capabilities