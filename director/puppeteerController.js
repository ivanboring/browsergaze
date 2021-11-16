const puppeteer = require('puppeteer');

const puppeteerController = {
    browser: null,
    page: null,
    domain: null,
    username: null,
    password: null,
    init: async function(domain, username, password) {
        if (!this.browser) {
            this.browser = await puppeteer.launch();
            this.page = await this.browser.newPage();
        }
        this.domain = domain;
        this.username = username;
        this.password = password;
    },
    resizeWindow: async function(width, height) {
        const session = await this.page.target().createCDPSession();
        await this.page.setViewport({height, width});
        const {windowId} = await session.send('Browser.getWindowForTarget');
        await session.send('Browser.setWindowBounds', {
            bounds: {height, width},
            windowId,
        });
    },
    goto: async function(path) {
        await this.page.goto(this.domain + path);
    },
    screenshot: async function(filePath) {
        await this.page.screenshot({ path: filePath });
    },
    // Special function just for puppeteer.
    getFaviconUrl: async function() {
        const elements = await this.page.$$eval('link', e => e.map((a) => {return {rel: a.rel, href: a.href, sizes: a.sizes}})); 
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
        return url;
    },
    quickScreenshot: async function(fullPath, filePath, width, height, username, password) {
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();
        await this.page.goto(fullPath)
        if (typeof width !== 'undefined' && typeof height !== 'undefined') {
            await this.resizeWindow(width, height)
        }
        if (typeof width !== 'username' && typeof height !== 'password') {
            //await this.resizeWindow(width, height)
        }
        await this.screenshot(filePath)
        await this.browser.close()
    },
    close: async function() {
        await this.browser.close()
    }
}

module.exports = puppeteerController;