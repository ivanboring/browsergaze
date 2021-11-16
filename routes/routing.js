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

        app.get('/projects/:projectName/page/create', require('./page').createForm);
        app.get('/projects/create', require('./projects').createForm);
        app.get('/projects/detail/:projectName', require('./projects').detail);
        app.get('/projects', require('./projects').get);
        app.post('/projects/create', require('./projects').post);

        
    }
}

module.exports = routing;