const { 
    v1: uuidv1,
} = require('uuid');
const fs = require('fs')
const db = require('../models/db');
const screenshot = require('../controllers/screenshot');
const { Generator } = require('./generator');
const { PuppeteerDirector } = require('./puppeteerDirector');
const { SeleniumDirector } = require('./seleniumDirector');

const runner = {
    runningJobs: {},
    resultJobs: {},
    generators: {},
    lastJobId: 0,
    startJob: function(rules, capabilities, jobId) {
        if (typeof jobId == 'undefined') {
            jobId = uuidv1();
        }

        if (!('processor' in capabilities) || !('domain' in rules) || !('steps' in rules) || !('breakpoints' in capabilities)) {
            return false;
        }

        const director = this.preprocess(capabilities.processor);
        this.runningJobs[jobId] = {director: director};
        this.resultJobs[jobId] = [{process: 'started', success: true, message: 'Starting'}];
        // Start backend process.
        setTimeout(() => {runner.process(rules, capabilities, jobId)}, 0);
        return true;
    },
    getStatus: function(jobId) {
        return runner.resultJobs[jobId];
    },
    preprocess: function(processor) {
        switch (processor) {
            case 'puppeteer':
                return new PuppeteerDirector();
            case 'selenium':
                return new SeleniumDirector();
        }
    },
    process: async function(rules, capabilities, jobId) {
        const director = runner.runningJobs[jobId].director;
        await director.init(rules.domain, jobId);
        await director.goto(rules.path, jobId);
        if ('screenshotAll' in rules && rules.screenshotAll && !fs.existsSync('images/' + rules.projectName + '/tmp')) {
            fs.mkdirSync('images/' + rules.projectName + '/tmp');
        }
        this.resultJobs[jobId].push({process: 'init', success: true, message: 'Loaded url ' + rules.domain + rules.path});
        if ('screenshotAll' in rules && rules.screenshotAll) {
            await director.screenshot('images/' + rules.projectName + '/tmp/1.png', jobId);
            this.resultJobs[jobId].push({process: 'screenshotAll', success: true, message: 'images/' + rules.projectName + '/tmp/1.png'});
        }
        let screenshotId = 2;
        for (let b in capabilities.breakpoints) {
            let breakpoint = capabilities.breakpoints[b];
            await director.resizeWindow(parseInt(breakpoint.width), parseInt(breakpoint.height), jobId);
            this.resultJobs[jobId].push({process: 'resize', success: true, message: 'Resized to ' + breakpoint.width + 'x' + breakpoint.height});
            for (let s in rules.steps) {
                let step = rules.steps[s];
                try {
                    let rmessage = await director.runStep(step.key, step.parameters, jobId);
                    this.resultJobs[jobId].push({process: step.key, success: true, message: rmessage})
                } catch (e) {
                    this.resultJobs[jobId].push({process: step.key, success: false, message: e.toString()})
                    director.close(jobId);
                    return;
                }
                if ('screenshotAll' in rules && rules.screenshotAll) {
                    await director.screenshot('images/' + rules.projectName + '/tmp/' + screenshotId + '.png', jobId);
                    this.resultJobs[jobId].push({process: 'screenshotAll', success: true, message: 'images/' + rules.projectName + '/tmp/' + screenshotId + '.png'});
                    screenshotId++;
                }
            }
        }
        await director.close(jobId)
        this.resultJobs[jobId].push({process: 'close', success: true, message: 'Finished'});
    },
    startGenerators: async function() {
        let generators = await runner.getGenerators();
        for (let i in generators) { 
            runner.generators[generators[i].id] = [];
            for (let b = 0; b < generators[i].concurrency; b++) {
                runner.generators[generators[i].id].push(new Generator(generators[i]));
            }
        }
        
        setTimeout(runner.checkForJobs, 1000);
    },
    getGenerators: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT * FROM generator_servers;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    checkForJobs: async function() {
        let jobsList = await screenshot.getUnrunScreenshots(runner.lastJobId);
        // Group by page and add to the queue.
        let jobGroups = {}
        for (let i in jobsList) {
            let a = jobsList[i];
            if (!(a.generator_server in jobGroups)) {
                jobGroups[a.generator_server] = {}
            }
            if (!(a.capability_id in jobGroups[a.generator_server])) {
                jobGroups[a.generator_server][a.capability_id] = {}
            }
            if (!(a.page_id in jobGroups[a.generator_server][a.capability_id])) {
                jobGroups[a.generator_server][a.capability_id][a.page_id] = {}
            }
            if (!(a.component_id in jobGroups[a.generator_server][a.capability_id][a.page_id])) {
                jobGroups[a.generator_server][a.capability_id][a.page_id][a.component_id] = {jobs: []};
            }
            jobGroups[a.generator_server][a.capability_id][a.page_id][a.component_id]["jobs"].push(a);
        }

        for (let b in jobGroups) {
            // Itterate to get the last job id.
            for(let t in jobGroups[b]) {
                for(let i in jobGroups[b][t]) {
                    for (let s in jobGroups[b][t][i]) {
                        for (let p in jobGroups[b][t][i][s].jobs) {
                            let job = jobGroups[b][t][i][s].jobs[p]; 
                            runner.lastJobId = job.id;
                        }
                    }
                }
            }
            // Check againt concurrency.
            let v = 0;
            for (let t in jobGroups[b]) {
                if(typeof runner.generators[b][v] !== 'undefined') {
                    let newObject = {};
                    newObject[t] = jobGroups[b][t];
                    runner.generators[b][v].addToQueue(newObject);
                }
                v++;
            }
        }
        setTimeout(runner.checkForJobs, 5000);
    },
    runNext: async function() {
        const director = this.preprocess(capBreaks[0].server_type);
        await director.init(rules.domain, jobId);
        await director.goto(rules.path, jobId);
        for (let i in capBreaks) {
            let caps = capBreaks[i];
            await director.resizeWindow(parseInt(caps.width), parseInt(caps.height), jobId);
            if (i > 0) {
                await director.reload(jobId);
            }
            for (let s in rules.steps) {
                let step = rules.steps[s];
                if (step.key == "screenshotElement") {
                    step.parameters.value = `${newDir}/${caps['component_uuid']}_${caps['capability_id']}_${caps['width']}_${caps['height']}.png`
                }
                try {
                    await director.runStep(step.keystep.parameters, jobId);
                } catch (e) {
                    screenshot.setScreenshotStatus(runJob.id, 5);
                    screenshot.setScreenshotError(runJob.id, e.toString());
                    director.close(jobId);
                    return;
                }
            }
        }
        await director.close(jobId)
    },
    cancel: async function(jobId) {
        this.runningJobs[jobId]
    }
}

module.exports=runner;