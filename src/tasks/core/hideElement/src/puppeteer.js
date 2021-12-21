const puppeteerHelper = require("../../../puppeteerHelper");

let puppeteer = {
    hideElement: async function(parameters, page) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            let element = await puppeteerHelper.getElement(page, parameters.selector, parameters.element);
            await element.evaluate((el) => el.style.display = 'none');
        } catch(e) {
            throw `Could not hide the selector: ${parameters.selector}.`;
        }
        return parameters.value;
    },
}

module.exports = puppeteer;