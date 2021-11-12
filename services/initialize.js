const fs = require('fs');
const os = require('os');
const cleanup = require('./cleanup');
const db = require('./db');

const configPath = '../resources/config.js';
const defaultDataPath = '../resources/data';

const initialize = {
    init: function() {
        // Look for the config.
        if (fs.existsSync(__dirname + '/' + configPath)) {
            global.hawkConfig = require(configPath);
        } else {
            throw Error('No config set');
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
                throw Error('Could not find ImageMagick');
            }
        }
    },
    checkDataFolder: function() {
        // Check if the config changed the data folder.
        if (!('dataFolder' in hawkConfig)) {
            hawkConfig.dataFolder = __dirname + '/' + defaultDataPath;
        }
        // Make sure a slash exists and set some base file and directories.
        hawkConfig.dataFolder = cleanup.rtrim(hawkConfig.dataFolder, '/') + '/';
        hawkConfig.databaseFile = hawkConfig.dataFolder + 'database/hawk.db';

        // Check if folder exists and is writable.
        try {
            fs.accessSync(hawkConfig.dataFolder, fs.constants.W_OK | fs.constants.F_OK)
        }
        catch (err) {
            throw Error('The directory ' + hawkConfig.dataFolder  + ' does not exist or is not writable.')
        }

        // Create directories if they do not exist.
        for (let folder of ['database', 'images']) {
            if (!fs.existsSync(hawkConfig.dataFolder + folder)) {
                fs.mkdirSync(hawkConfig.dataFolder + folder);
            }
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
