const validate = require('../services/validate');
const project = require('../services/project');
const user = require('../services/user');
const form = require('../services/form');
const page = require('../services/page');

module.exports = {
    createForm: async function(req, res) {
        const projectData = await project.getProjectByName(req, req.params.projectName)
        if (user.isAdmin(req)) {
            res.render('page-create', {
                title: 'Create Page for ' + projectData.name,
                project: projectData,
                form: form.populateFormDefaults('page', req),
                user: user.getUser(req),
            })
        } else {
            res.redirect(301, '/projects')
        }
    } 
}