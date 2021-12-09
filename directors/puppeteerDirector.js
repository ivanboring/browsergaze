const puppeteer = require('puppeteer');
const helper = require('../services/helper');

const puppeteerDirector = {
    browser: null,
    page: {},
    domain: null,
    username: null,
    password: null,
    init: async function(domain, jobId) {
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
    getElement: async function(jobId, type, value) {
        switch (type) {
            case 'js-path':
                try {
                    return await this.page[jobId].evaluateHandle(value);
                } catch(e) {
                    throw `Could not find element that matches js-path: ${value}.`;
                }
            case 'xpath':
                try {
                    return (await this.page[jobId].$x(value))[0];
                } catch(e) {
                    throw `Could not find element that matches xpath: ${value}. If the path included a shadow dom, only JS path works.`;
                }
            default:
                try {
                    return (await this.page[jobId].$$(value))[0];
                } catch(e) {
                    throw `Could not find element that matches CSS selector: ${value}. If the path included a shadow dom, only JS path works.`;
                }
                break;
        }
    },
    // Screenshot element.
    screenshotElement: async function(parameters, jobId) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let file = parameters.value;
        try {
            let element = await this.getElement(jobId, parameters.selector, parameters.element);
            await element.screenshot({path: file});
        } catch(e) {
            throw `Could not write the file for the screenshot of: ${selector}.`;
        }
        return parameters.value;
    },
    // Wait ms.
    waitTime: async function(parameters, jobId) {
        return new Promise(function(resolve) { 
            setTimeout(function() {
                resolve(`Waited ${parameters.time} ms.`)
            }, parameters.time)
        });
    },
    // Click button titled.
    clickButtonTitled: async function(parameter, jobId) {
        if (parameter.title == '') {
            throw 'No button title given';
        }
        try {
            const [button] = await this.page[jobId].$x("//button[contains(., '" + parameter.title + "')]");
            if (typeof button === 'undefined') {
                throw `Button with title ${parameter.title} not found`;
            }
            if (button) {
                await button.click();
            }
        } catch (e) {
            throw e
        }
    },
    clickButtonTitledExists: async function(parameter, jobId) {
        if (parameter.title == '') {
            throw 'No button title given';
        }
        try {
            const [button] = await this.page[jobId].$x("//button[contains(., '" + parameter.title + "')]");
            if (typeof button !== 'undefined') {
                await button.click();
            }
        } catch (e) {
            throw e
        }
    },
    //hover
    hover: async function(parameters, jobId) {
        if (parameters.element == '') {
            throw 'No element/xpath given';
        }
        let element = await this.getElement(jobId, parameters.selector, parameters.element);
        try {
            const rect = await this.page[jobId].evaluate((element) => {
                const {top, left, bottom, right} = element.getBoundingClientRect();
                return {top, left, bottom, right};
            }, element);
            await this.page[jobId].evaluate((rect) => {
                window.scrollBy(0, rect.top)
            }, rect);
            await this.waitTime({time: 800})
            await element.hover();
        } catch(e) {
            throw `Could not hover over: ${selector}.`;
        }
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