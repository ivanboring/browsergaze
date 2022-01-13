const user = require('../controllers/user');
const form = require('../controllers/form');
const validate = require('../controllers/validate');

module.exports = {
    'get': function(req, res) {
        res.render('setup', {
            title: 'Setup the first user',
            description: 'Visual testing awaits you!',
            form: form.populateFormDefaults('user', req),
        })
    },
    'post': async function(req, res) {
        let userObject = req.body;
        userObject.role = "1";
        let validationErrors = await user.createUser(userObject)
        console.log(validationErrors);
        if (validationErrors !== null) {
            validate.redirect('/setup', req.body, validationErrors, req, res)
        } else {
            res.redirect(301, '/login')
        }
    }
}