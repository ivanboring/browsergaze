const cleanup = {
    rtrim: function(value, modifier = '/') {
        return value.substr(-1) === modifier ? value.substr(0, value.length - 1) : value;
    }
}

module.exports = cleanup;