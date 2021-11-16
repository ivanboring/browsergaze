module.exports = {
    name: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 3,
            required: true,
            ascii: true,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }
    },
    dataname: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 3,
            required: true,
            ascii: true,
            alphanumeric: true,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }        
    },
    fail_directly: {
        validate: {
            type: 'boolean'
        }
    },
    run_sync: {
        validate: {
            type: 'boolean'
        }
    },
    default_host: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 3,
            required: true,
            ascii: true,
            fqdn: true,
            startWith: [
                'https://',
                'http://'
            ],
        },
        sanitize: {
            trim: ' ',
            rtrim: '/',
        }        
    },
    default_username: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 1,
        },
        sanitize: {
            trim: ' '
        }        
    },
    default_password: {
        validate: {
            type: 'string',
            maxCharLength: 50,
            minCharLength: 1,
        },
        sanitize: {
            trim: ' '
        }        
    },
}