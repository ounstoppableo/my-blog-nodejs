const pool = require('../mysql/pool')
const fs = require('fs')
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {


  // fs.readFile('./assets/nodejs入门.md', (err, data) => {
  //   pool.query('INSERT INTO articledetail SET ?', { articleId: 1, articleContent: data }, function (error, results, fields) {
  //     if (error) throw error;
  //     console.log(results)
  //   })
  // })
  pool.query('SELECT * FROM articledetail', (err, data) => {
    const {articleId,articleContent} = data[0]
    res.json({ articleId,articleContent });
  })
});

module.exports = router;
