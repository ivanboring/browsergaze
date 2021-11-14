const user = require('../services/user');

module.exports = {
    'get': function(req, res) {
        res.render('setup', {title: 'Setup Super Admin'})
    },
    'post': function(req, res) {
        const superAdmin = req.body;
        superAdmin.role = 1;
        user.createUser(req.body)
        res.redirect(301, '/login')
    }
}