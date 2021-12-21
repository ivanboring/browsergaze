const jobDb = require('../models/jobDb');

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
    deleteJobFromProjectId: async function(id) {
        return await jobDb.deleteJobFromProjectId(id);
    },
}

module.exports = job;