const job = require('../services/job');
const screenshot = require('../services/screenshot');
const { 
    v1: uuidv1,
} = require('uuid');
const capabilities = require('../services/capabilities');
const util = require('util')
const { PuppeteerDirector } = require('./puppeteerDirector');
const { SeleniumDirector } = require('./seleniumDirector');

const generator = function(generatorObject) {
    this.generator = generatorObject;
    this.queue = [];
    this.running = false;
    this.director = null;
    this.currentJobId = null;
    this.currentPath = null;
    this.addToQueue = function(jobs) {
        for (capability_id in jobs) {
            let pushObject = {};
            pushObject[capability_id] = jobs[capability_id];
            this.queue.push(pushObject);
        }
        if (!this.running) {
            this.startRunning();
        }
    }
    this.startRunning = async function() {
        if (this.queue.length > 0) {
            this.running = true;
            // Load the director if it was not loaded.
            let capabilityToRun = this.queue.shift();
            for (let capability_id in capabilityToRun) {
                let pageToRun = capabilityToRun[capability_id];
                for (let page_id in pageToRun) {
                    for (let component_id in pageToRun[page_id]) {
                        let capabilityObject = await capabilities.getCapabilityForProjectCapabilityId(capability_id);
                        let runs = pageToRun[page_id][component_id];
                        let rules = await job.getRunschemaForComponentId(component_id);
                        for (let t in runs.jobs) {
                            let runJob = runs.jobs[t];
                            console.log(runJob.capability_id, runJob.width, 'Start');
                            // Start the director if it's closed.
                            if (!this.director) {
                                console.log(runJob.capability_id, runJob.width, 'Start 2');
                                this.director = this.preprocess(this.generator.server_type);
                                console.log(runJob.capability_id, runJob.width, 'Start 3');
                                this.currentJobId = uuidv1();
                                console.log(runJob.capability_id, runJob.width, 'Start 4');
                                await this.director.init(runJob.default_host_path, this.currentJobId, capabilityObject);
                                console.log(runJob.capability_id, runJob.width, 'Start 5');
                            }
                            await screenshot.setScreenshotStatus(runJob.id, 1);
                            // Goto page if not visited.
                            if (this.currentPath !== runJob.page_path) {
                                console.log(runJob.capability_id, runJob.width, 'Goto ' + runJob.page_path);
                                await this.director.goto(runJob.page_path, this.currentJobId);
                                this.currentPath = runJob.page_path;
                                // Then resize.
                                console.log(runJob.capability_id, runJob.width, 'Resize ' + runJob.width);
                                await this.director.resizeWindow(parseInt(runJob.width), parseInt(runJob.height), this.currentJobId);
                            } else {
                                // Otherwise resize and reload.
                                console.log(runJob.capability_id, runJob.width, 'Resize ' + runJob.width);
                                await this.director.resizeWindow(parseInt(runJob.width), parseInt(runJob.height), this.currentJobId);
                                console.log(runJob.capability_id, runJob.width, 'Reload');
                                await this.director.reload(this.currentJobId);
                            }

                            for (let s in rules) {
                                let rule = rules[s];
                                let parameters = JSON.parse(rule.ruleset);
                                if (rule.key == "screenshotElement") {
                                    parameters.value = runJob.path;
                                    console.log(runJob.capability_id, runJob.width, 'Screenshot values ' + runJob.path);
                                }
                                try {
                                    console.log(runJob.capability_id, runJob.width, rule.key);
                                    await this.director.runStep(rule.key, parameters, this.currentJobId);
                                    if (rule.key == "screenshotElement") {
                                        console.log('save', runJob.capability_id, runJob.width, rule.key);
                                        await screenshot.setScreenshotStatus(runJob.id, 2);
                                    }
                                } catch (e) {
                                    console.log('Failed', e);
                                    screenshot.setScreenshotStatus(runJob.id, 5);
                                    screenshot.setScreenshotError(runJob.id, e.toString());
                                    console.log('Set failure');
                                }
                            }
                        }
                    }
                }
            }
        }
        if (this.queue.length === 0) {
            await this.director.close(this.currentJobId);
            console.log('all closed', this.generator.server_type)
            this.currentJobId = null;
            this.director = null;
            this.currentPath = null;
            this.running = false;
        } else {
            this.startRunning();
        }
    }
    this.preprocess = function(processor) {
        switch (processor) {
            case 'puppeteer':
                return new PuppeteerDirector();
            case 'selenium':
                return new SeleniumDirector();
        }
    }
}

module.exports= {
    Generator: generator
}