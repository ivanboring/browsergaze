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
    },
    getDomainFromUrl: function (url) {
        let parts = url.split('/');
        return parts[0] + '//' + parts[2];
    },
    getConfigDirecory: function(type) {
        return './src/configs/' + type + '/';
    },
    prettyDate: function(timestamp){
        let date = new Date(timestamp);
        let d = date.getDate();
        let monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
        let m = monthNames[date.getMonth()];
        let y = date.getFullYear();
        let h = date.getHours();
        let i = date.getMinutes();
        let s = date.getSeconds();
        return `${d} ${m} ${y} ${h}:${i}:${s}`;
    },
    createSelectOptions: function(rows, id, value, any, default_value) {
        if (typeof any == "undefined") {
            any = false;
        }
        let options = [];
        if (any) {
            options.push({id: '', value: any, default_value: false});
        }
        if (typeof rows == "object" && 0 in rows) {
            for (let i in rows) {
                let setValue = rows[i][value]
                if (typeof value == "object") {
                    setValue = '';
                    for (let t in value) {
                        switch (value[t].type) {
                            case 'value':
                                setValue += rows[i][value[t].value];
                                break;
                            case 'space':
                                setValue += value[t].value;
                                break;
                        }
                    }
                }
                options.push({
                    id: rows[i][id],
                    value: setValue,
                    selected: rows[i][id] == default_value ? true : false,
                });
            }
        }

        return options;
    }
}

module.exports = helper;