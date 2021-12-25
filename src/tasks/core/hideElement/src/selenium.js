const seleniumHelper = require("../../../seleniumHelper");

let selenium = {
    hideElement: async function(parameters, driver) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        try {
            let element = await seleniumHelper.getElement(driver, parameters.selector, parameters.element);
            try {
                await driver.executeScript("arguments[0].style.visibility='hidden'", element);
            } catch(e) {
                console.log('error', e);
                throw `Could not hide element: ${parameters.element}.`;
            }
        }
        catch(e) {

        }
        
        return parameters.value;
    },
}

module.exports = selenium;
