const project = require('../services/project');
const user = require('../services/user');
const page = require('../services/page');
const screenshot = require('../services/screenshot');
const baseline = require('../services/baseline');
const browserDiff = require('../services/browserDiff');
const component = require('../services/component');

const screenshots = {
    diff: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName)
        const screenshotObject = await screenshot.getScreenshot(req.params.screenshotId);
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
    browserDiff: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const browserDiffObject = await browserDiff.getBrowserDiff(req.params.browserDiffId);
        if (!projectObject || projectObject.id != browserDiffObject.project_id) {
            res.redirect(301, '/projects')
            return
        }
        res.render('browser-diff-detail', {
            title: 'glitch-hawk: browser diff shots ' + projectObject.name,
            pageTitle: 'Browser diff shots on ' + projectObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            fromName: browserDiffObject.from_browser_name,
            toName: browserDiffObject.to_browser_name,
            fromPlatform: browserDiffObject.from_platform,
            toPlatform: browserDiffObject.to_platform,
            fromPlatformVersion: browserDiffObject.from_platform_version,
            toPlatformVersion: browserDiffObject.to_platform_version,
            fromPath: browserDiffObject.from_path,
            toPath: browserDiffObject.to_path,
            diffPath: browserDiffObject.path,
            user: user.getUser(req),
        });
    },
    browserDiffThreshold: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const browserThreshold = await component.getBrowserThreshold(req.params.thresholdId);
        if (!projectObject || projectObject.id != browserThreshold.project_id) {
            res.redirect(301, '/projects')
            return
        }
        res.render('browser-change-threshold', {
            title: 'glitch-hawk: change threshold ' + projectObject.name,
            pageTitle: 'Change threshold for ' + projectObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            threshold: browserThreshold.browser_threshold,
            redirect: req.query.redirect,
            user: user.getUser(req),
        });
    },
    browserDiffSave: async function(req, res) {
        if (user.hasPermission(req, 'delete-results')) {
            const projectObject = await project.getProjectByName(req, req.params.projectName);
            const browserThreshold = await component.getBrowserThreshold(req.params.thresholdId);
            if (!projectObject || projectObject.id != browserThreshold.project_id) {
                res.redirect(301, '/projects')
                return
            }
            await component.updateBrowserThreshold(browserThreshold.id, req.body.threshold);
            res.redirect(301, decodeURIComponent(req.body.redirect));
        } else {
            res.redirect(301, '/projects')
        }
    },
    browserDiffDelete: async function(req, res) {
        const projectObject = await project.getProjectByName(req, req.params.projectName);
        const browserDiffObject = await browserDiff.getBrowserDiff(req.params.browserDiffId);
        if (!projectObject || projectObject.id != browserDiffObject.project_id) {
            res.redirect(301, '/projects')
            return
        }
        res.render('browser-diff-delete', {
            title: 'glitch-hawk: Delete browser diff ' + projectObject.name,
            pageTitle: 'Delete browser diff for ' + projectObject.name,
            isAdmin: user.isAdmin(req),
            project: projectObject,
            id: browserDiffObject.id,
            redirect: req.query.redirect,
            user: user.getUser(req),
        });
    },
    browserDiffDeletePost: async function(req, res) {
        if (user.hasPermission(req, 'delete-results')) {
            const projectObject = await project.getProjectByName(req, req.params.projectName);
            const browserDiffObject = await browserDiff.getBrowserDiff(req.body.browser_diff_id);
            if (!projectObject || projectObject.id != browserDiffObject.project_id) {
                res.redirect(301, '/projects')
                return
            }
            await browserDiff.deleteBrowserDiff(req.body.browser_diff_id);
            res.redirect(301, decodeURIComponent(req.body.redirect));
        } else {
            res.redirect(301, '/projects')
        }
    },
    deleteForm: async function(req, res) {
        const screenshotObject = await screenshot.getScreenshot(req.params.screenshotId);
        const pageObject = await page.getPageById(req, screenshotObject.page_id);
        const projectObject = await project.getProjectById(req, screenshotObject.project_id);
        if (user.hasPermission(req, 'delete-results')) {
            res.render('screenshot-delete', {
                title: 'Delete Screenshot id: ' + screenshotObject.id,
                project: projectObject,
                page: pageObject,
                id: screenshotObject.id,
                redirect: req.query.redirect,
                user: user.getUser(req),
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    deleteScreenshot: async function(req, res) {
        const screenshotObject = await screenshot.getScreenshot(req.body.screenshot_id);
        if (user.hasPermission(req, 'delete-results')) {
            screenshot.deleteScreenshot(screenshotObject)
            res.redirect(301, decodeURIComponent(req.body.redirect));
        } else {
            res.redirect(301, '/projects');
        }
    },
    setBaseline: async function(req, res) {
        if (user.isCreator(req)) {
            const screenshotObject = await screenshot.getScreenshot(req.params.screenshotId);
            baseline.setBaseline(screenshotObject);
            res.json({status: true, id: screenshotObject.id});
        } else {
            res.status(401).send('No access')
        }        
    }
}

module.exports=screenshots