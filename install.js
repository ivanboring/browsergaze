const fs = require('fs');
require('colors');
const prompt = require('prompt-sync')();
const yaml = require('js-yaml')
const defaults = require('./services/defaults')

const configPath = 'config.yaml';

if (fs.existsSync(__dirname + '/' + configPath)) {
    console.log('You already have a config.yaml. If you want to restart delete this'.red);
    process.exit()
}

quickInstall = prompt('Quick Install '.gray + '[y]:'.brightWhite.bold + ' ', 'y')

const advanced = quickInstall == 'y' || quickInstall == 'yes' || quickInstall == 'Y' ? false : true

if (advanced) {
    defaults.databaseLocation = prompt('Database Location '.gray + '[' + defaults.databaseLocation + ']'.brightWhite.bold + ' ', defaults.databaseLocation)
    defaults.imageLocation = prompt('Screenshots Location '.gray + '[' + defaults.imageLocation + ']'.brightWhite.bold + ' ', defaults.imageLocation)
    defaults.host = prompt('Host to listen to '.gray + '[' + defaults.host + ']'.brightWhite.bold + ' ', defaults.host)
    defaults.port = prompt('Port to listen to '.gray + '[' + defaults.port + ']'.brightWhite.bold + ' ', defaults.port)
}

fs.writeFileSync(configPath, yaml.dump(defaults))