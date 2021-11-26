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

        app.post('/runner/component/start', require('./components').startRunner)
        app.get('/runner/component/status/:jobId', require('./components').statusRunner)
        app.get('/projects/:projectName/page/create', require('./pages').createForm);
        app.post('/projects/:projectName/page/create', require('./pages').post);
        app.get('/projects/:projectName/page/:pageUuid', require('./pages').detail);
        app.get('/projects/:projectName/page/:pageUuid/component/create', require('./components').createForm);
        app.post('/projects/:projectName/page/:pageUuid/component/create', require('./components').post);
        app.get('/projects/create', require('./projects').createForm);
        app.get('/projects/detail/:projectName', require('./projects').detail);
        app.get('/projects', require('./projects').get);
        app.post('/projects/create', require('./projects').post);

        app.get('/ajax/rules.json', require('./rules').rulesList);
    }
}

module.exports = routing;