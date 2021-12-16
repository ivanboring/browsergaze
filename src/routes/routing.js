const user = require('../services/user')

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
        app.post('/api/project/start/:project_name', require('./jobs').startProject)
        // Status for specific screenshots
        app.get('/api/job/status/:project_name', require('./jobs').getStatusPerId);
        // Status for one job.
        app.get('/api/job/:uuid/status', require('./jobs').getStatus);
        app.get('/api/baseline/set/:screenshotId', require('./screenshots').setBaseline);

        app.post('/runner/component/start', require('./components').startRunner)
        app.get('/runner/component/status/:jobId', require('./components').statusRunner)
        app.get('/projects/:projectName/page/create', require('./pages').createForm);
        app.get('/projects/:projectName/results', require('./jobs').getJobs);
        app.get('/projects/:projectName/results/diff/:screenshotId', require('./screenshots').diff);

        app.get('/projects/:projectName/component/:componentUuid/edit', require('./components').editForm);

        app.post('/projects/:projectName/page/create', require('./pages').post);
        app.get('/projects/:projectName/page/:pageUuid', require('./pages').detail);
        app.get('/projects/:projectName/page/:pageUuid/component/create', require('./components').createForm);
        app.post('/projects/:projectName/page/:pageUuid/component/create', require('./components').post);
        app.get('/projects/create', require('./projects').createForm);
        app.get('/projects/detail/:projectName', require('./projects').detail);
        app.get('/projects', require('./projects').get);
        app.get('/projects/:projectName/edit', require('./projects').editForm);
        app.post('/projects/:projectName/edit', require('./projects').update);
        app.post('/projects/create', require('./projects').post);

        app.get('/servers', require('./devices').getServers);
        app.get('/servers/create', require('./devices').createServerForm);
        app.post('/servers/create', require('./devices').serverPost);
        app.get('/servers/:serverId/devices', require('./devices').createDeviceForm);
        app.post('/servers/:serverId/devices', require('./devices').devicePost);

        app.get('/ajax/rules.json', require('./rules').rulesList);
    }
}

module.exports = routing;