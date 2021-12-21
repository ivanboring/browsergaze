const puppeteerHelper = require("../../../puppeteerHelper");

let puppeteer = {
    clickElement: async function(parameters, page) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            let element = await puppeteerHelper.getElement(page, parameters.selector, parameters.element);
            await element.click();
        } catch(e) {
            throw `Could not click the selector: ${parameters.selector}.`;
        }
        return parameters.value;
    },
}

module.exports = puppeteer;