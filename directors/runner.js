const { 
    v1: uuidv1,
} = require('uuid');
const fs = require('fs')

const runner = {
    runningJobs: {},
    resultJobs: {},
    startJob: function(rules, capabilities, jobId) {
        if (typeof jobId == 'undefined') {
            jobId = uuidv1();
        }

        if (!('processor' in capabilities) || !('domain' in rules) || !('steps' in rules) || !('breakpoints' in capabilities)) {
            return false;
        }

        const director = this.preprocess(capabilities);
        this.runningJobs[jobId] = {director: director};
        this.resultJobs[jobId] = [{process: 'started', success: true, message: 'Starting'}];
        // Start backend process.
        setTimeout(() => {runner.process(rules, capabilities, jobId)}, 0);
        return true;
    },
    getStatus: function(jobId) {
        return runner.resultJobs[jobId];
    },
    preprocess: function(capabilities) {
        switch (capabilities.processor) {
            case 'puppeteer':
                return require('./puppeteerDirector')
        }
    },
    process: async function(rules, capabilities, jobId) {
        const director = runner.runningJobs[jobId].director;
        await director.init(rules.domain, jobId);
        await director.goto(rules.path, jobId);
        if (!fs.existsSync('images/' + rules.projectName + '/tmp')) {
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
                    let rmessage = await director[step.key](step.parameters, jobId);
                    this.resultJobs[jobId].push({process: step.key, success: true, message: rmessage})
                } catch (e) {
                    this.resultJobs[jobId].push({process: step.key, success: false, message: e})
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
    cancel: async function(jobId) {
        this.runningJobs[jobId]
    }
}

module.exports=runner;