const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require("cheerio")

const router = express.Router();
const url = 'https://library.kiwix.org';

const getLanguages = async () => {
  try {
    // Step 1: Get Supported Languages
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const select = document.getElementById('languageFilter');
      return select && select.options && select.options.length > 1;
    });

    const content = await page.content();

    let closing = browser.close();

    // Step 2: Extract Language Codes
    const $ = cheerio.load(content);
    const languageCodes = {};
    $('#languageFilter option').each((index, element) => {
      const code = $(element).attr('value');
      const lang = $(element).text().trim();
      if (code) {
        languageCodes[code] = lang;
      }
    });

    await closing;
    return languageCodes;
  } catch (error) {
    console.error('Error fetching supported languages:', error);
    throw error;
  }
};


/* GET home page. */
router.get('/', async (req, res) => {
  const data = await getLanguages()
  res.json(data);
});

module.exports = router;
