const capabilitiesDb = require('../models/capabilitiesDb');

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
        return await capabilitiesDb.getCapabilitiesForProject(projectId);
    },
    getCapabilitiesForServer: async function(serverId) {
        return await capabilitiesDb.getCapabilitiesForServer(serverId);
    },
    getDataFromSelPlatform: function(platform, version) {
        switch (platform) {
            case 'WIN11':
                return {platform: 'Windows', version: '11'};
            case 'WIN10':
                return {platform: 'Windows', version: '10'};
            case 'MAC':
                return {platform: 'Mac OS', version: version};
        }
    },
    getHumanReadableFromSelPlatform: function(platform) {
        switch (platform) {
            case 'WIN11':
                return 'Windows 11';
            case 'WIN10':
                return 'Windows 10';
            case 'MAC':
                return 'Mac Os';
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
            case 'safari':
                return 'Safari';
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
            case 'Safari':
                return 'safari';
        }
    },
    getCapabilitiesForStyling: function(rows, prefix) {
        if (typeof prefix == 'undefined') {
            prefix = '';
        }
        for (let x in rows) {
            switch (rows[x][prefix + 'browser_name']) {
                case 'Chromium':
                    rows[x][prefix + 'browser_icon'] = 'google';
                    break;
                case 'Chrome':
                    rows[x][prefix + 'browser_icon'] = 'chrome';
                    break;
                case 'Microsoft Edge':
                case 'Edge':
                    rows[x][prefix + 'browser_icon'] = 'edge';
                    break;
                case 'IE':
                    rows[x][prefix + 'browser_icon'] = 'internet-explorer';
                    break;
                case 'Firefox':
                    rows[x][prefix + 'browser_icon'] = 'firefox-browser';
                    break;
                case 'Opera':
                    rows[x][prefix + 'browser_icon'] = 'opera';
                    break;
                case 'Safari':
                    rows[x][prefix + 'browser_icon'] = 'safari';
                    break;
            }
            switch(rows[x][prefix + 'platform']) {
                case 'Windows':
                    if (rows[x][prefix + 'platform_version'] == '10' || rows[x][prefix + 'platform_version'] == '11') {
                        rows[x][prefix + 'os_icon'] = 'windows';
                    } else {
                        rows[x][prefix + 'os_icon'] = 'microsoft';
                    }
                    break;
                case 'Mac OS':
                    rows[x][prefix + 'os_icon'] = 'apple';
                    break;
                case 'Linux':
                    rows[x][prefix + 'os_icon'] = 'linux';
                    break;
                default:
                    rows[x][prefix + 'os_icon'] = 'desktop';
                    break;
            }
        }
        return rows;
    },
    deleteBreakpointForProjectId: async function (projectId) {
        return await capabilitiesDb.deleteBreakpointForProjectId(projectId);
    },
    deleteCapabilitiesForProjectId: async function (capabilityId) {
        return await capabilitiesDb.deleteCapabilitiesForProjectId(capabilityId);
    },
}

module.exports=capabilities