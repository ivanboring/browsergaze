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

const screenshots = {
    diff: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName)
        const screenshotObject = await screenshot.getScreenshot(req.params.screenshot_id);
        console.log(projectObject);
        console.log(screenshotObject);
        if (!projectObject || projectObject.id != screenshotObject.project_id) {
            res.redirect(301, '/projects')
            return
        }
        const baselineObject = await baseline.getBaselineForScreenshot(screenshotObject);
        res.render('screenshot-diff', {
            title: 'glitch-hawk: compare component shots ' + projectObject.name,
            pageTitle: 'Compare component shots on ' + projectObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            screenshot: screenshotObject,
            baseline: baselineObject,
            user: user.getUser(req),
        });
    },
}

module.exports=screenshots