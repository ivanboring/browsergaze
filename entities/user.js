module.exports = {
    password: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 8,
            required: true,
            ascii: true,
            validRegex: /^[0-9A-Za-z!@#$%&*()_\-+={[}\]|\:;"'<,>.?\/\\~`]+[0-9A-Za-z!@#$%&*()_\-+={[}\]|\:;"'<,>.?\/\\~`]*$/g,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }        
    },
    first_name: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 1,
            required: true,
            ascii: true,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }        
    },
    last_name: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 1,
            required: true,
            ascii: true,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }        
    },
    email: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 8,
            required: true,
            email: true,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }        
    },
    role: {
        validate: {
            type: 'number',
            min: 0,
            max: 3,
            required: true,
        }
    }
}