const browserDiffDb = require('../models/browserDiffDb');
const capabilities = require('./capabilities');
const helper = require('./helper');

const browserDiff = {
    getBrowserDiffs: async function(projectId, conditions, sortKey, sortOrder, limit, page) {
        let rows = await browserDiffDb.getBrowserDiffs(projectId, conditions, sortKey, sortOrder, limit, page);
        for (let i in rows) {
            rows[i].created_time_formatted = helper.prettyDate(rows[i].created_time);
        }
        rows = capabilities.getCapabilitiesForStyling(rows, 'from_');
        rows = capabilities.getCapabilitiesForStyling(rows, 'to_');
        if (typeof rows == 'undefined') {
            rows = [];
        }
        return rows;
    },
    getBrowserDiffsCount: async function(projectId, conditions) {
        return await browserDiffDb.getBrowserDiffsCount(projectId, conditions);
    },
    getBrowserDiff: async function(browserDiffId) {
        return await browserDiffDb.getBrowserDiff(browserDiffId);
    },
    deleteBrowserDiff: async function(browserDiffId) {
        return await browserDiffDb.deleteBrowserDiff(browserDiffId);
    },
    createBrowserDiff: async function (browserDiffObject) {
        return await browserDiffDb.createBrowserDiff(browserDiffObject);
    }
}

module.exports = browserDiff;