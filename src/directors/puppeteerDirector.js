const puppeteer = require('puppeteer');
const fs = require('fs');
const helper = require('../services/helper');

const puppeteerDirector = {
    browser: null,
    page: {},
    domain: null,
    username: null,
    password: null,
    init: async function(domain, jobId, capabilityObject) {
        if (!this.browser) {
            this.browser = await puppeteer.launch();
        }
        this.domain = domain;
        this.page[jobId] = await this.browser.newPage();
    },
    resizeWindow: async function(width, height, jobId) {
        const session = await this.page[jobId].target().createCDPSession();
        await this.page[jobId].setViewport({width: width, height: height});
        const {windowId} = await session.send('Browser.getWindowForTarget');
        await session.send('Browser.setWindowBounds', {
            bounds: {height, width},
            windowId,
        });
    },
    goto: async function(path, jobId) {
        if (this.domain.substr(-1) == '/' && (path.substr(0, 1) == '/')) {
            path = path.substr(1);
        }
        await this.page[jobId].goto(this.domain + path);
    },
    reload: async function(jobId) {
        await this.page[jobId].reload();
    },
    screenshot: async function(filePath, jobId) {
        await this.page[jobId].screenshot({ path: filePath });
    },
    // Special function just for puppeteer.
    getFaviconUrl: async function(jobId) {
        const elements = await this.page[jobId].$$eval('link', e => e.map((a) => {return {rel: a.rel, href: a.href, sizes: a.sizes}})); 
        let widest = 0;
        let url = '';
        for (let x in elements) {
            if ('sizes' in elements[x] && '0' in elements[x].sizes) {
                let width = parseInt(elements[x].sizes[0].split('x')[0])  
                if (width > widest) {
                    widest = width;
                    url = elements[x].href
                }
            }
        }
        if (!url) {
            let domain = helper.getDomainFromUrl(this.domain);
            return domain + '/favicon.ico';
        }
        return url;
    },
    runStep: async function(taskName, parameters, jobId) {
        for (let dir of ['custom', 'core']) {
            let requirement = `./src/tasks/${dir}/${taskName}/src/puppeteer`;
            if (fs.existsSync(requirement + '.js')) {
                let base = require(requirement.replace('./src/', '../'));
                // Run the task.
                return base[taskName](parameters, this.page[jobId]);
            }
        }
        throw ' Coult not find the task ' + taskName;
    },
    close: async function(jobId) {
        if (Object.keys(this.page).length > 1) {
            await this.page[jobId].close();
        } else {
            await this.page[jobId].close();
            await this.browser.close();
            this.browser = null;
        }
        delete this.page[jobId];
    }
}

module.exports = puppeteerDirector;