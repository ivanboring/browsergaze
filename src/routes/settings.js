const user = require('../controllers/user');
const settings = require('../controllers/settings');

module.exports = {
    approvedSettings: [
        'browser_diff_fuzz',
        'visual_regression_fuzz',
    ],
    settingsForm: async function(req, res) {
        if (user.hasPermission(req, 'change-settings')) {
            res.render('settings-form', {
                title: 'Settings',
                isAdmin: user.isAdmin(req),
                defaults: settings.getAllSettings(),
                user: user.getUser(req),
            })
        } else {
            res.redirect(301, '/projects')
        }
    },
    saveSettings: async function(req, res) {
        if (user.hasPermission(req, 'change-settings')) {
            for (let key in req.body) {
                if (key.indexOf(this.approvedSettings)) {
                    settings.setSetting(key, req.body[key]);
                }
            }
            res.redirect(301, '/settings')
        } else {
            res.redirect(301, '/projects/detail/' + projectObject.dataname)
        }
    },
}