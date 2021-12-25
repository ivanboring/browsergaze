const seleniumHelper = require("../../../seleniumHelper");
const fs = require('fs');

let selenium = {
    screenshotElement: async function(parameters, driver) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            let element = await seleniumHelper.getElement(driver, parameters.selector, parameters.element);
            // We need to scroll into view to take a screenshot in Selnium.
            await driver.executeScript("arguments[0].scrollIntoView(true);", element);
            return new Promise(function(resolve, reject) { 
                setTimeout(async function() {
                    try {
                        let fileString = await element.takeScreenshot(true);
                        await fs.writeFile(file, fileString, 'base64', function() {
                            resolve(parameters.value);
                        });
                    } catch(e) {
                        console.log('error', e);
                        throw `Could not write the file for the screenshot of: ${parameters.selector}.`;
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
