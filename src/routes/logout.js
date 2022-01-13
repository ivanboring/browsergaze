const user = require('../controllers/user');

module.exports = {
    'get': function(req, res) {
        user.logout(req.cookies.glitch_hawk_session);
        res.cookie('glitch_hawk_session', '', {maxAge: 0, httpOnly: true, secure: true})
        res.redirect(301, '/login')
    }
}