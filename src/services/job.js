const jobDb = require('../model/jobDb');

const job = {
    getJobFromUuid: async function (uuid) {
        return await jobDb.getJobFromUuid(uuid);
    },
    getJobFromProjectId: async function (projectId, limit) {
        if (typeof limit !== 'number') {
            limit = 100;
        }
        return await jobDb.getJobFromProjectId(projectId, limit);
    },
    getRunschemaForComponentId: async function(id) {
        return await jobDb.getRunschemaForComponentId(id);
    },
    createJob: async function(projectId) {
        return await jobDb.createJob(projectId);
    },
    getUuidFromId: async function(id) {
        return await jobDb.createJob(id);
    },
}

module.exports = job;