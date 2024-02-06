const puppeteer = require("puppeteer");

const path = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const utils = {
    async getPageWithList(url = '', element = '') {
        const browser = await puppeteer.launch({headless: 'new', executablePath: path});
        // const browser = await  puppeteer.connect({browserWSEndpoint: `wss://chrome.browserless.io/`})
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        await page.waitForFunction((id) => {
            const select = document.getElementById(id);
            return select && select.options && select.options.length > 1;
        }, {}, String(element));

        const content = await page.content();
        await browser.close();
        return content;
    },
}

module.exports = utils;