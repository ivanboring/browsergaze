const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml')
const cleanup = require('./cleanup');
const db = require('./db');
const defaults = require('./defaults')

const configPath = '../config.yaml';
const defaultDataPath = '../resources/data';

const initialize = {
    init: function() {
        // Look for the config.
        if (fs.existsSync(__dirname + '/' + configPath)) {
            global.hawkConfig = yaml.load(fs.readFileSync(__dirname + '/' + configPath));
        } else {
            throw Error('No config set, please run "npm run install" or read documentation.');
        }
        this.checkRequirements();
    },
    checkRequirements: function() {
        this.checkImageMagickBinary();
        this.checkDataFolder();
    },
    checkImageMagickBinary: function() {
        // Try to check if exe file exists in path or in config path.
        if (os.platform() == 'win32') {
            
        } else {
            hawkConfig.usedBinaryCommand = null;
            if ('imageMagicBinary' in hawkConfig) {
                const testBinary = os.platform() == 'win32' ? hawkConfig.imageMagicBinary.replace('.exe') : hawkConfig.imageMagicBinary;
                if (require('hasbin').sync(testBinary)) {
                    hawkConfig.usedBinaryCommand = testBinary + ' convert';
                }
            }
            if (!hawkConfig.usedBinaryCommand && require('hasbin').sync('convert')) {
                hawkConfig.usedBinaryCommand = 'convert';
            }
            if (!hawkConfig.usedBinaryCommand && require('hasbin').sync('magick')) {
                hawkConfig.usedBinaryCommand = 'magick convert';
            }
            if (!hawkConfig.usedBinaryCommand) {
                throw Error('Could not find ImageMagick, please run "npm run install" or read documentation.');
            }
        }
    },
    checkDataFolder: function() {
        // Check if the config changed the data folder.
        if (!('databaseLocation' in hawkConfig)) {
            hawkConfig.databaseLocation = __dirname + '/' + defaults.databaseLocation;
        }
        // Make sure a slash exists and set some base file and directories.
        hawkConfig.databaseLocation = cleanup.rtrim(hawkConfig.databaseLocation, '/') + '/';
        hawkConfig.databaseFile = hawkConfig.databaseLocation + 'hawk.db';

        // Check if folder exists and is writable.
        try {
            fs.accessSync(defaults.imageLocation, fs.constants.W_OK | fs.constants.F_OK)
        }
        catch (err) {
            throw Error('The directory ' + defaults.imageLocation  + ' does not exist or is not writable.')
        }
    
        if (!fs.existsSync(hawkConfig.databaseLocation)) {
            fs.mkdirSync(hawkConfig.databaseLocation);
        }

        // Create database if it doesn't exist.
        if (!fs.existsSync(hawkConfig.databaseFile)) {
            db.setupDbFirstTime()
        } else {
            // Otherwise load the database and check for updates.
            db.checkUpdates();
        }
    }
}

module.exports = initialize;
