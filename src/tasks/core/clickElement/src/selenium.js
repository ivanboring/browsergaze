const seleniumHelper = require("../../../seleniumHelper");

let selenium = {
    clickElement: async function(parameters, driver) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        try {
            let element = await seleniumHelper.getElement(driver, parameters.selector, parameters.element);
            await element.click();
        } catch(e) {
            console.log('error', e);
            throw `Could not hide element: ${parameters.element}.`;
        }
        return parameters.value;
    },
}

module.exports = selenium;
