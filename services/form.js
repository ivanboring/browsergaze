const form = {
    populateFormDefaults(entityName, req) {
        const passedVariable = 'session' in req && 'validation' in req.session ? req.session.validation : {};
        const formValues = passedVariable !== null && 'values' in passedVariable ? passedVariable.values : {};
        const formValidation = passedVariable !== null &&'validationErrors' in passedVariable ? passedVariable.validationErrors : [];
        const entityRules = require('../entities/' + entityName);
        const formObject = {}
        // Reset session variable
        req.session.validation = null;

        // Populate
        for (let x in formValidation) {
            let formField = formValidation[x].id
            if (!(formField in formObject)) {
                formObject[formField] = {}
                formObject[formField]['errors'] = [];
            }
            formObject[formField]['error'] = 'true';
            formObject[formField]['errors'].push(formValidation[x].error);
        }

        for (let formField in entityRules) {
            if (!(formField in formObject)) {
                formObject[formField] = {}
            }
            formObject[formField]['value'] = formField in formValues ? formValues[formField] : '';
        }
        return formObject;
    }
}

module.exports = form