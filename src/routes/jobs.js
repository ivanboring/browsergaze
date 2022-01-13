const project = require('../controllers/project');
const component = require('../controllers/component');
const user = require('../controllers/user');
const page = require('../controllers/page');
const job = require('../controllers/job');
const defaults = require('../controllers/defaults');
const capabilities = require('../controllers/capabilities');
const fs = require('fs');
const screenshot = require('../controllers/screenshot');
const helper = require('../controllers/helper');
const baseline = require('../controllers/baseline');
const browserDiff = require('../controllers/browserDiff');

const jobs = {
    browserDiffs: async function(req, res) {
        if (user.hasPermission(req, 'view-results')) {
            const pagination = 25;
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
            const capabilityOptionsFrom = helper.createSelectOptions(await capabilities.getCapabilitiesForProject(projectObject.id), 'project_capability_id', capRender, 'Any', req.query.capability_from_id);
            const capabilityOptionsTo = helper.createSelectOptions(await capabilities.getCapabilitiesForProject(projectObject.id), 'project_capability_id', capRender, 'Any', req.query.capability_to_id);

            const bpRender = [
                {type: 'value', value: 'width'},
                {type: 'space', value: 'x'},
                {type: 'value', value: 'height'},
            ];
            const breakpointOptions = helper.createSelectOptions(await project.getProjectBreakpoints(projectObject.id), 'id', bpRender, 'Any', req.query.breakpoint_id);
            let pageNumber = req.query.page ? parseInt(req.query.page) : 0;
            const browserDiffList = await browserDiff.getBrowserDiffs(projectObject.id, {
                job_id: req.query.job_id,
                page_id: req.query.page_id,
                component_id: req.query.component_id,
                capability_id_1: req.query.capability_from_id,
                capability_id_2: req.query.capability_to_id,
                breakpoint_id: req.query.breakpoint_id,
                status: req.query.status,
            }, null, null, pagination, pageNumber);

            const count = await browserDiff.getBrowserDiffsCount(projectObject.id, {
                job_id: req.query.job_id,
                page_id: req.query.page_id,
                component_id: req.query.component_id,
                capability_id_1: req.query.capability_from_id,
                capability_id_2: req.query.capability_to_id,
                breakpoint_id: req.query.breakpoint_id,
                status: req.query.status,
            });

            let statusOptions = [
                {id: '', value: 'Any', selected: req.query.status == '' ? true : false},
                {id: 1, value: 'Success', selected: req.query.status == 1 ? true : false},
                {id: 2, value: 'Failed', selected: req.query.status == 2 ? true : false},
            ];

            let screenshotIds = [];
            for (let i in browserDiffList) {
                screenshotIds.push(browserDiffList[i].id)
            }

            const total = Math.ceil(count/pagination);

            const baselines = await baseline.getBaselineForScreenshots(browserDiffList, projectObject.id);

            let queryString = [];
            let paginationQueryString = [];
            for (let o in req.query) {
                if (o !== 'page') {
                    paginationQueryString.push(o + '=' + req.query[o]);
                }
                queryString.push(o + '=' + req.query[o]);
            }

            res.render('browser-diff-list', {
                title: 'glitch-hawk: Results for ' + projectObject.name,
                pageTitle: 'Visual Test Results for ' + projectObject.name + ' Project',
                isAdmin: user.isAdmin(req),
                jobOptions: jobOptions,
                pageOptions: pageOptions,
                componentOptions: componentOptions,
                capabilityOptionsFrom: capabilityOptionsFrom,
                capabilityOptionsTo: capabilityOptionsTo,
                breakpointOptions: breakpointOptions,
                statusOptions: statusOptions,
                queryString: encodeURIComponent("/projects/" + projectObject.dataname + "/browser_diffs?" + queryString.join("&")),
                paginationString: '?' + paginationQueryString.join("&").replace(),
                baseline: baselines,
                project: projectObject,
                browserDiffs: browserDiffList,
                user: user.getUser(req),
                currentPage: pageNumber,
                paginationTotal: total,
            });
        } else {
            res.status(403).send('No access');
        }
    },
    getJobs: async function(req, res) {
        const pagination = 25;
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
        const capabilityOptions = helper.createSelectOptions(await capabilities.getCapabilitiesForProject(projectObject.id), 'project_capability_id', capRender, 'Any', req.query.capability_id);

        const bpRender = [
            {type: 'value', value: 'width'},
            {type: 'space', value: 'x'},
            {type: 'value', value: 'height'},
        ];
        const breakpointOptions = helper.createSelectOptions(await project.getProjectBreakpoints(projectObject.id), 'id', bpRender, 'Any', req.query.breakpoint_id);

        let pageNumber = req.query.page ? parseInt(req.query.page) : 0;
        const screenshots = await screenshot.getScreenshots(projectObject.id, {
            page_id: req.query.page_id,
            job_id: req.query.job_id,
            component_id: req.query.component_id,
            capability_id: req.query.capability_id,
            breakpoint_id: req.query.breakpoint_id,
        }, null, null, pagination, pageNumber);

        const count = await screenshot.getScreenshotsCount(projectObject.id, {
            page_id: req.query.page_id,
            job_id: req.query.job_id,
            component_id: req.query.component_id,
            capability_id: req.query.capability_id,
            breakpoint_id: req.query.breakpoint_id,
        });
        
        const total = Math.ceil(count/pagination);

        let screenshotIds = [];
        for (let i in screenshots) {
            screenshotIds.push(screenshots[i].id)
        }

        const baselines = await baseline.getBaselineForScreenshots(screenshots, projectObject.id);

        let queryString = [];
        let paginationQueryString = [];        
        for (let o in req.query) {
            if (o !== 'page') {
                paginationQueryString.push(o + '=' + req.query[o]);
            }
            queryString.push(o + '=' + req.query[o]);
        }
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
            queryString: encodeURIComponent("/projects/" + projectObject.dataname + "/results?" + queryString.join("&")),
            paginationString: '?' + paginationQueryString.join("&").replace(),
            baseline: baselines,
            project: projectObject,
            screenshots: screenshots,
            user: user.getUser(req),
            currentPage: pageNumber,
            paginationTotal: total,
        });
    },
    getStatus: async function(req, res) {
        const jobObject = await job.getJobFromUuid(req.params.uuid);
        if(typeof jobObject === "undefined") {
            res.status(404).send('Not found')
            return;
        }
        const screenshots = await screenshot.getScreenshotsFromJob(jobObject.id);
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
    startPage: async function(req, res) {
        if (!user.hasPermission(req, 'start-test')) {
            res.status(403).send('No access');
        } else if (!("uuid" in req.params)) {
            res.status(400).send('No uuid in params');
        } else {
            const pageObject = await page.getPageByUuid(req, req.params.uuid);
            if (typeof pageObject === "undefined") {
                res.status(404).send('Can not find that component')
                return;
            }
            const projectObject = await project.getProjectById(req, pageObject.project_id);
            const components = await component.getComponentsForPage(req, pageObject);
            const jobId = await job.createJob(projectObject.id);
            const jobUuid = await job.getUuidFromId(jobId);
            // Create the directory to store images in.
            const newDir = `${defaults.imageLocation}${projectObject.dataname}/jobs/${jobUuid}`;
            if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true })
            }
            for (let i in components) {
                let componentObject = components[i];
                const jobStarted = await component.getBreakpointCapabilityForComponent(componentObject);
                for (let capability_id in jobStarted) {
                    let startJobs = jobStarted[capability_id];
                    for(let i in startJobs) {
                        let startJob = startJobs[i];
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
                            capability_id: startJob.project_capabilities_id,
                            breakpoint_id: startJob.breakpoint_id,
                            generator_server: startJob.generator_server_id,
                        })
                    }
                }
            }

            res.json({id: jobId, uuid: jobUuid});
        }
    }
}

module.exports=jobs