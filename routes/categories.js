const express = require('express');
const cheerio = require("cheerio")
const puppeteer = require("puppeteer");

const router = express.Router();

const props = {
  url: 'https://library.kiwix.org',
  list: 'categoryFilter',
  number_of_books: 'kiwixHomeBody__results',
}

const waitForBookResults = () => {
  const result = document.querySelector('h3.kiwixHomeBody__results');
  const no_result = document.querySelector('div.noResults');

  return no_result || result && result.innerText.trim().length > 5;
}

const getNumberOfBooks = async (/*Browser*/browser, language = '', category = '') => {
  const page = await browser.newPage();
  let closing;
  const link = `${props.url}/#lang=${language}&category=${category}`;
  console.log(link);

  let content = ''
  try {
    await page.goto(link, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(waitForBookResults);
    content = await page.content();
  } catch (error) {
    console.log('Error loading page for number of books.', error)
    throw error;
  } finally {
    closing = page.close();
  }

  const $ = cheerio.load(content);
  const number = $('.kiwixHomeBody__results').text().trim().slice(0, -8);

  await closing;
  return Number(number);
}

const getCategories = async (/*Browser*/browser, language = '') => {
  const categories = {};
  await browser.newPage();
  const page = await browser.newPage();
  let /*Promise*/closing;

  let content = '';
  try {
    await page.goto(props.url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction((id) => {
      const select = document.getElementById(id);
      return select && select.options && select.options.length > 1;
    }, {}, props.list);

    content = await page.content()
  } catch (error) {
    console.error('Error loading page.', error);
    throw error;
  } finally {
    closing = page.close();
  }

  try {
    const $ = cheerio.load(content);
    await Promise.all($('#categoryFilter option').map(
        async (index = 0, category = '') => {
          const id = $(category).attr('value');
          const name = $(category).text().trim();
          categories[id] = {
            name: name,
            number_of_books: await getNumberOfBooks(browser, language, id),
          }
        })
    );
  } catch (error) {
    console.error('Error fetching available categories.', error);
    throw error;
  } finally {
    await closing;
  }

  return Object.fromEntries(Object.entries(categories).sort());
}

router.get('/', async (req, res) => {
  const language = req.query.lang;
  const browser = await puppeteer.launch({headless: 'new'});

  let data = {};
  try {
    data = await getCategories(browser, language);
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error occurred while processing data'
    });
  } finally {
    await browser.close();
  }

  res.json(data);
});

module.exports = router;
