module.exports = {
    name: {
        validate: {
            type: 'string',
            maxCharLength: 255,
            minCharLength: 2,
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
            minCharLength: 3,
            required: true,
        },
        sanitize: {
            escape: '',
            blacklist: '',
            trim: ' '
        }        
    },
    default_visual_regression_threshold: {
        validate: {
            type: 'string',
            min: 0,
            max: 100,
            required: true,
        },
        default: 0.05,
    },
    default_browser_regression_threshold: {
        validate: {
            type: 'string',
            min: 0,
            max: 100,
            required: true,
        },
        default: 0.5,
    },
    device_breakpoint: {
        validate: {
            type: 'object',
            require: true,
        }
    },
    selector: {
        validate: {
            type: 'object',
            required: true,
        },
        default: {
            screenshotElement: {
                selector: '',
                element: '',
            },
        }
    },
    tested: {
        validate: {
            type: 'string',
        },
        default: "0"
    },
}