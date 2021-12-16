const user = require('../services/user');
const form = require('../services/form');
const validate = require('../services/validate');

module.exports = {
    'get': function(req, res) {
        res.render('setup', {
            title: 'Setup the first user',
            description: 'Visual testing awaits you!',
            form: form.populateFormDefaults('user', req),
        })
    },
    'post': async function(req, res) {
        let validationErrors = await user.createUser(req.body)

        if (validationErrors !== null) {
            validate.redirect('/setup', req.body, validationErrors, req, res)
        } else {
            res.redirect(301, '/login')
        }
    }
}