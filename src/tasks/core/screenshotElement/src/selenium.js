const seleniumHelper = require("../../../seleniumHelper");
const fs = require('fs');
const sharp = require('sharp');
const { 
    v1: uuidv1,
} = require('uuid');

let selenium = {
    screenshotElement: async function(parameters, driver) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            let caps = await driver.getCapabilities();
            let element = await seleniumHelper.getElement(driver, parameters.selector, parameters.element);
            // We need to scroll into view to take a screenshot in Selnium.
            if (caps.get("browserName") == 'safari') {
                await driver.executeScript("arguments[0].scrollTop = 0;", element);
            } else {
                await driver.executeScript("arguments[0].scrollIntoView(true);", element);
            }
            return new Promise(function(resolve, reject) { 
                setTimeout(async function() {
                    try {
                        let fileString;
                        // Special solution for Safari
                        if (caps.get("browserName") == 'safari') {
                            fileString = await driver.takeScreenshot(true);
                            let tmpFile = '/tmp/' + uuidv1();
                            await fs.writeFileSync(tmpFile, fileString, 'base64');
                            let rect = await driver.executeScript("return arguments[0].getBoundingClientRect()", element);
                            await sharp(tmpFile).extract({ 
                                width: Math.floor(rect.width),
                                height: Math.floor(rect.height),
                                left: Math.floor(rect.left),
                                top: Math.floor(rect.top) }).png().toFile(file);
                        } else {
                            fileString = await element.takeScreenshot(true);
                            await fs.writeFileSync(file, fileString, 'base64');
                        }
                        resolve(parameters.value);
                    } catch(e) {
                        console.log('error', e);
                        reject(`Could not write the file for the screenshot of: ${parameters.selector}.`)
                    }
                }, 500)
            });
        } catch(e) {
            console.log('error', e);
            throw `Could find the element for screenshot of: ${parameters.selector}.`;
        }
        
    },
}

module.exports = selenium;
