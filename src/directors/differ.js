const { 
    v1: uuidv1,
} = require('uuid');
const fs = require('fs')
const db = require('../models/db');
const generator = require('./generator');
const job = require('../services/job');
const screenshot = require('../services/screenshot');
const baseline = require('../services/baseline');
const shell = require('shelljs');

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
                let command = hawkConfig.usedBinaryCommand + ' -metric PSNR ' + scr.path + ' ' + baselineObject.path + ' ' + scr.path.replace('.png', '_diff.png');
                shell.exec(command, {async: true, silent: true}, async function(code, stdout, stderr) {
                    let regression = code ? stderr : stdout;
                    scr.visual_regression = regression.trim() == 'inf' ? 0 : parseFloat(regression.trim());
                    scr.status = 4;
                    await screenshot.updateScreenshot(scr);
                    resolve(true);
                });
            }
        );
    }
}

module.exports = differ;