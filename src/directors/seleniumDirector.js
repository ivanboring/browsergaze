const fs = require('fs');
const helper = require('../services/helper');
const {Builder, By, Key, until} = require('selenium-webdriver');
const capabilities = require('../services/capabilities');
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox");
const edge = require("selenium-webdriver/edge");
const opera = require("selenium-webdriver/opera");

const seleniumDirector = function() {
    this.drivers = {};
    this.domains = {};
    this.init = async function(domain, jobId, capabilityObject) {
        let builder = await new Builder();
        this.domains[jobId] = domain;
        let options = {};
        console.log(capabilityObject.browser_name);
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
            options = new firefox.Options();
            options.setPlatform(capabilityObject.platform + ' ' + capabilityObject.platform_version);
            builder.withCapabilities(options);
        }
        if (capabilityObject.browser_name == 'Opera') {
            builder.forBrowser('opera');
        }
        
        
        this.drivers[jobId] = await builder.usingServer(capabilityObject.hostname + ':' + capabilityObject.port + '/wd/hub')
        .build();
        return
    }
    this.resizeWindow = async function(width, height, jobId) {
        try {
            await this.drivers[jobId].manage().window().setRect({width: width, height: height, x: 0, y: 0});
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