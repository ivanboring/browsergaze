const fs = require('fs');
const validate = require('./validate');
const defaults = require('./defaults');
const helper = require('./helper');
const { PuppeteerDirector } = require('../services/puppeteerDirector');
const svgexport = require('svgexport');
const capabilities = require('./capabilities');
const projectDb = require('../models/projectDb');
const component = require('./component');
const job = require('./job');
const page = require('./page');
const user = require('./user');

const project = {
    getProjects: async function(req) {
        return await projectDb.getProjects(req);
    },
    getProjectById: async function(req, id) {
        return await projectDb.getProjectById(req, id);
    },
    getProjectByIdWithoutReq: async function(id) {
        return await projectDb.getProjectByIdWithoutReq(id);
    },
    getProjectByName: async function(req, name) {
        return await projectDb.getProjectByName(req, name);
    },
    getEditableProjectByName: async function(req, name) {
        let projectObject = await projectDb.getProjectByName(req, name);
        let capabilitiesList = await capabilities.getCapabilitiesForProject(projectObject.id);
        projectObject.capability = [];
        for (let x in capabilitiesList) {
            projectObject.capability.push(capabilitiesList[x].id)
        }
        projectObject.breakpoint_height = [];
        projectObject.breakpoint_width = [];
        let breakpoints = await projectDb.getProjectBreakpoints(projectObject.id);
        for (let x in breakpoints) {
            projectObject.breakpoint_width.push(breakpoints[x].width);
            projectObject.breakpoint_height.push(breakpoints[x].height);
        }
        return projectObject;
    },
    getProjectCapabilities: async function(req, projectId) {
        return await projectDb.getProjectCapabilities(req, projectId);
    },
    getProjectBreakpoints: async function(req, projectId) {
        return await projectDb.getProjectBreakpoints(req, projectId);
    },
    createProject: async function(project) {
        // Validate normal values.
        let formErrors = validate.validateEntity(project, 'project');
        let validationErrors = formErrors.concat(await this.extraProjectValidation(project, true));
        for (let width of project.breakpoint_width) {
            if (parseInt(width) < 500) {
                validationErrors.push({id: 'breakpoint_width', error: 'Width can not be under 500px.'});
            }
        }
        if (validationErrors.length) {
            return validationErrors
        }
        
        // Download favicon.
        let pup = new PuppeteerDirector();
        await pup.init(project.default_host_path, 'test');
        let url = await pup.getFaviconUrl('test');

        let imageDir = this.createProjectDir(project.dataname);
        if (url) {
            if (url.substr(-4) == '.svg') {
                await svgexport.render([{
                    input: [url],
                    output: imageDir + 'icon.png'
                }]);
            } else {
                await helper.download(url, imageDir + 'icon.png');
            }
        }
        // Download screenshot.
        await pup.goto('/', 'test');
        await pup.resizeWindow(1280, 720, 'test');
        await pup.screenshot(imageDir + 'init.jpg', 'test');
        await pup.close('test');
        // Store in db.
        let projectId = await projectDb.createProject(project);
        // Store capabilities and breakpoints.
        await projectDb.createProjectCapabilities(projectId, project.capability);
        await projectDb.createProjectBreakpoints(projectId, project.breakpoint_width, project.breakpoint_height);
        return null;
    },
    updateProject: async function(project) {
        let formErrors = validate.validateEntity(project, 'project');
        let validationErrors = formErrors.concat(await this.extraProjectValidation(project, false));
        for (let width of project.breakpoint_width) {
            if (parseInt(width) < 500) {
                validationErrors.push({id: 'breakpoint_width', error: 'Width can not be under 500px.'});
            }
        }
        if (validationErrors.length) {
            return validationErrors
        }
        await projectDb.updateProject(project);
        await projectDb.updateProjectCapabilities(project.id, project.capability);
        await projectDb.updateProjectBreakpoints(project.id, project.breakpoint_width, project.breakpoint_height);
        //TODO: update breakpoints
        return null;
    },
    extraProjectValidation: async function(project, checkDataname) {
        let validationErrors = [];
        // Validate so we can take screenshots
        let pup = new PuppeteerDirector();
        await pup.init(project.default_host_path, 'test');
        try {
            await pup.goto('/', 'test');
        }
        catch (err) {
            validationErrors.push({id: 'default_host_path', error: 'We could not reach that domain.'});
        }
        pup.close('test');

        // Validate that the dataname is unique.
        if (checkDataname) {
            let oldProject = await projectDb.findDataName(project.dataname);

            if (typeof oldProject == 'object') {
                validationErrors.push({id: 'dataname', error: 'That dataname already exists for a project.'});
            }
        }

        // Validate that one capability is chosen.
        if (this.validateCapabilities(project)) {
            validationErrors.push({id: 'capability', error: 'You have to check at least one capability.'});
        }
        return validationErrors;
    },
    getProjectBreakpoints: async function(projectId) {
        return await projectDb.getProjectBreakpoints(projectId);
    },
    findDataName: async function(dataname) {
        return await projectDb.findDataName(dataname);
    },
    createProjectDir(dataname) {
        if (!fs.existsSync(defaults.imageLocation + dataname)) {
            fs.mkdirSync(defaults.imageLocation + dataname)
        }
        return defaults.imageLocation + dataname + '/';
    },
    validateCapabilities(project) {
        return 'capability' in project ? false : true;
    },
    deleteProject: async function(req, project) {
        const componentsList = await component.getComponentsForProject(req, project.id);
        for (let x in componentsList) {
            let pageObject = await page.getPageById(componentsList[x].page_id);
            await component.deleteComponentForProject(componentsList[x], project, pageObject);
        }
        await job.deleteJobFromProjectId(project.id);
        await page.deletePageFromProjectId(project.id);
        await capabilities.deleteBreakpointForProjectId(project.id);
        await capabilities.deleteCapabilitiesForProjectId(project.id);
        await user.deleteUserFromProjectId(project.id);
        await projectDb.deleteProject(project);
        if (fs.existsSync(defaults.imageLocation + project.dataname)) {
            fs.rmSync(defaults.imageLocation + project.dataname, { recursive: true });
        }
    },
}

module.exports = project;