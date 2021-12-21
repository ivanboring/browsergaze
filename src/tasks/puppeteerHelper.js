let puppeteerHelper = {
    getElement: async function(page, type, value) {
        switch (type) {
            case 'js-path':
                try {
                    return await page.evaluateHandle(value);
                } catch(e) {
                    throw `Could not find element that matches js-path: ${value}.`;
                }
            case 'xpath':
                try {
                    return (await page.$x(value))[0];
                } catch(e) {
                    throw `Could not find element that matches xpath: ${value}. If the path included a shadow dom, only JS path works.`;
                }
            default:
                try {
                    return (await page.$$(value))[0];
                } catch(e) {
                    throw `Could not find element that matches CSS selector: ${value}. If the path included a shadow dom, only JS path works.`;
                }
        }
    },
}

module.exports = puppeteerHelper;