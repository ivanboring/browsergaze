const validate = require('../services/validate');
const project = require('../services/project');
const component = require('../services/component');
const user = require('../services/user');
const form = require('../services/form');
const page = require('../services/page');
const job = require('../services/job');
const defaults = require('../services/defaults');
const capabilities = require('../services/capabilities');
const runner = require('../directors/runner.js');
const fs = require('fs');
const yaml = require('js-yaml');
const screenshot = require('../services/screenshot');
const helper = require('../services/helper');
const baseline = require('../services/baseline');

const jobs = {
    getJobs: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const jobOptions = helper.createSelectOptions(await job.getJobFromProjectId(projectObject.id), 'id', 'uuid', 'Any', req.query.job_id);
        const pageOptions = helper.createSelectOptions(await page.getPagesByProjectId(req, projectObject.id), 'id', 'name', 'Any', req.query.page_id);
        const componentOptions = helper.createSelectOptions(await component.getComponentsForProject(req, projectObject.id), 'id', 'name', 'Any', req.query.component_id);
        const capRender = [
            {type: 'value', value: 'browser_name'},
            {type: 'space', value: ' '},
            {type: 'value', value: 'browser_version'},
            {type: 'space', value: ' on '},
            {type: 'value', value: 'platform'},
            {type: 'space', value: ' '},
            {type: 'value', value: 'platform_version'},
            {type: 'space', value: ' ('},
            {type: 'value', value: 'server_name'},
            {type: 'space', value: ')'},
        ];
        const capabilityOptions = helper.createSelectOptions(await capabilities.getCapabilitiesForProject(projectObject.id), 'id', capRender, 'Any', req.query.capability_id);

        const bpRender = [
            {type: 'value', value: 'width'},
            {type: 'space', value: 'x'},
            {type: 'value', value: 'height'},
        ];
        const breakpointOptions = helper.createSelectOptions(await project.getProjectBreakpoints(req, projectObject.id), 'id', bpRender, 'Any', req.query.breakpoint_id);

        const screenshots = await screenshot.getScreenshots(projectObject.id, {
            job_id: req.query.job_id,
            page_id: req.query.page_id,
            component_id: req.query.component_id,
            capability_id: req.query.capability_id,
            breakpoint_id: req.query.breakpoint_id,
        });

        let screenshotIds = [];
        for (let i in screenshots) {
            screenshotIds.push(screenshots[i].id)
        }

        const baselines = await baseline.getBaselineForScreenshots(screenshots, projectObject.id);

        res.render('job-list', {
            title: 'glitch-hawk: Results for ' + projectObject.name,
            pageTitle: 'Visual Test Results for ' + projectObject.name + ' Project',
            isAdmin: user.isAdmin(req),
            jobOptions: jobOptions,
            pageOptions: pageOptions,
            componentOptions: componentOptions,
            capabilityOptions: capabilityOptions,
            breakpointOptions: breakpointOptions,
            screenshotIds: screenshotIds,
            baseline: baselines,
            project: projectObject,
            screenshots: screenshots,
            user: user.getUser(req),
        });
    },
    getStatus: async function(req, res) {
        const jobObject = await job.getJobFromUuid(req.params.uuid);
        if(typeof jobObject === "undefined") {
            res.status(404).send('Not found')
            return;
        }
        const screenshots = await screenshot.getScreenshotsFromJob(jobObject);
        res.json(screenshots);
    },
    getStatusPerId: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.project_name);
        if(typeof projectObject === "undefined") {
            res.status(404).send('Not found')
            return;
        }
        const screenshots = await screenshot.getScreenshotsFromIds(req.query.ids.split(','));
        res.json(screenshots);
    },
    startComponent: async function(req, res) {
        if (user.isCreator(req) == false) {
            res.status(403).send('No access');
        } else if (!("uuid" in req.params)) {
            res.status(400).send('No uuid in params');
        } else {
            const componentObject = await component.getComponentByUuid(req, req.params.uuid);
            if (!("id" in componentObject)) {
                res.status(404).send('Can not find that component')
                return;
            }
            const projectObject = await project.getProjectById(req, componentObject.project_id);
            const pageObject = await page.getPageById(req, componentObject.page_id);
            const jobId = await job.createJob(projectObject.id);
            const jobUuid = await job.getUuidFromId(jobId);
            // Create the directory to store images in.
            const newDir = `${defaults.imageLocation}${projectObject.dataname}/jobs/${jobUuid}`;
            if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true })
            }
            
            const jobStarted = await component.getBreakpointCapabilityForComponent(componentObject);

            for (let capability_id in jobStarted) {
                let startJobs = jobStarted[capability_id];
                for(let i in startJobs) {
                    let startJob = startJobs[i];
                    console.log(startJob);
                    screenshot.createQueuedScreenshot({
                        project_id: projectObject.id,
                        page_id: pageObject.id,
                        component_id: componentObject.id,
                        job_id: jobId,
                        path: `${newDir}/${componentObject.id}_${startJob['capability_id']}_${startJob['width']}_${startJob['height']}.png`,
                        created_time: Date.now(),
                        status: 0,
                        capability_id: startJob.project_capabilities_id,
                        breakpoint_id: startJob.breakpoint_id,
                        generator_server: startJob.generator_server_id,
                    })
                }
            }
            res.json({id: jobId, uuid: jobUuid});
        }
    },
    startProject: async function(req, res) {
        if (user.isCreator(req) == false) {
            res.status(403).send('No access');
        } else if (!("project_name" in req.params)) {
            res.status(400).send('No project_name in params');
        } else {
            const projectObject = await project.getProjectByName(req, req.params.project_name);
            if (!("id" in projectObject)) {
                res.status(404).send('Can not find that component')
                return;
            }
            const jobId = await job.createJob(projectObject.id);
            const jobUuid = await job.getUuidFromId(jobId);

            const newDir = `${defaults.imageLocation}${projectObject.dataname}/jobs/${jobUuid}`;
            if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true })
            }
            let components = await component.getComponentsForProject(req, projectObject.id);
            for (let i in components) {
                let componentObject = components[i];
                let jobStarted = await component.getBreakpointCapabilityForComponent(componentObject);
                for (let capability_id in jobStarted) {
                    let startJobs = jobStarted[capability_id];
                    for(let i in startJobs) {
                        let startJob = startJobs[i];
                        screenshot.createQueuedScreenshot({
                            project_id: projectObject.id,
                            page_id: componentObject.page_id,
                            component_id: componentObject.id,
                            job_id: jobId,
                            path: `${newDir}/${componentObject.id}_${startJob['capability_id']}_${startJob['width']}_${startJob['height']}.png`,
                            created_time: Date.now(),
                            status: 0,
                            capability_id: capability_id,
                            breakpoint_id: startJob.breakpoint_id,
                        })
                    }
                }
            }

            res.json({id: jobId, uuid: jobUuid});
        }
    }
}

module.exports=jobs