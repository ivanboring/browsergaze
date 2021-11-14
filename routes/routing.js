const user = require('../services/user')

const routing = {
    route: function(app) {
        app.get('/', (req, res) => {
            res.send('login')
        })

        app.get('/login', require('./login').get);
        app.post('/login', require('./login').post);
        app.get('/logout', require('./logout').get);
        
        app.get('/setup', require('./setup').get);
        app.post('/setup', require('./setup').post);

        app.get('/projects', require('./projects').get);
        app.post('/projects', require('./projects').post);
    }
}

module.exports = routing;