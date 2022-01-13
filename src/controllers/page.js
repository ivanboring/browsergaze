const fs = require('fs');
const validate = require('./validate');
const defaults = require('./defaults');
const component = require('./component');
const { 
    v1: uuidv1,
} = require('uuid');
const puppeteerDirector = require('../services/puppeteerDirector');
const pageDb = require('../models/pageDb');
const { PuppeteerDirector } = require('../services/puppeteerDirector');

const page = {
    getPagesByProjectId: async function(req, projectId, limit, page) {
        return await pageDb.getPagesByProjectId(req, projectId, limit, page);
    },
    getCountPagesByProjectId: async function(req, projectId) {
        return await pageDb.getCountPagesByProjectId(req, projectId);
    },
    getPageById: async function(req, id) {
        return await pageDb.getPageById(req, id);
    },
    getPageByUuid: async function(req, uuid) {
        return await pageDb.getPageByUuid(req, uuid);
    },
    deletePage: async function (req, pageObject, projectObject) {
        const componentsList = await component.getComponentsForPage(req, pageObject, projectObject, pageObject);
        for (let x in componentsList) {
            await component.deleteComponent(componentsList[x], projectObject, pageObject);
        }
        return await pageDb.deletePage(pageObject);
    },
    deletePageFromProjectId: async function(id) {
        return await pageDb.deletePageFromProjectId(id);
    },
    createPage: async function(pageObject, projectObject, updateId, uuid) {
        // Validate normal values.
        let validationErrors = validate.validateEntity(pageObject, 'page');
        // Validate so we can take screenshots
        let pup = new PuppeteerDirector();
        await pup.init(projectObject.default_host_path, 'test');
        try {
            await pup.goto(pageObject.path, 'test');
        }
        catch (err) {
            validationErrors.push({id: 'path', error: 'We could not reach that path.'});
        }

        if (validationErrors.length) {
            return validationErrors
        }

        if (updateId) {
            pageObject.id = updateId;
            pageObject.uuid = uuid;
        } else {
            pageObject.uuid = uuidv1();
        }
        pageObject.project_id = projectObject.id;

        let imagedir = this.createPageDir(projectObject.dataname, pageObject.uuid);

        // Download screenshot.
        await pup.resizeWindow(1280, 720, 'test');
        await pup.screenshot(imagedir + 'init.jpg', 'test');
        await pup.close('test');
        // Store in db
        if (updateId) {
            await pageDb.updatePage(pageObject);
        } else {
            await pageDb.createPage(pageObject);
        }
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