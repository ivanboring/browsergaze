module.exports = {
    name: {
        validate: {
            type: 'string',
            maxCharLength: 255,
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
    path: {
        validate: {
            type: 'string',
            maxCharLength: 255,
            minCharLength: 1,
            required: true,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }        
    },
}