var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.json('Welcome to Express');
});

module.exports = router;
