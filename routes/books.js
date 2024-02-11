const express = require('express');
const cheerio = require("cheerio")
const puppeteer = require("puppeteer");

const router = express.Router();

const props = {
    url: 'https://library.kiwix.org',
    reason: 'no_data',
}

const waitForNumberOfBooks = async () => {
    const results = document.querySelector('h3.kiwixHomeBody__results');
    const no_results = document.querySelector('div.noResults');
    return no_results || results && results.innerText.trim().length > 5;
}

const loadUpBooks = async () => {
    await new Promise((resolve, reject) => {
        const no_data = document.querySelector('div.noResults');
        if(no_data) {
            reject(props.reason);
            return;
        }

        const distance = document.body.scrollHeight;
        const loader = document.querySelector('.loader');
        const total = parseInt(document.querySelector('.kiwixHomeBody__results')
            .textContent.trim().slice(0, -8));

        // throw new RangeError('test');

        const timer = setInterval(() => {
            window.scrollBy(0, distance);

            const display = window.getComputedStyle(loader).getPropertyValue('display');
            if (display === 'block') return;

            const current = document.querySelectorAll('.book').length;
            if (current < total) return;

            clearInterval(timer);
            resolve();
        }, 100);
    });
}

const getBooks = async (/*Browser*/browser, language = '', category = '') => {
    const /*Page*/page = await browser.newPage();
    await page.setDefaultTimeout(600_000);
    let /*Promise*/closing;

    // const link = `${props.url}/#lang=${language}&category=${category}`;
    const link = 'https://library.kiwix.org/#lang=&category=ted'
    console.log(link);

    let content = '';
    try {
        await page.goto(link, {waitUntil: 'domcontentloaded'});
        await page.waitForFunction(waitForNumberOfBooks);
        await page.evaluate(loadUpBooks).then(
            async _ => {
                content = await page.content();
            },
            error => {
                if(error === props.reason) content = error;
                else throw error;
            }
        );
    } catch (error) {
        console.log('Error loading up books.', error)
        throw error;
    } finally {
        closing = page.close();
    }

    let books;
    try {
        if(content === props.reason) return content;
        const $ = cheerio.load(content);
        $('.book').each((_, element = '') => {
            const id = $(element).attr('data-id').trim().split(':').pop();
        });
    } catch (error) {
        console.log('Error loading page for number of books.', error)
        throw error;
    } finally {
        await closing;
    }

    return books;
}

router.get('/', async (req, res) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        protocolTimeout: 600_000,
    });

    let data = {};
    try {
        data = await getBooks(browser);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error occurred while processing data'
        });
    } finally {
        await browser.close();
    }

    res.json({
        message: 'Success',
        number_of_records: data,
    });
});

module.exports = router;