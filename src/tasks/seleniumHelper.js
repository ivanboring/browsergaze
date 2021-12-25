const {Builder, By, Key, until} = require('selenium-webdriver');

let seleniumHelper = {
    getElement: async function(driver, type, value) {
        switch (type) {
            case 'js-path':
                try {
                    return await driver.findElement(By.js('return ' + value));
                } catch(e) {
                    console.log('error', e);
                    throw `Could not find element that matches js-path: ${value}.`;
                }
            case 'xpath':
                try {
                    return await driver.findElement(By.xpath(value));
                } catch(e) {
                    throw `Could not find element that matches xpath: ${value}. If the path included a shadow dom, only JS path works.`;
                }
            default:
                try {
                    return await driver.findElement(By.css(value));
                } catch(e) {
                    throw `Could not find element that matches CSS selector: ${value}. If the path included a shadow dom, only JS path works.`;
                }
        }
    }
}

module.exports = seleniumHelper;
