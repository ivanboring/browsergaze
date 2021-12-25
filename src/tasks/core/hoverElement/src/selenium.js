const seleniumHelper = require("../../../seleniumHelper");

let selenium = {
    hoverElement: async function(parameters, driver) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        try {
            let element = await seleniumHelper.getElement(driver, parameters.selector, parameters.element);
            driver.actions().mouseMove(element).perform();
        } catch(e) {
            throw `Could not hover over element: ${parameters.selector}.`;
        }
        return parameters.value;
    },
}

module.exports = selenium;
