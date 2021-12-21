
const fs = require('fs');
const helper = require('./helper');
const capabilities = require('./capabilities');
const screenshotDb = require('../models/screenshotDb');

const screenshot = {
    getScreenshot: async function (screenshotId) {
        let row = await screenshotDb.getScreenshot(screenshotId);
        row.created_time = helper.prettyDate(row.created_time);
        return row;
    },
    getScreenshots: async function (projectId, conditions, sortKey, sortOrder, limit, page) {
        let rows = await screenshotDb.getScreenshots(projectId, conditions, sortKey, sortOrder, limit, page);
        for (let i in rows) {
            rows[i].created_time_formatted = helper.prettyDate(rows[i].created_time);
        }
        rows = capabilities.getCapabilitiesForStyling(rows);
        return rows;
    },
    getScreenshotsFromJob: async function (jobObject) {
        let rows = await screenshotDb.getScreenshotsFromJob(jobObject);
        for (let i in rows) {
            rows[i].created_time_formatted = helper.prettyDate(rows[i].created_time);
        }
        rows = capabilities.getCapabilitiesForStyling(rows);
        return rows;
    },
    getScreenshotsFromIds: async function (ids) {
        let rows = await screenshotDb.getScreenshotsFromIds(ids);
        for (let i in rows) {
            rows[i].created_time_formatted = helper.prettyDate(rows[i].created_time);
        }
        rows = capabilities.getCapabilitiesForStyling(rows);
        return rows;
    },
    deleteScreenshotForComponent: async function (componentObject) {
        let rows = await screenshotDb.getScreenshotsFromComponentId(componentObject.id);
        for (let x in rows) {
            await this.deleteScreenshot(rows[x]);
        }
    },
    deleteScreenshot: async function (screenshotObject) {
        if (fs.existsSync(screenshotObject.path)) {
            fs.unlinkSync(screenshotObject.path);
        }
        return await screenshotDb.deleteScreenshot(screenshotObject);
    },
    getUnrunScreenshots: async function (lastId) {
        return await screenshotDb.getUnrunScreenshots(lastId);
    },
    getUndiffedScreenshots: async function (lastId) {
        return await screenshotDb.getUndiffedScreenshots(lastId);
    },
    setScreenshotStatus: async function (id, status) {
        return await screenshotDb.setScreenshotStatus(id, status);
    },
    setScreenshotError: async function (id, error) {
        return await screenshotDb.setScreenshotError(id, error);
    },
    createQueuedScreenshot: async function (queueData) {
        return await screenshotDb.createQueuedScreenshot(queueData);
    },
    updateScreenshot: async function (screenshotObject) {
        return await screenshotDb.updateScreenshot(screenshotObject);
    },
    updateBaseline: async function (screenshotObject) {
        return await screenshotDb.updateBaseline(screenshotObject);
    },
}

module.exports = screenshot;