const fs = require('fs');
const yaml = require('js-yaml');
const rules = require('../controllers/rules');

module.exports = {
    rulesList: async function(req, res) {
        res.json(await rules.collectRules())
    }
}