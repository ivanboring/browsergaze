const db = require('./db');

const capabilities = {
    getCapabilities: async function() {
        let query = db.getDb();
        return new Promise(
            (resolve, reject) => {
                query.serialize(function() {
                    query.all("SELECT c.*, gs.name as server_name FROM capabilities c LEFT JOIN generator_servers gs ON gs.id=c.generator_server_id;", function(err, rows) {
                        resolve(rows)
                    });
                });
            }
        )
    },
    getCapabilitiesForStyling: function(rows) {
        for (let x in rows) {
            switch (rows[x].browser_name) {
                case 'Chromium':
                    rows[x].browser_icon = 'robot';
                    break;
                case 'Chrome':
                    rows[x].browser_icon = 'chrome';
                    break;
                case 'Edge':
                    rows[x].browser_icon = 'edge';
                    break;
                case 'IE':
                    rows[x].browser_icon = 'internet-explorer';
                    break;
                case 'Firefox':
                    rows[x].browser_icon = 'firefox-browser';
                    break;
                case 'Opera':
                    rows[x].browser_icon = 'opera';
                    break;
                case 'Safari':
                    rows[x].browser_icon = 'safari';
                    break;
            }
            switch(rows[x].platform) {
                case 'Windows':
                    if (rows[x].platform_version == '10' || rows[x].platform_version == '11') {
                        rows[x].os_icon = 'windows';
                    } else {
                        rows[x].os_icon = 'microsoft';
                    }
                    break;
                case 'OS X':
                    rows[x].os_icon = 'apple';
                    break;
                case 'Linux':
                    rows[x].os_icon = 'linux';
                    break;
                default:
                    rows[x].os_icon = 'desktop';
                    break;
            }
        }
        return rows;
    }
}

module.exports=capabilities