const download = require('download');
const fs = require('fs');

const helper = {
    rtrim: function(value, modifier = '/') {
        return value.substr(-1) === modifier ? value.substr(0, value.length - 1) : value;
    },
    download: async function(fileUrl, destPath) {
        return new Promise(function(resolve, reject) {
            download(fileUrl).pipe(fs.createWriteStream(destPath));
            resolve(true)
        });
    }
}

module.exports = helper;