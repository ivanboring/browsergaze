const fs = require('fs');
const yaml = require('js-yaml');

module.exports = {
    rulesList: function(req, res) {
        res.json(yaml.load(fs.readFileSync('./src/directors/rules.yml')))
    }
}