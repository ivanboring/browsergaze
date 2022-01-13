const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml')
require('colors');
const prompt = require('prompt-sync')();
const defaults = require('./controllers/defaults');
const helper = require('./controllers/helper');
const shell = require('shelljs');

const configPath = 'config.yaml';

const install = {
    install: function() {
        if (fs.existsSync(configPath)) {
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

        // Check so image directory exists, otherwise create.
        if (!fs.existsSync(defaults.imageLocation)) {
            fs.mkdirSync(defaults.imageLocation);
        }
        
        // Check so ImageMagick exists.
        let binary = this.checkImageMagickBinary();
        if (!binary) {
            this.downloadBinary();
            if (os.platform() !== 'win32') {
                binary = 'bin/magick';
            } else {
                binary = 'bin/magick.exe';
            }
        }
        
        if (binary && binary !== 'global') {
            defaults.imageMagicBinary = binary;
        }
        
        fs.writeFileSync(configPath, yaml.dump(defaults))
    },
    downloadBinary: async function() {
        console.log('No imagemagick found, downloading a portable version'.brightWhite.bold);
        if (!fs.existsSync('bin')) {
            fs.mkdirSync('bin');
        }
        if (os.platform() !== 'win32') {
            await helper.download('https://download.imagemagick.org/ImageMagick/download/binaries/magick', 'bin/magick');
            shell.exec('chmod +x bin/magick');
        } else {
            await helper.download('https://download.imagemagick.org/ImageMagick/download/binaries/ImageMagick-7.1.0-19-Q16-HDRI-x64-dll.exe', 'bin/magick.exe');
        }
    },
    checkImageMagickBinary: function() {
        // Try to check if exe file exists in path or in config path.
        if (require('hasbin').sync('compare') || require('hasbin').sync('magick')) {
            return 'global';
        }
        // Kill the process for Mac users and let them know to install manually.
        if (os.platform() == 'darwin') {
            console.log('We could not find Imagemagick on your computer and on a Mac computer we can not install it automatically'.brightWhite.bold);
            console.log('Please refer to the following instructions to install it:'.brightWhite.bold);
            console.log('https://imagemagick.org/script/download.php#macosx');
            process.exit();
        }
        // Windows look for exe.
        if (os.platform() == 'win32' && fs.existsSync('bin/magick.exe')) {
            return 'bin/magick.exe';
        }
        if (fs.existsSync('bin/magick')) {
            return 'bin/magick';
        }
        return false;
    }
}

install.install();

module.exports = install;
