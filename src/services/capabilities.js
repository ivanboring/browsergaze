const capabilitiesDb = require('../model/capabilitiesDb');

const capabilities = {
    getCapabilities: async function() {
        return await capabilitiesDb.getCapabilities();
    },
    getCapabilitiesAndBreakpointsForComponent: async function (componentId) {
        return await capabilitiesDb.getCapabilitiesAndBreakpointsForComponent(componentId);
    },
    getCapabilityForProjectCapabilityId: async function (capabilityId) {
        return await capabilitiesDb.getCapabilityForProjectCapabilityId(capabilityId);
    },
    getCapabilitiesForProject: async function(projectId) {
        return await capabilitiesDb.getCapabilityForProjectCapabilityId(projectId);
    },
    getDataFromSelPlatform: function(platform) {
        switch (platform) {
            case 'WIN11':
                return {platform: 'Windows', version: '11'};
            case 'WIN10':
                return {platform: 'Windows', version: '10'};
        }
    },
    getHumanReadableFromSelPlatform: function(platform) {
        switch (platform) {
            case 'WIN11':
                return 'Windows 11';
            case 'WIN10':
                return 'Windows 10';
        }
    },
    getHumanReadableFromSelBrowser: function(browserName) {
        switch (browserName) {
            case 'opera':
                return 'Opera';
            case 'firefox':
                return 'Firefox';
            case 'MicrosoftEdge':
                return 'Microsoft Edge';
            case 'chrome':
                return 'Chrome';
        }
    },
    getDataFromHumanBrowserName: function(browserName) {
        switch (browserName) {
            case 'Opera':
                return 'opera';
            case 'Firefox':
                return 'firefox';
            case 'Microsoft Edge':
                return 'MicrosoftEdge';
            case 'Chrome':
                return 'chrome';
        }
    },
    getCapabilitiesForStyling: function(rows) {
        for (let x in rows) {
            switch (rows[x].browser_name) {
                case 'Chromium':
                    rows[x].browser_icon = 'google';
                    break;
                case 'Chrome':
                    rows[x].browser_icon = 'chrome';
                    break;
                case 'Microsoft Edge':
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