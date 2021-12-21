let puppeteer = {
    clickButtonTitledExists: async function(parameter, page) {
        if (parameter.title == '') {
            throw 'No button title given';
        }
        try {
            const [button] = await page.$x("//button[contains(., '" + parameter.title + "')]");
            if (typeof button !== 'undefined') {
                await button.click();
            }
        } catch (e) {
            throw e
        }
    },
}

module.exports = puppeteer;