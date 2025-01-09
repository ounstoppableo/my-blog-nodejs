const express = require('express');
const pool = require('../../mysql/pool');
const custom = require('../../utils/log');
const jwt = require('jsonwebtoken');
const redisClient = require('../../redis/connect');
const getClientIp = require('../../utils/getIp');
const validateInput = require('../../utils/validateInput');
const router = express.Router();
const moment = require('moment');
const badWords = require('naughty-words').zh;
const dayFormat = 'YYYY-MM-DD hh:mm:ss';

const badWordsFilter = (msg) => {
  for (let i = 0; i < badWords.length; i++) {
    if (msg.includes(badWords[i])) {
      return true;
    }
  }
  return false;
};

redisClient.then((redisClient) => {
  router.post('/sendMsgInTreeHole', async (req, res) => {
    const ip = getClientIp(req);
    let flag = await redisClient.get('treeHole:' + ip);
    if (JSON.parse(flag)) {
      return res.json({ code: 402, msg: '请不要频繁发送！' });
    } else {
      await redisClient.set('treeHole:' + ip, 'true', {
        EX: 3,
      });
    }
    let { msg } = req.body;
    if (badWordsFilter(msg))
      return res.json({ code: 402, msg: '请文明发言o~~' });
    jwt.verify(req.headers.token, '123456', async (err) => {
      if (err) {
        msg = validateInput(msg);
        let avatar = `/avatar/${Math.floor(Math.random() * 9) + 1}.jpg`;
        const time = moment(new Date()).format(dayFormat);
        new Promise((finalResolve, finalReject) => {
          const data = {
            msg,
            avatar,
            time,
          };
          pool.query('insert into treehole set ?', data, (err, insertRes) => {
            if (err) return finalReject(err);
            finalResolve({
              ...data,
              msgId: insertRes.insertId,
            });
          });
        }).then(
          (info) => {
            res.json({ code: 200, msg: '添加成功', data: info });
          },
          (err) => {
            custom.log(err);
            res.json({ code: 500, msg: '服务器出错' });
          },
        );
      } else {
        let avatar = '/adminAvatar/avatar.jpeg';
        const time = moment(new Date()).format(dayFormat);
        const isAdmin = 1;
        new Promise((finalResolve, finalReject) => {
          const data = {
            msg,
            avatar,
            time,
            isAdmin,
          };
          pool.query('insert into treehole set ?', data, (err, insertRes) => {
            if (err) return finalReject(err);
            finalResolve({
              ...data,
              msgId: insertRes.insertId,
            });
          });
        }).then(
          (info) => {
            res.json({ code: 200, msg: '添加成功', data: info });
          },
          (err) => {
            custom.log(err);
            res.json({ code: 500, msg: '服务器出错' });
          },
        );
      }
    });
  });
  router.get('/getMsgFromTreeHole', (req, res) => {
    pool.query('select * from treehole', (err, data) => {
      if (err) return res.json({ code: 500, msg: '服务器出错' });
      return res.json({ code: 200, data });
    });
  });
});

module.exports = router;
