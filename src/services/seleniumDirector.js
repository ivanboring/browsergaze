const fs = require('fs');
const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox");
const edge = require("selenium-webdriver/edge");
const safari = require("selenium-webdriver/safari");

const seleniumDirector = function() {
    this.drivers = {};
    this.domains = {};
    this.browsers = {};
    this.init = async function(domain, jobId, capabilityObject) {
        let builder = await new Builder();
        this.domains[jobId] = domain;
        let options = {};
        this.browsers[jobId] = capabilityObject.browser_name;
        if (capabilityObject.browser_name == 'Chrome') {
            options = new chrome.Options();
            options.addArguments('--disable-gpu');
            options.addArguments("--force-device-scale-factor=1");
            options.setPlatform(capabilityObject.platform + ' ' + capabilityObject.platform_version);
            builder.withCapabilities(options);
        }
        if (capabilityObject.browser_name == 'Microsoft Edge') {
            options = new edge.Options();
            options.addArguments('--disable-gpu');
            options.addArguments("--force-device-scale-factor=1");
            options.setPlatform(capabilityObject.platform + ' ' + capabilityObject.platform_version);
            builder.withCapabilities(options);
        }
        if (capabilityObject.browser_name == 'Firefox') {
            builder.forBrowser('gecko');
            options = {setPlatform: capabilityObject.platform + ' ' + capabilityObject.platform_version};
            builder.setFirefoxOptions(options);
        }
        if (capabilityObject.browser_name == 'Opera') {
            builder.forBrowser('opera');
        }
        if (capabilityObject.browser_name == 'Safari') {
            builder.forBrowser('safari');
            options = {setPlatform: capabilityObject.platform + ' ' + capabilityObject.platform_version};
            builder.setSafariOptions(options);
        }

        try {
            this.drivers[jobId] = await builder.usingServer(capabilityObject.hostname + ':' + capabilityObject.port + '/wd/hub')
            .build();
        }
        catch (e) {
            console.log(capabilityObject.browser_name);
            console.log(e);
            throw "Couldn't connect to Selenium server";
        }
        return
    }
    this.resizeWindow = async function(width, height, jobId) {
        let newWidth = width;
        let newHeight = height;
        let displayWidth = 0;
        let displayHeight = 0;
        let tries = 0;
        let caps = await this.drivers[jobId].getCapabilities();
        try {
            while (tries < 4) {
                // Recurse until fit.
                if (caps.get("browserName") == 'safari') {
                    await this.drivers[jobId].manage().window().setRect({width: newWidth, height: newHeight, x: 2, y: 2});
                } else {
                    await this.drivers[jobId].manage().window().setRect({width: newWidth, height: newHeight, x: 0, y: 0});
                }
                displayWidth = await this.drivers[jobId].executeScript("return window.innerWidth");
                displayHeight = await this.drivers[jobId].executeScript("return window.innerHeight");
                if (displayWidth != width && displayHeight != height) {
                    newWidth = (newWidth - displayWidth) + width;
                    newHeight = (newHeight - displayHeight) + height;
                } else if (displayWidth != width) {
                    newWidth = (newWidth - displayWidth) + width;
                } else if (displayHeight != height) {
                    newHeight = (newHeight - displayHeight) + height;
                } else {
                    tries = 4;
                }
                tries++;
            }
        } catch (e) {
            console.log('resize error', e);
        }
        return
    }
    this.goto = async function(path, jobId) {
        if (this.domains[jobId].substr(-1) == '/' && (path.substr(0, 1) == '/')) {
            path = path.substr(1);
        }
        try {
            await this.drivers[jobId].get(this.domains[jobId] + path);
        } catch (e) {
            console.log('error goto', e);
        }
        return
    }
    this.runStep = async function(taskName, parameters, jobId) {
        for (let dir of ['custom', 'core']) {
            let requirement = `./src/tasks/${dir}/${taskName}/src/selenium`;
            if (fs.existsSync(requirement + '.js')) {
                let base = require(requirement.replace('./src/', '../'));
                // Run the task.
                return base[taskName](parameters, this.drivers[jobId]);
            }
        }
        throw ' Coult not find the task ' + taskName;
    }
    this.close = async function(jobId) {
        await this.drivers[jobId].quit();
        return
    }
    this.reload = async function(jobId) {
        await this.drivers[jobId].navigate().refresh();
        return new Promise(function(resolve, reject) { 
            setTimeout(async function() {
                resolve(true);
            }, 500)
        });
    }
    
}

module.exports = {
    SeleniumDirector: seleniumDirector
};