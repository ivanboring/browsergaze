const { 
    v1: uuidv1,
} = require('uuid');
const helper = require('./helper');
const fs = require('fs');
const yaml = require('js-yaml');

const form = {
    tokens: {},
    populateFormDefaults(entityName, req, valueObject) {
        if (typeof valueObject == 'undefined') {
            valueObject = {};
        }
        const confdir = helper.getConfigDirecory('entities');
        const passedVariable = 'session' in req && 'validation' in req.session ? req.session.validation : {};
        const formValues = passedVariable !== null && 'values' in passedVariable ? passedVariable.values : {};
        const formValidation = passedVariable !== null &&'validationErrors' in passedVariable ? passedVariable.validationErrors : [];
        const entityRules = yaml.load(fs.readFileSync(confdir + entityName + '.yml')).fields;
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
            if (formField in formValues) {
                formObject[formField]['value'] = formValues[formField];
            } else if (formField in valueObject) {
                formObject[formField]['value'] = valueObject[formField];
            } else if ('default' in entityRules[formField]) {
                formObject[formField]['value'] = entityRules[formField]['default'];
            } else {
                formObject[formField]['value'] = '';
            }
        }

        // Add csrfToken;
        const csrfToken = uuidv1();
        this.tokens[csrfToken] = Date.now();
        formObject['csrf'] = csrfToken;
        return formObject;
    }
}

module.exports = form