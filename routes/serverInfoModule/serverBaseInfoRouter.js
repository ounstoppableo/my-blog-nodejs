const express = require('express');
const pool = require('../../mysql/pool');
const custom = require('../../utils/log');
const router = express.Router();

//网站浏览次数监控
router.get('/getServerBaseInfo', (req, res) => {
  pool.query('select * from siteInfo', (err, data) => {
    if (err) {
      custom.log(err);
      return res.json({ code: 500, msg: '服务器出错!' });
    }
    res.json({ code: 200, result: data[0] });
  });
});
module.exports = router;
