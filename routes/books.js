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

const loadUpBooks = async (reason = '') => {
    await new Promise((resolve, reject) => {
        const no_data = document.querySelector('div.noResults');
        if(no_data) {
            reject(reason);
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

const getBooks = async (/*Browser*/browser, language = '', category = '', search = '', tag = '') => {
    const /*Page*/page = await browser.newPage();
    await page.setDefaultTimeout(600_000);
    let /*Promise*/closing;

    const link = `${props.url}/#lang=${language}&category=${category}&q=${search}&tag=${tag}`;
    console.log(link);

    let content = '';
    try {
        await page.goto(link, {waitUntil: 'domcontentloaded'});
        await page.waitForFunction(waitForNumberOfBooks);
        await page.evaluate(loadUpBooks, props.reason).then(
            async _ => {
                content = await page.content();
            },
            error => {
                throw error;
            }
        );
    } catch (error) {
        console.log('Error loading up books.', error)
        throw error;
    } finally {
        closing = page.close();
    }

    let books = {};
    try {
        const $ = cheerio.load(content);
        $('.book').each((_, element = '') => {
            const id = $(element).attr('data-id').trim().split(':').pop();
            const title = $(element).find('#book__title').text().trim();
            const description = $(element).find('.book__description').text().trim();
            const languages = $(element).find('.book__languageTag').attr('title')
                .split(',').map(lang => lang.trim());
            const link = $(element).find('span[data-link]').attr('data-link');
            const link_values = link.split('/');
            const name = link_values[link_values.length - 1].split('.').at(0);//.join('.');
            const folder = link_values[link_values.length - 2];
            const tags = [];
            $(element).find('.tag__link').each((_, tag_element = '') => {
                const tag = $(tag_element).text().trim();
                tags.push(tag);
            });

            books[id] = {
                title,
                description,
                name,
                folder,
                languages,
                tags
            }
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

    const {language, category, search, tag} = req.query;

    console.log(`language: ${language}`);
    console.log(`category: ${category}`);
    console.log(`search: ${search}`);
    console.log(`tag: ${tag}`);

    let data = {};
    try {
        data = await getBooks(browser, language, category, search, tag);
    } catch (error) {
        if(error === props.reason) {
            res.status(404).json({
                message: props.reason
            });
            return;
        }

        res.status(500).json({
            message: 'Internal server error occurred while processing data'
        });
        return;
    } finally {
        await browser.close();
    }

    res.json(data);
});

module.exports = router;