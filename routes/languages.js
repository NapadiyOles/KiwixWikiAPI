const express = require('express');
const cheerio = require("cheerio")
const utils = require('../utils')

const router = express.Router();

const params = {
  url: 'https://library.kiwix.org',
  id: 'languageFilter'
}

const getLanguages = async () => {
  let content = "";
  const languages = {};

  try {
    content = await utils.getPageWithList(params.url, params.id);
  } catch (error) {
    console.error('Error loading page.', error);
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
  }

  return languages;
};

router.get('/', async (req, res) => {
  const data = await getLanguages()
  res.json(data);
});

module.exports = router;
