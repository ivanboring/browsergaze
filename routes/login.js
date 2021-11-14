const user = require('../services/user');

module.exports = {
    'get': function(req, res) {
        res.render('login', {title: 'Login'})
    },
    'post': async function(req, res) {
        const login = req.body;
        const cookieValue = await user.login(req.body.username, req.body.password)
        // Could login
        if (cookieValue) {
            res.cookie('glitch_hawk_session', cookieValue, {httpOnly: true, secure: true})
            res.redirect(301, '/projects');
        } else {
            res.redirect(301, '/login');
        }
    }
}