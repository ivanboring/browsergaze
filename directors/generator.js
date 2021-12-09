const job = require('../services/job');
const screenshot = require('../services/screenshot');
const { 
    v1: uuidv1,
} = require('uuid');

const generator = {
    queue: [],
    running: false,
    generator: {},
    director: null,
    currentJobId: null,
    currentPath: null,
    startGenerator: function(generatorObject) {
        this.generator = generatorObject;
    },
    addToQueue: function(jobs) {
        for (page_id in jobs) {
            let pushObject = {};
            pushObject[page_id] = jobs[page_id];
            this.queue.push(pushObject);
        }
        if (!this.running) {
            this.startRunning();
        }
    },
    startRunning: async function() {
        if (this.queue.length > 0) {
            this.running = true;
            // Load the director if it was not loaded.
            let pageToRun = this.queue.shift();
            console.log('pageToRun', pageToRun);
            console.log('queue', this.queue);
            for (let page_id in pageToRun) {
                for (let component_id in pageToRun[page_id]) {
                    let runs = pageToRun[page_id][component_id];
                    let rules = await job.getRunschemaForComponentId(component_id);
                    for (let t in runs.jobs) {
                        runJob = runs.jobs[t];
                        console.log('runjob', runJob.id);
                        await screenshot.setScreenshotStatus(runJob.id, 1);
                        // Start the director if it's closed.
                        if (!this.director) {
                            this.director = this.preprocess(this.generator.server_type);
                            this.currentJobId = uuidv1();
                            await this.director.init(runJob.default_host_path, this.currentJobId);
                        }
                        // Goto page if not visited.
                        if (this.currentPath !== runJob.page_path) {
                            await this.director.goto(runJob.page_path, this.currentJobId);
                            // Then resize.
                            await this.director.resizeWindow(parseInt(runJob.width), parseInt(runJob.height), this.currentJobId);
                        } else {
                            // Otherwise resize and reload.
                            await this.director.resizeWindow(parseInt(runJob.width), parseInt(runJob.height), this.currentJobId);
                            await this.director.reload(this.currentJobId);
                        }

                        for (let s in rules) {
                            let rule = rules[s];
                            let parameters = JSON.parse(rule.ruleset);
                            if (rule.key == "screenshotElement") {
                                parameters.value = runJob.path;
                            }
                            try {
                                await this.director[rule.key](parameters, this.currentJobId);
                            } catch (e) {
                                await this.director.close(this.currentJobId);
                                return;
                            }
                        }
                        await screenshot.setScreenshotStatus(runJob.id, 2);
                    }
                }
            }
        }
        console.log('queue end', this.queue.length);
        if (this.queue.length === 0) {
            console.log('All done!');
            await this.director.close(this.currentJobId);
            this.currentJobId = null;
            this.director = null;
            this.running = false;
        } else {
            this.startRunning();
        }
    },
    preprocess: function(processor) {
        switch (processor) {
            case 'puppeteer':
                return require('./puppeteerDirector')
        }
    },
}

module.exports=generator