const express = require('express');
const pool = require('../../mysql/pool');
const custom = require('../../utils/log');
const router = express.Router();
const jwt = require('jsonwebtoken');
const publicPath = __dirname + '/../../public';

// 上传书籍
router.post('/addBook', (req, res) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' });
    }
    const param = req.body;
    new Promise((resolve, reject) => {
      pool.query(
        'insert into book set bookUrl=?,bookFrontPicUrl=?,bookBackPicUrl=?,bookSidePicUrl=?',
        [
          param.bookUrl,
          param.bookFrontPicUrl,
          param.bookBackPicUrl,
          param.bookSidePicUrl,
        ],
        (err, data) => {
          if (err) {
            custom.log(err);
            return reject('服务器错误');
          }
          resolve('上传成功');
        },
      );
    }).then(
      (data) => {
        res.json({ code: 200, msg: data });
      },
      (err) => {
        res.json({ code: 500, msg: err });
      },
    );
  });
});

router.get('/getBooks', (req, res) => {
  const { limit = 4 } = req.query;
  pool.query('select * from book', (err, data) => {
    if (err) {
      custom.log(err);
      return res.json({ code: 500, msg: '服务器出错' });
    }
    const result = data.length < limit ? data : [];

    if (data.length > limit) {
      const hadAddIndex = [];
      while (result.length < limit) {
        const index = Math.floor(data.length * Math.random());
        if (hadAddIndex.includes(index)) continue;
        hadAddIndex.push(index);
        result.push(data[index]);
      }
    }
    res.json({ code: 200, data: result });
  });
});

router.delete('/deleteBook', (req, res) => {
  const { bookUrl } = req.body;
  if (!bookUrl) return res.json({ code: 400, msg: '请传入参数!' });
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' });
    }
    pool.query('delete from book where bookUrl = ?', [bookUrl], (err) => {
      if (err) {
        custom.log(err);
        return res.json({ code: 500, msg: '服务器出错' });
      }
      res.json({ code: 200, msg: '删除成功！' });
    });
  });
});
module.exports = router;
