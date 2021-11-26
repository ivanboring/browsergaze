const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml')
const helper = require('./helper');
const db = require('./db');
const defaults = require('./defaults');
const puppeteer = require('puppeteer');

const configPath = '../config.yaml';

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
    },
    checkDataFolder: function() {
        // Check if the config changed the data folder.
        if (!('databaseLocation' in hawkConfig)) {
            hawkConfig.databaseLocation = __dirname + '/' + defaults.databaseLocation;
        }
        // Make sure a slash exists and set some base file and directories.
        hawkConfig.databaseLocation = helper.rtrim(hawkConfig.databaseLocation, '/') + '/';
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
            initialize.setupPuppeteerCapability();
        } else {
            // Otherwise load the database and check for updates.
            db.checkUpdates();
        }
    },
    setupPuppeteerCapability: async function() {
        os.platform();
        os.release();
        let query = db.getDb();
        let browserVersion = await initialize.getPuppeteerChromiumVersion();
        query.serialize(function() {
            query.get("SELECT id FROM generator_servers WHERE server_type=?;", 'puppeteer', function(err, row) {
                query.run("INSERT INTO capabilities (generator_server_id, browser_name, browser_version, platform, platform_version) VALUES (?, ?, ?, ?, ?);", 
                    row.id,
                    'Chromium',
                    browserVersion,
                    initialize.getOs(),
                    initialize.getOsVersion(),
                );
            });
            
        });
    },
    getOs: function() {
        switch(os.platform()) {
            case 'win32':
                return 'Windows';
            case 'darwin':
                return 'OS X';
            case 'linux':
                return 'Linux';
            default:
                return 'Unknown';
        }
    },
    getOsVersion: function() {
        let release = os.release().split('.');
        switch(os.platform()) {
            case 'win32':
                if (release.lengh > 1) {
                    if (release[0] == '11') {
                        return '11';
                    }
                    if (release[0] == '10') {
                        return '10';
                    }
                    if (release[0] == '6' && release[1] == '3') {
                        return '8.1';
                    }
                    if (release[0] == '6' && release[1] == '2') {
                        return '8';
                    }
                    if (release[0] == '6' && release[1] == '3') {
                        return '7';
                    }
                }
                return 'Unknown';
            case 'linux':
                return release[0] + '.' + release[1];
            case 'darwin':
                if (release.lengh > 1) {
                    switch(release[0]) {
                        case '21':
                            return 'Monterrey';
                        case '20':
                            return 'Big Sur';
                        case '19':
                            return 'Catalina';
                        case '18':
                            return 'Mojave';
                        case '17':
                            return 'High Sierra';
                        case '16':
                            return 'Sierra';
                        case '15':
                            return 'El Capitan';
                        case '14':
                            return 'Yosemite';
                        case '13':
                            return 'Mavericks'
                        case '12':
                            return 'Mountain Lion';
                    }
                    if (release[0] == '21') {
                        return 'Monterrey';
                    }
                    if (release[0] == '20') {
                        return 'Big Sur';
                    }
                    if (release[0] == '6' && release[1] == '3') {
                        return '8.1';
                    }
                    if (release[0] == '6' && release[1] == '2') {
                        return '8';
                    }
                    if (release[0] == '6' && release[1] == '3') {
                        return '7';
                    }
                }
                return 'Unknown';
        }
    },
    getPuppeteerChromiumVersion: async function() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const version = await page.browser().version();
        browser.close();
        const realVersion = version.replace('HeadlessChrome/', '').split('.')
        return realVersion[0] + '.' + realVersion[1];
    }
}

module.exports = initialize;
