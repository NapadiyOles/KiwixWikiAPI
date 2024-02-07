const express = require('express');
const cheerio = require("cheerio")
const puppeteer = require("puppeteer");

const router = express.Router();

const props = {
    url: 'https://library.kiwix.org',
}

const getBooks = (/*Browser*/browser) => {
    return {};
}

router.get('/', async (req, res) => {
    const browser = await puppeteer.launch({headless: 'new'});

    let data = {};
    try {
        data = getBooks(browser);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error occurred while processing data'
        });
    } finally {
        await browser.close();
    }

});

module.exports = router;