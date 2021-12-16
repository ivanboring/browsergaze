const fs = require('fs');
const helper = require('../services/helper');
const {Builder, By, Key, until} = require('selenium-webdriver');
const capabilities = require('../services/capabilities');
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox");
const edge = require("selenium-webdriver/edge");

const seleniumDirector = {
    drivers: {},
    domains: {},
    init: async function(domain, jobId, capabilityObject) {
        console.log('starting');
        this.domains[jobId] = domain;
        let options = {};
        if (capabilityObject.browser_name == 'Chrome') {
            options = new chrome.Options();
            options.addArguments('--disable-gpu');
            options.addArguments("--force-device-scale-factor=1");
        }
        if (capabilityObject.browser_name == 'Microsoft Edge') {
            options = new edge.Options();
            options.addArguments('--disable-gpu');
            options.addArguments("--force-device-scale-factor=1");
        }
        if (capabilityObject.browser_name == 'Firefox') {
            options = new firefox.Options();
        }
        options.setPlatform(capabilityObject.platform + ' ' + capabilityObject.platform_version);
        this.drivers[jobId] = await new Builder()
        .withCapabilities(options)
        .usingServer(capabilityObject.hostname + ':' + capabilityObject.port + '/wd/hub')
        .build();
        console.log('finished starting up', jobId);
        return
    },
    resizeWindow: async function(width, height, jobId) {
        console.log('resize', width, height);
        try {
            await this.drivers[jobId].manage().window().setRect({width: width, height: height, x: 0, y: 0});
        } catch (e) {
            console.log('resize error', e);
        }
        console.log('finished resize');
        return
    },
    goto: async function(path, jobId) {
        console.log('goto', path, jobId);
        if (this.domains[jobId].substr(-1) == '/' && (path.substr(0, 1) == '/')) {
            path = path.substr(1);
        }
        try {
            await this.drivers[jobId].get(this.domains[jobId] + path);
        } catch (e) {
            console.log('error goto', e);
        }
        console.log('finished goto', path);
        return
    },
    close: async function(jobId) {
        console.log('close');
        await this.drivers[jobId].quit();
        console.log('finished close');
        return
    },
    reload: async function(jobId) {
        await this.drivers[jobId].navigate().refresh();
    },
    // Screenshot element.
    screenshotElement: async function(parameters, jobId) {
        console.log('screenshot');
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            console.log('get element');
            let element = await this.getElement(jobId, parameters.selector, parameters.element);
            console.log('start screenshot');
            let fileString = await element.takeScreenshot(true);
            console.log('start saving');
            await fs.writeFileSync(file, fileString, 'base64');
        } catch(e) {
            console.log('error', e);
            throw `Could not write the file for the screenshot of: ${parameters.selector}.`;
        }
        console.log('finished screenshot');
        return parameters.value;
    },
    getElement: async function(jobId, type, value) {
        switch (type) {
            case 'js-path':
                try {
                    return await this.drivers[jobId].findElement(By.js(value));
                } catch(e) {
                    throw `Could not find element that matches js-path: ${value}.`;
                }
            case 'xpath':
                try {
                    return await this.drivers[jobId].findElement(By.xpath(value));
                } catch(e) {
                    throw `Could not find element that matches xpath: ${value}. If the path included a shadow dom, only JS path works.`;
                }
            default:
                try {
                    return await this.drivers[jobId].findElement(By.css(value));
                } catch(e) {
                    throw `Could not find element that matches CSS selector: ${value}. If the path included a shadow dom, only JS path works.`;
                }
        }
    }
}

module.exports = seleniumDirector;