const express = require('express');
const getClientIp = require('../../utils/getIp');
const redisClient = require('../../redis/connect');
const pool = require('../../mysql/pool');
const sha256 = require('crypto-js/sha256');
const jwt = require('jsonwebtoken');
const custom = require('../../utils/log');
const dayjs = require('dayjs');

const router = express.Router();

redisClient.then((redisClient) => {
  router.get('/getFriendList', (req, res, next) => {
    const { limit, page } = req.query;
    if (limit <= 0 || page <= 0)
      return res.json({ code: 402, msg: '错误的入参！' });
    jwt.verify(req.headers.token, '123456', (err) => {
      new Promise((resolve, reject) => {
        if (err) {
          pool.query('select * from friend where audit=1', (err, data) => {
            if (err) {
              custom.log(err);
              return reject({ code: 500, msg: '服务器出错' });
            }
            data.sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
            resolve(data);
          });
        } else {
          pool.query('select * from friend', (err, data) => {
            if (err) {
              custom.log(err);
              return reject({ code: 500, msg: '服务器出错' });
            }
            data.sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
            resolve(data);
          });
        }
      })
        .then((data) => {
          res.json({
            code: 200,
            data: data.slice((page - 1) * limit, page * limit),
            total: data.length,
          });
        })
        .catch((err) => {
          res.json(err);
        });
    });
  });
  router.post('/addFriend', (req, res, next) => {
    const { name, brief, website, cover } = req.body;
    if (!name || !brief || !website || !cover)
      return res.json({ code: 402, msg: '参数不全！' });
    pool.query(
      'select * from friend where website = ?',
      [website],
      (err, data) => {
        if (err) {
          custom.log(err);
          return res.json({ code: 500, msg: '服务器出错' });
        }
        if (data.length === 0) {
          pool.query(
            'INSERT INTO friend (name, website, brief, cover,date) VALUES (?,?,?,?,?);',
            [
              name,
              website,
              brief,
              cover,
              dayjs(new Date()).format('YYYY-MM-DD'),
            ],
            (err, data) => {
              if (err) {
                custom.log(err);
                return res.json({ code: 500, msg: '服务器出错' });
              }
              return res.json({ code: 200, msg: '申请成功，请等待博主审核~' });
            },
          );
        } else {
          pool.query(
            'update friend set name=? ,brief=?, cover=?,date=? where website=?;',
            [
              name,
              brief,
              cover,
              dayjs(new Date()).format('YYYY-MM-DD'),
              website,
            ],
            (err, data) => {
              if (err) {
                custom.log(err);
                return res.json({ code: 500, msg: '服务器出错' });
              }
              return res.json({ code: 200, msg: '申请成功，请等待博主审核~' });
            },
          );
        }
      },
    );
  });
  router.post('/auditFriend', (req, res, next) => {
    const { website } = req.body;
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      pool.query(
        'update friend set audit = 1 where website=?',
        [website],
        (err, data) => {
          if (err) {
            custom.log(err);
            return reject({ code: 500, msg: '服务器出错' });
          }
          res.json({
            code: 200,
            msg: '审核成功！',
          });
        },
      );
    });
  });
  router.delete('/deleteFriend', (req, res, next) => {
    const { website } = req.body;
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      pool.query(
        'delete from friend where website=?',
        [website],
        (err, data) => {
          if (err) {
            custom.log(err);
            return reject({ code: 500, msg: '服务器出错' });
          }
          res.json({
            code: 200,
            msg: '删除成功！',
          });
        },
      );
    });
  });
});
module.exports = router;
