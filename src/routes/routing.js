const user = require('../controllers/user')

const routing = {
    route: function(app) {
        app.get('/', (req, res) => {
            res.redirect(301, '/login')
        })

        app.get('/login', require('./login').get);
        app.post('/login', require('./login').post);
        app.get('/logout', require('./logout').get);
        
        app.get('/setup', require('./setup').get);
        app.post('/setup', require('./setup').post);

        app.post('/api/component/start/:uuid', require('./jobs').startComponent)
        app.post('/api/page/start/:uuid', require('./jobs').startPage)
        app.post('/api/project/start/:project_name', require('./jobs').startProject)
        // Status for specific screenshots
        app.get('/api/job/status/:project_name', require('./jobs').getStatusPerId);
        // Status for one job.
        app.get('/api/job/:uuid/status', require('./jobs').getStatus);
        app.get('/api/baseline/set/:screenshotId', require('./screenshots').setBaseline);

        app.get('/users', require('./users').listUsers);
        app.get('/users/create', require('./users').createUser);
        app.post('/users/create', require('./users').postCreateUser);
        app.get('/users/:userId/edit', require('./users').editUser);
        app.post('/users/:userId/edit', require('./users').postEditUser);
        app.get('/users/:userId/delete', require('./users').deleteUser);
        app.post('/users/:userId/delete', require('./users').postDeleteUser);

        app.get('/projects/:projectName/page/:pageUuid/edit', require('./pages').editForm);
        app.post('/projects/:projectName/page/:pageUuid/edit', require('./pages').update);
        app.get('/projects/:projectName/page/:pageUuid/delete', require('./pages').deleteForm);
        app.post('/projects/:projectName/page/:pageUuid/delete', require('./pages').delete);

        app.post('/runner/component/start', require('./components').startRunner)
        app.get('/runner/component/status/:jobId', require('./components').statusRunner)
        app.get('/projects/:projectName/page/create', require('./pages').createForm);
        app.get('/projects/:projectName/results', require('./jobs').getJobs);
        app.get('/projects/:projectName/results/:screenshotId/diff', require('./screenshots').diff);
        app.get('/projects/:projectName/results/:screenshotId/delete', require('./screenshots').deleteForm);
        app.post('/projects/:projectName/screenshot/delete', require('./screenshots').deleteScreenshot);
        app.get('/projects/:projectName/browser_diffs', require('./jobs').browserDiffs);
        app.get('/projects/:projectName/browser_diffs/:browserDiffId/diff', require('./screenshots').browserDiff);
        app.get('/projects/:projectName/change_browser_threshold/:thresholdId', require('./screenshots').browserDiffThreshold);
        app.post('/projects/:projectName/change_browser_threshold/:thresholdId', require('./screenshots').browserDiffSave);
        app.get('/projects/:projectName/browser_diffs/:browserDiffId/delete', require('./screenshots').browserDiffDelete);
        app.post('/projects/:projectName/browser_diffs/delete', require('./screenshots').browserDiffDeletePost);

        app.get('/projects/:projectName/component/:componentUuid/edit', require('./components').editForm);
        app.get('/projects/:projectName/component/:componentUuid/delete', require('./components').deleteForm);
        app.post('/projects/:projectName/component/delete', require('./components').deleteComponent);

        app.post('/projects/:projectName/page/create', require('./pages').post);
        app.get('/projects/:projectName/page/:pageUuid', require('./pages').detail);
        app.get('/projects/:projectName/page/:pageUuid/component/create', require('./components').createForm);
        app.post('/projects/:projectName/page/:pageUuid/component/create', require('./components').post);
        app.get('/projects/create', require('./projects').createForm);
        app.get('/projects/detail/:projectName', require('./projects').detail);
        app.get('/projects', require('./projects').get);
        app.get('/projects/:projectName/edit', require('./projects').editForm);
        app.post('/projects/:projectName/edit', require('./projects').update);
        app.get('/projects/:projectName/delete', require('./projects').deleteForm);
        app.post('/projects/:projectName/delete', require('./projects').delete);
        app.post('/projects/create', require('./projects').post);

        app.get('/servers', require('./devices').getServers);
        app.get('/servers/create', require('./devices').createServerForm);
        app.post('/servers/create', require('./devices').serverPost);
        app.get('/servers/:serverId/edit', require('./devices').editServerForm);
        app.post('/servers/:serverId/edit', require('./devices').editServer);
        app.get('/servers/:serverId/devices', require('./devices').createDeviceForm);
        app.post('/servers/:serverId/devices', require('./devices').devicePost);
        app.get('/servers/:serverId/delete', require('./devices').deleteForm);
        app.post('/servers/:serverId/delete', require('./devices').deleteServer);

        app.get('/settings', require('./settings').settingsForm);
        app.post('/settings', require('./settings').saveSettings);

        app.get('/ajax/rules.json', require('./rules').rulesList);
    }
}

module.exports = routing;