const fs = require('fs');
const yaml = require('js-yaml');

const rules = {
    collectRules: async function() {
        let rules = {};
        for (let dir of ['custom', 'core']) {
            let requirement = `./src/tasks/${dir}/`;
            fs.readdirSync(requirement).forEach(dir => {
                let file = requirement + dir + '/' + dir + '.yml';
                if (fs.existsSync(file)) {
                    let config = yaml.load(fs.readFileSync(file))
                    rules[config.id] = config;
                }
            });
        }
        return rules;
    }
}

module.exports = rules;