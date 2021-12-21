const puppeteerHelper = require("../../../puppeteerHelper");

let puppeteer = {
    screenshotElement: async function(parameters, page) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            let element = await puppeteerHelper.getElement(page, parameters.selector, parameters.element);
            await element.screenshot({path: file});
        } catch(e) {
            throw `Could not write the file for the screenshot of: ${selector}.`;
        }
        return parameters.value;
    },
}

module.exports = puppeteer;