const user = require('../controllers/user');

module.exports = {
    'get': function(req, res) {
        res.render('login', {
            title: 'Login to glitch-hawk',
            description: 'Lets find design issues!'
        })
    },
    'post': async function(req, res) {
        const login = req.body;
        const cookieValue = await user.login(req.body.email, req.body.password)
        // Could login
        if (cookieValue) {
            res.cookie('glitch_hawk_session', cookieValue, {httpOnly: true, secure: true})
            res.redirect(301, '/projects');
        } else {
            res.redirect(301, '/login');
        }
    }
}