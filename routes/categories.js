const express = require('express');
const cheerio = require("cheerio")
const puppeteer = require("puppeteer");

const router = express.Router();

const props = {
  url: 'https://library.kiwix.org',
  list: 'categoryFilter',
  number_of_books: 'kiwixHomeBody__results',
  path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
}

const getCategories = async (language = '') => {
  let content = '';
  const categories = {};
  const browser = await puppeteer.launch({ headless: 'new', executablePath: props.path });

  let page;
  try {
    page = await browser.newPage();
    await page.goto(props.url, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction((id) => {
      const select = document.getElementById(id);
      return select && select.options && select.options.length > 1;
    }, {}, props.list);

    content = await page.content()
  } catch (error) {
    console.error('Error loading page.', error);
  } finally {
    await page.close();
  }

  const getNumberOfBooks = async (tab, category = '') => {
    let html = ''

    const link = `${props.url}/#lang=${language}&category=${category}`;
    console.log(link);

    try {
      await tab.goto(link, {waitUntil: 'domcontentloaded'});

      // await tab.waitForSelector('h3.kiwixHomeBody__results');
      await tab.waitForFunction(() => {
        const h3 = document.querySelector('h3.kiwixHomeBody__results');
        return h3 && h3.innerText.trim().length > 5;
      })
      html = await tab.content();
    } catch (error) {
      console.log('Error loading page for number of books.', error)
    }

    const $ = cheerio.load(html)
    const number = $('.kiwixHomeBody__results').text().trim().slice(0, -8);
    return Number(number);
  }

  try {
    const $ = cheerio.load(content);
    await Promise.all($('#categoryFilter option')
        .map(async (index = 0, category = '') => {
          const id = $(category).attr('value');
          const name = $(category).text().trim();

          if (id) {
            const tab = await browser.newPage();
            categories[id] = {
              name: name,
              number_of_books: await getNumberOfBooks(tab, id),
            }
            await tab.close();
          }
        }));
  } catch (error) {
    console.error('Error fetching available categories.', error);
  }

  await browser.close();
  return Object.fromEntries(Object.entries(categories).sort());
}

router.get('/', async (req, res) => {
  const language = req.query.lang;
  const data = await getCategories(language);
  res.json(data);
});

module.exports = router;
