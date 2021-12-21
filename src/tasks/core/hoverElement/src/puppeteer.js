const puppeteerHelper = require("../../../puppeteerHelper");

let puppeteer = {
    hover: async function(parameters, page) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let element = await puppeteerHelper.getElement(page, parameters.selector, parameters.element);
        try {
            const rect = await page.evaluate((element) => {
                const {top, left, bottom, right} = element.getBoundingClientRect();
                return {top, left, bottom, right};
            }, element);
            await page.evaluate((rect) => {
                window.scrollBy(0, rect.top)
            }, rect);
            await require('../../waitTime/src/puppeteer').waitTime({time: 800})
            await element.hover();
        } catch(e) {
            throw `Could not hover over: ${selector}.`;
        }
    },
}

module.exports = puppeteer;