const user = require('../services/user');

module.exports = {
    'get': function(req, res) {
        res.render('projects', {title: 'Projects'})
    },
    'post': async function(req, res) {

    }
}