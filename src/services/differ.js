const screenshot = require('../controllers/screenshot');
const baseline = require('../controllers/baseline');
const component = require('../controllers/component');
const defaults = require('../controllers/defaults');
const shell = require('shelljs');
const browserDiff = require('../controllers/browserDiff');
const project = require('../controllers/project');
const job = require('../controllers/job');
const settings = require('../controllers/settings');

const differ = {
    running: false,
    lastId: 0,
    startDiffer: async function() {
        setTimeout(differ.checkForJobs, 1000);
    },
    checkForJobs: async function() {
        if (!differ.running) {
            differ.running = true;
            let screenshots = await screenshot.getUndiffedScreenshots(differ.lastId);

            if (typeof screenshots != 'undefined' && screenshots.length) {
                await differ.startDiff(screenshots[0]);
            }
            differ.running = false;
            setTimeout(differ.checkForJobs, 500);
        }
        else {
            setTimeout(differ.checkForJobs, 3000);
        }
    },
    startDiff: async function(scr) {
        await screenshot.setScreenshotStatus(scr.id, 3);
        let baselineObject = await baseline.getBaseline(scr.project_id, scr.component_id, scr.capability_id, scr.breakpoint_id);
        if (typeof baselineObject == 'undefined') {
            await baseline.setBaseline(scr);
            return;
        }

        return new Promise(
            (resolve, reject) => {
                let command = hawkConfig.usedBinaryCommand + ' -metric AE -fuzz ' + settings.getSetting('visual_regression_fuzz') +  '% ' + scr.path + ' ' + baselineObject.path + ' ' + scr.path.replace('.png', '_diff.png');
                shell.exec(command, {async: true, silent: true}, async function(code, stdout, stderr) {
                    let regression = code ? stderr : stdout;
                    let failedPixels = regression.trim() == 'inf' ? 0 : parseFloat(regression.trim())
                    let realRegression = Math.round((failedPixels / (scr.width*scr.height)) * 10000)/100;
                    scr.visual_regression = realRegression ? realRegression : 0;
                    scr.status = 4;
                    await screenshot.updateScreenshot(scr);
                    setTimeout(() => { differ.checkForBrowserDiffs(scr) }, 200);
                    resolve(true);
                });
            }
        );
    },
    checkForBrowserDiffs: async function(scr) {
        let diffJobs = await this.checkWhoToDiff(scr);
        let projectObject = await project.getProjectByIdWithoutReq(scr.project_id);
        let uuid = await job.getUuidFromId(scr.job_id);
        let toPath = defaults.imageLocation + projectObject.dataname + '/jobs/' + uuid + '/';
        for (let job of diffJobs) {
            let filename = job.fromObject.component_id + '_' + job.fromObject.capability_id + '_' + job.toObject.capability_id + '_' + job.fromObject.breakpoint_id + '.png';
            let command = hawkConfig.usedBinaryCommand + ' -metric AE -fuzz ' + settings.getSetting('browser_diff_fuzz') + '% ' + job.fromObject.path + ' ' + job.toObject.path + ' ' + toPath + filename;
            shell.exec(command, {async: true, silent: true}, async function(code, stdout, stderr) {
                let regression = code ? stderr : stdout;
                let failedPixels = regression.trim() == 'inf' ? 0 : parseFloat(regression.trim())
                let realRegression = Math.round((failedPixels / (scr.width*scr.height)) * 10000)/100;
                let endStatus = realRegression > job.browser_threshold ? 2 : 1;
                await browserDiff.createBrowserDiff({
                    job_id: scr.job_id,
                    project_id: scr.project_id,
                    page_id: job.toObject.page_id,
                    component_id: job.toObject.component_id,
                    from_capability: job.fromObject.capability_id,
                    from_screenshot_id: job.fromObject.id,
                    to_capability: job.toObject.capability_id,
                    to_screenshot_id: job.toObject.id,
                    threshold_id: job.id,
                    breakpoint_id: job.toObject.breakpoint_id,
                    diff: realRegression,
                    status: endStatus,
                    created_time: Date.now(),
                    path: toPath + filename
                });
            });
        }
    },
    checkWhoToDiff: async function(scr) {
        // Check if finished.
        let allScreenshots = await screenshot.getScreenshotsFromJob(scr.job_id);
        let finished = true;
        let componentsList = [];
        for (let i in allScreenshots) {
            if (!componentsList.includes(allScreenshots[i].component_id)) {
                componentsList.push(allScreenshots[i].component_id);
            }
            if (allScreenshots[i].status < 4) {
                finished = false;
            }
        }
        let jobsToRun = [];
        if (finished) {
            if (componentsList.length > 0) {
                for (let componentId of componentsList) {
                    let runList = await this.getRunScheduleForComponent(componentId);
                    for(let nextRun of runList) {
                        if (nextRun.active) {
                            let found = 0;
                            for (let i in allScreenshots) {
                                if (allScreenshots[i].component_id == componentId && allScreenshots[i].status == 4 && 
                                    allScreenshots[i].capability_id == nextRun.capabilities_id_from && allScreenshots[i].breakpoint_id == nextRun.breakpoint_id) {
                                    nextRun.fromObject = allScreenshots[i];
                                    found++;
                                }
                                if (allScreenshots[i].component_id == componentId && allScreenshots[i].status == 4 &&
                                    allScreenshots[i].capability_id == nextRun.capabilities_id_to && allScreenshots[i].breakpoint_id == nextRun.breakpoint_id) {
                                    nextRun.toObject = allScreenshots[i];
                                    found++;
                                }
                            }
                            if (found == 2) {
                                jobsToRun.push(nextRun);
                            }
                        }
                    }
                }
            }
        }
        return jobsToRun;
    },
    getRunScheduleForComponent: async function(componentId) {
        return await component.getBrowserDiffsForComponent(componentId)
    }
}

module.exports = differ;