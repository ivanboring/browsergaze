const puppeteerHelper = require("../../../puppeteerHelper");

let puppeteer = {
    hideElement: async function(parameters, page) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        try {
            let element = await puppeteerHelper.getElement(page, parameters.selector, parameters.element);
            try {
                await element.evaluate((el) => el.style.display = 'none');
            } catch(e) {
                throw `Could not hide the selector: ${parameters.element}.`;
            }
        } catch (e) {
            
        }
        return parameters.value;
    },
}

module.exports = puppeteer;