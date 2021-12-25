const puppeteerHelper = require("../../../puppeteerHelper");

let puppeteer = {
    screenshotElement: async function(parameters, page) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            console.log('before', file, parameters.selector, parameters.element);
            let element = await puppeteerHelper.getElement(page, parameters.selector, parameters.element);
            console.log('gotten', file, parameters.selector, parameters.element);
            await element.screenshot({path: file});
            console.log('saved', file, parameters.selector, parameters.element);
        } catch(e) {
            console.log('error', e)
            throw `Could not write the file for the screenshot of: ${selector}.`;
        }
        return parameters.value;
    },
}

module.exports = puppeteer;