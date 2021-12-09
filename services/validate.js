const validator = require('validator')

const validate = {
    redirect: function(path, values, validationErrors, req, res) {
        req.session.validation = {values: values, validationErrors: validationErrors};
        res.redirect(301, path);
    },
    validateEntity: function(values, entityType) {
        const validationErrors = [];
        const rules = require('../entities/' + entityType);
        for (let key in values) {
            // Check if the rule exist.
            let value = values[key];
            if (!(key in rules) && key !== 'id') {
                validationErrors.push({id: key, error: 'This should not be given'});
                continue;
            }

            if (key in rules) {
                for (let ruleName in rules[key]['validate']) {
                    let rule = rules[key]['validate'][ruleName]
                    switch (ruleName) {
                        case 'type':
                            if (typeof value !== rule) {
                                validationErrors.push({id: key, error: `This should be of type ${rule}.`});
                            }
                            break;
                        case 'min':
                            if (value < rule) {
                                validationErrors.push({id: key, error: `This value can not be less than ${rule}. You set ${value}.`});
                            }
                            break;
                        case 'max':
                            if (value > rule) {
                                validationErrors.push({id: key, error: `This value can not be more than ${rule}. You set ${value}.`});
                            }
                            break;
                        case 'minCharLength':
                            if ('required' in rules[key] && rules[key]['required'] && value.length < rule || value.length > 0 && value.length < rule) {
                                validationErrors.push({id: key, error: `You have to at least fill in ${rule} characters.`});
                            }
                            break;
                        case 'maxCharLength':
                            if (value.length > rule) {
                                validationErrors.push({id: key, error: `You can't have more then ${rule} characters.`});
                            }
                            break;
                        case 'required':
                            if (!value) {
                                validationErrors.push({id: key, error: `This fields can't be empty.`});
                            }
                            break;
                        case 'ascii':
                            if (value && !validator.isAscii(value)) {
                                validationErrors.push({id: key, error: `Only ascii characters are allowed here.`});
                            }
                            break;
                        case 'alphanumeric':
                            if (!validator.isAlphanumeric(value)) {
                                validationErrors.push({id: key, error: `Only alphanumeric characters are allowed here.`});
                            }
                            break;
                        case 'fqdnInside':
                            let fqdn = value.replace('https://', '').replace('http://', '').split('/')
                            if (!validator.isFQDN(fqdn[0])) {
                                validationErrors.push({id: key, error: `${fqdn[0]} is not a valid FQDN.`});
                            }
                            break;
                        case 'email':
                            if (!validator.isEmail(value)) {
                                validationErrors.push({id: key, error: `${value} is not a valid e-mail.`});
                            }
                            break;
                        case 'validRegex':
                            if (!rule.test(value)) {
                                validationErrors.push({id: key, error: `Is not a valid value for ${key}.`});
                            }
                            break;
                        case 'startWith':
                            let found = false
                            for (let startString of rule) {
                                if (value.substr(0, (startString.length)) === startString) {
                                    found = true;
                                }
                            }
                            if (!found) {
                                validationErrors.push({id: key, error: `${value} does not start with on of the following: ` + rule.join(', ')});
                            }
                            break;
                    }
                }
            }
        }
        return validationErrors
    }
}

module.exports = validate