const fs = require('fs');
const validate = require('./validate');
const defaults = require('./defaults')
const { 
    v1: uuidv1,
} = require('uuid');
const puppeteerDirector = require('../directors/puppeteerDirector');
const pageDb = require('../model/pageDb');

const page = {
    getPagesByProjectId: async function(req, projectId) {
        return await pageDb.getPagesByProjectId(req, projectId);
    },
    getPageById: async function(req, id) {
        return await pageDb.getPageById(req, id);
    },
    getPageByUuid: async function(req, uuid) {
        return await pageDb.getPageByUuid(req, uuid);
    },
    createPage: async function(pageObject, projectObject) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(pageObject, 'page');
        // Validate so we can take screenshots
        await puppeteerDirector.init(projectObject.default_host_path);
        try {
            await puppeteerDirector.goto(pageObject.path);
        }
        catch (err) {
            validationErrors.push({id: 'path', error: 'We could not reach that path.'});
        }

        if (validationErrors.length) {
            return validationErrors
        }

        pageObject.uuid = uuidv1();
        pageObject.project_id = projectObject.id;

        let imagedir = this.createPageDir(projectObject.dataname, pageObject.uuid);

        // Download screenshot.
        await puppeteerDirector.resizeWindow(1280, 720);
        await puppeteerDirector.screenshot(imagedir + 'init.jpg');
        await puppeteerDirector.close();
        // Store in db   
        await pageDb.createPage(pageObject);
        return null;
    },
    createPageDir(projectName, pageUuid) {
        if (!fs.existsSync(defaults.imageLocation + projectName + '/' + pageUuid)) {
            fs.mkdirSync(defaults.imageLocation + projectName + '/' + pageUuid)
        }
        return defaults.imageLocation + projectName + '/' + pageUuid + '/';
    }
}

module.exports = page;