const express = require('express');
const pool = require('../../mysql/pool');
const custom = require('../../utils/log');
const router = express.Router();

//网站浏览次数监控
router.get('/viewTimes', (req, res) => {
  pool.query('select * from siteInfo', (err, data) => {
    if (err) {
      custom.log(err);
      return res.json({ code: 200, VT: 0 });
    }
    const VT = data[0].VT;
    res.json({ code: 200, VT });
    pool.query('update siteInfo set VT = ?', [VT + 1], (err) => {
      custom.log(err);
    });
  });
});
module.exports = router;
