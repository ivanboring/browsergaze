const fs = require('fs');
const yaml = require('js-yaml');
const rules = require('../services/rules');

module.exports = {
    rulesList: async function(req, res) {
        res.json(await rules.collectRules())
    }
}