const settingsDb = require('../models/settingsDb');

const settings = {
    settings: {},
    getSetting: function(key) {
        if (key in this.settings) {
            return this.settings[key];
        }
        return null;
    },
    loadSettings: async function() {
        let settings = await settingsDb.getAllSettings();
        if (settings) {
            for (let setting of settings) {
                this.settings[setting.key] = setting.value;
            }
        }
    },
    getAllSettings: function() {
        return this.settings;
    },
    setSetting: async function(key, value) {
        this.settings[key] = value;
        return await settingsDb.setSetting(key, value);
    },
}

module.exports = settings;