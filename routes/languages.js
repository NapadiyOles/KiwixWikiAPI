const express = require('express');
const cheerio = require("cheerio")
const puppeteer = require("puppeteer");

const router = express.Router();

const props = {
  url: 'https://library.kiwix.org',
  id: 'languageFilter'
}

const getLanguages = async (/*Browser*/browser) => {
  const languages = {};
  const page = await browser.newPage();
  let /*Promise*/closing;

  let content = "";
  try {
    await page.goto(props.url, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction((id) => {
      const select = document.getElementById(id);
      return select && select.options && select.options.length > 1;
    }, {}, String(props.id));

    content = await page.content();
  } catch (error) {
    console.error('Error loading page.', error);
    throw error;
  } finally {
    closing = page.close();
  }

  try {
    const $ = cheerio.load(content);
    $('#languageFilter option').each((index = 0, element = '') => {
      const code = $(element).attr('value');
      const lang = $(element).text().trim();
      if (code) {
        languages[code] = lang;
      }
    });
  } catch (error) {
    console.error('Error fetching supported languages.', error);
    throw error;
  } finally {
    await closing;
  }

  return languages;
};

router.get('/', async (req, res) => {
  const browser = await puppeteer.launch({headless: 'new'});

  let data;
  try {
    data = await getLanguages(browser);
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error occurred while processing data'
    });
  } finally {
    await browser.close();
  }
  return res.json(data);
});

module.exports = router;
