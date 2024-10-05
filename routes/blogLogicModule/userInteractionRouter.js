const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../../mysql/pool');
const validateInput = require('../../utils/validateInput');
const moment = require('moment');
const custom = require('../../utils/log');
const redisClient = require('../../redis/connect');
const dayjs = require('dayjs');
const router = express.Router();
const browserPriority = {
  1: 'Safari',
  2: 'Chrome',
  3: 'Opera',
  4: 'Firefox',
  5: 'Edg',
};

redisClient.then((redisClient) => {
  //添加留言-文章
  router.post('/addMsgForArticle', (req, res, next) => {
    jwt.verify(req.headers.token, '123456', async (err) => {
      if (err) {
        let { name, content, fatherMsgId, articleId, mail, website } = req.body;
        name = validateInput(name);
        content = validateInput(content);
        mail = validateInput(mail);
        website = validateInput(website);
        let avatar = `/avatar/${Math.floor(Math.random() * 9) + 1}.jpg`;
        const userInfoRow = await redisClient.get(mail);
        if (userInfoRow) {
          const userInfo = JSON.parse(userInfoRow);
          if (userInfo.name !== name)
            return res.json({ code: 402, msg: '用户名与原邮箱不匹配！' });
          avatar = userInfo.avatar;
        } else {
          redisClient.set(mail, JSON.stringify({ name, avatar }));
        }
        const subTime = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
        const device = req.headers['user-agent']
          .match(/\(.*?\)/)[0]
          .slice(1)
          .split(';')[0];
        const ua = req.headers['user-agent'].split(' ');
        let browser = '';
        ua.forEach((item) => {
          if (browser) {
            let browserPri = 0;
            let itemPri = 0;
            Object.keys(browserPriority).forEach((key) => {
              if (browser.includes(browserPriority[key])) browserPri = +key;
              if (item.includes(browserPriority[key])) itemPri = +key;
            });
            if (browserPri < itemPri) browser = item;
          } else {
            browser = item;
          }
        });
        const upvoke = 0;
        new Promise((finalResolve, finalReject) => {
          pool.query(
            'insert into msgboardforarticle set ?',
            {
              name,
              content,
              fatherMsgId,
              articleId,
              mail,
              website,
              avatar,
              subTime,
              device,
              browser,
              upvoke,
            },
            (err) => {
              if (err) return finalReject(err);
              finalResolve();
            },
          );
        }).then(
          () => {
            res.json({ code: 200, msg: '添加成功' });
          },
          (err) => {
            custom.log(err);
            res.json({ code: 500, msg: '服务器出错' });
          },
        );
      } else {
        let { name, content, fatherMsgId, articleId, mail, website } = req.body;
        mail = '1263032107@qq.com';
        name = 'unstoppable840';
        website = '/';
        let avatar = '/adminAvatar/avatar.jpeg';
        const subTime = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
        const device = req.headers['user-agent']
          .match(/\(.*?\)/)[0]
          .slice(1)
          .split(';')[0];
        const ua = req.headers['user-agent'].split(' ');
        let browser = '';
        ua.forEach((item) => {
          if (browser) {
            let browserPri = 0;
            let itemPri = 0;
            Object.keys(browserPriority).forEach((key) => {
              if (browser.includes(browserPriority[key])) browserPri = +key;
              if (item.includes(browserPriority[key])) itemPri = +key;
            });
            if (browserPri < itemPri) browser = item;
          } else {
            browser = item;
          }
        });
        const upvoke = 0;
        const isAdmin = 1;
        new Promise((finalResolve, finalReject) => {
          pool.query(
            'insert into msgboardforarticle set ?',
            {
              name,
              content,
              fatherMsgId,
              articleId,
              mail,
              website,
              avatar,
              subTime,
              device,
              browser,
              upvoke,
              isAdmin,
            },
            (err) => {
              if (err) return finalReject(err);
              finalResolve();
            },
          );
        }).then(
          () => {
            res.json({ code: 200, msg: '添加成功' });
          },
          (err) => {
            custom.log(err);
            res.json({ code: 500, msg: '服务器出错' });
          },
        );
      }
    });
  });
  //获取留言-文章
  router.get('/getMsgForArticle/:articleId/:page/:limit', (req, res, next) => {
    const { articleId, page, limit } = req.params;
    let result = {};
    jwt.verify(req.headers.token, '123456', async (err) => {
      const jwtFailed = err ? true : false;
      new Promise((finalResolve, finalReject) => {
        const sql = jwtFailed
          ? 'select * from msgboardforarticle where articleId = ? and audit = 1 order by toTop DESC , subTime DESC'
          : 'select * from msgboardforarticle  where articleId = ? order by toTop DESC , subTime DESC';
        pool.query(sql, articleId, (err, data) => {
          if (err) return finalReject(err);
          result.msgData = data;
          result.msgCount = data.length;
          const map = new Map();
          const promiseArr = data.map((item) => {
            return new Promise((resolve) => {
              if (item.fatherMsgId) {
                map.set(item.msgId, true);
                const target = data.find(
                  (item2) => +item2.msgId === +item.fatherMsgId,
                );
                item.parent = {
                  parentName: target.name,
                  parentWebsite: target.website,
                };
                target.children
                  ? target.children.push(item)
                  : (target.children = [item]);
              }
              resolve(1);
            });
          });
          Promise.all(promiseArr).then(() => {
            result.msgData = result.msgData.filter(
              (item) => !map.get(item.msgId),
            );
            result.pages = Math.ceil(result.msgData.length / limit) || 1;
            if (page > result.pages) {
              finalReject('page超出范围');
            }
            const start = (page - 1) * limit;
            const end = limit * page;
            result.msgData = result.msgData.slice(start, end);
            finalResolve(result);
          });
        });
      }).then(
        (data) => {
          res.json({ code: 200, data });
        },
        (err) => {
          custom.log(err);
          if (err === 'page超出范围') res.json({ code: 400, msg: err });
          else res.json({ code: 500, msg: '服务器错误' });
        },
      );
    });
  });
  //删除留言-文章
  router.delete('/deleteMsgForArticle', (req, res, next) => {
    const { msgId } = req.body;
    if (!msgId) return res.json({ code: 400, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'select COUNT(*) from msgboardforarticle where fatherMsgId = ?',
          msgId,
          (err, data) => {
            if (err) {
              return reject(err);
            }
            if (data[0]['COUNT(*)'] !== 0)
              return res.json({ code: 402, msg: '请先删除完子评论' });
            pool.query(
              'delete from msgboardforarticle where msgId = ?',
              msgId,
              (err) => {
                if (err) return reject(err);
                resolve(1);
              },
            );
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '删除成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //审核留言-文章
  router.get('/auditMsgForArticle/:msgId', (req, res, next) => {
    const { msgId } = req.params;
    if (!msgId) return res.json({ code: 400, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update msgboardforarticle set audit = 1 where msgId = ?',
          msgId,
          (err) => {
            if (err) return reject(err);
            resolve(1);
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '审核成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //置顶留言-留言板
  router.get('/topMsgForArticle/:msgId', (req, res, next) => {
    const { msgId } = req.params;
    if (!msgId) return res.json({ code: 400, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update msgboardforarticle set toTop = ? where msgId = ? ',
          [dayjs(Date.now()).format('YYYY-MM-DD hh:mm:ss'), msgId],
          (err) => {
            if (err) return reject(err);
            resolve(1);
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '置顶成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //取消置顶-留言板
  router.get('/cancelTopMsgForArticle/:msgId', (req, res, next) => {
    const { msgId } = req.params;
    if (!msgId) return res.json({ code: 400, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update msgboardforarticle set toTop = ? where msgId = ? ',
          ['1970-01-01 08:00:01', msgId],
          (err) => {
            if (err) return reject(err);
            resolve(1);
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '取消置顶成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });

  //添加留言-留言板
  router.post('/addMsgForBoard', async (req, res, next) => {
    jwt.verify(req.headers.token, '123456', async (err) => {
      if (err) {
        let { name, content, fatherMsgId, mail, website } = req.body;
        name = validateInput(name);
        content = validateInput(content);
        mail = validateInput(mail);
        website = validateInput(website);
        let avatar = `/avatar/${Math.floor(Math.random() * 9) + 1}.jpg`;
        const userInfoRow = await redisClient.get(mail);
        if (userInfoRow) {
          const userInfo = JSON.parse(userInfoRow);
          if (userInfo.name !== name)
            return res.json({ code: 402, msg: '用户名与原邮箱不匹配！' });
          avatar = userInfo.avatar;
        } else {
          redisClient.set(mail, JSON.stringify({ name, avatar }));
        }
        const subTime = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
        const device = req.headers['user-agent']
          .match(/\(.*?\)/)[0]
          .slice(1)
          .split(';')[0];
        const ua = req.headers['user-agent'].split(' ');
        let browser = '';
        ua.forEach((item) => {
          if (browser) {
            let browserPri = 0;
            let itemPri = 0;
            Object.keys(browserPriority).forEach((key) => {
              if (browser.includes(browserPriority[key])) browserPri = +key;
              if (item.includes(browserPriority[key])) itemPri = +key;
            });
            if (browserPri < itemPri) browser = item;
          } else {
            browser = item;
          }
        });
        const upvoke = 0;
        new Promise((finalResolve, finalReject) => {
          pool.query(
            'insert into msgboardforall set ?',
            {
              name,
              content,
              fatherMsgId,
              mail,
              website,
              avatar,
              subTime,
              device,
              browser,
              upvoke,
            },
            (err) => {
              if (err) return finalReject(err);
              finalResolve();
            },
          );
        }).then(
          () => {
            res.json({ code: 200, msg: '添加成功' });
          },
          (err) => {
            custom.log(err);
            res.json({ code: 500, msg: '服务器出错' });
          },
        );
      } else {
        let { name, content, fatherMsgId, mail, website } = req.body;
        mail = '1263032107@qq.com';
        name = 'unstoppable840';
        website = '/';
        let avatar = '/adminAvatar/avatar.jpeg';
        const subTime = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');
        const device = req.headers['user-agent']
          .match(/\(.*?\)/)[0]
          .slice(1)
          .split(';')[0];
        const ua = req.headers['user-agent'].split(' ');
        let browser = '';
        ua.forEach((item) => {
          if (browser) {
            let browserPri = 0;
            let itemPri = 0;
            Object.keys(browserPriority).forEach((key) => {
              if (browser.includes(browserPriority[key])) browserPri = +key;
              if (item.includes(browserPriority[key])) itemPri = +key;
            });
            if (browserPri < itemPri) browser = item;
          } else {
            browser = item;
          }
        });
        const upvoke = 0;
        const isAdmin = 1;
        new Promise((finalResolve, finalReject) => {
          pool.query(
            'insert into msgboardforall set ?',
            {
              name,
              content,
              fatherMsgId,
              mail,
              website,
              avatar,
              subTime,
              device,
              browser,
              upvoke,
              isAdmin,
            },
            (err) => {
              if (err) return finalReject(err);
              finalResolve();
            },
          );
        }).then(
          () => {
            res.json({ code: 200, msg: '添加成功' });
          },
          (err) => {
            custom.log(err);
            res.json({ code: 500, msg: '服务器出错' });
          },
        );
      }
    });
  });
  //获取留言-留言板
  router.get('/getMsgForBoard/:page/:limit', (req, res, next) => {
    const { page, limit } = req.params;
    const token = req.headers.token;
    let result = {};
    jwt.verify(req.headers.token, '123456', async (err) => {
      const jwtFailed = err ? true : false;
      new Promise((finalResolve, finalReject) => {
        const sql = jwtFailed
          ? 'select * from msgboardforall where audit = 1 order by toTop DESC , subTime DESC'
          : 'select * from msgboardforall order by toTop DESC , subTime DESC';
        pool.query(sql, (err, data) => {
          if (err) return finalReject(err);
          result.msgData = data;
          result.msgCount = data.length;
          const map = new Map();
          const promiseArr = data.map((item) => {
            return new Promise((resolve) => {
              if (item.fatherMsgId) {
                map.set(item.msgId, true);
                const target = data.find(
                  (item2) => +item2.msgId === +item.fatherMsgId,
                );
                item.parent = {
                  parentName: target.name,
                  parentWebsite: target.website,
                };
                target.children
                  ? target.children.push(item)
                  : (target.children = [item]);
              }
              resolve(1);
            });
          });
          Promise.all(promiseArr).then(() => {
            result.msgData = result.msgData.filter(
              (item) => !map.get(item.msgId),
            );
            result.pages = Math.ceil(result.msgData.length / limit) || 1;
            if (page > result.pages) {
              finalReject('page超出范围');
            }
            const start = (page - 1) * limit;
            const end = limit * page;
            result.msgData = result.msgData.slice(start, end);
            finalResolve(result);
          });
        });
      }).then(
        (data) => {
          res.json({ code: 200, data });
        },
        (err) => {
          custom.log(err);
          if (err === 'page超出范围') res.json({ code: 400, msg: err });
          else res.json({ code: 500, msg: '服务器错误' });
        },
      );
    });
  });
  //删除留言-留言板
  router.delete('/deleteMsgForBoard', (req, res, next) => {
    const { msgId } = req.body;
    if (!msgId) return res.json({ code: 402, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'select COUNT(*) from msgboardforall where fatherMsgId = ?',
          msgId,
          (err, data) => {
            if (err) {
              return reject(err);
            }
            if (data[0]['COUNT(*)'] !== 0)
              return res.json({ code: 402, msg: '请先删除完子评论' });
            pool.query(
              'delete from msgboardforall where msgId = ?',
              msgId,
              (err) => {
                if (err) return reject(err);
                resolve(1);
              },
            );
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '删除成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //审核留言-留言板
  router.get('/auditMsgForBoard/:msgId', (req, res, next) => {
    const { msgId } = req.params;
    if (!msgId) return res.json({ code: 400, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update msgboardforall set audit = 1 where msgId = ? ',
          msgId,
          (err) => {
            if (err) return reject(err);
            resolve(1);
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '审核成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //置顶留言-留言板
  router.get('/topMsgForBoard/:msgId', (req, res, next) => {
    const { msgId } = req.params;
    if (!msgId) return res.json({ code: 400, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update msgboardforall set toTop = ? where msgId = ? ',
          [dayjs(Date.now()).format('YYYY-MM-DD hh:mm:ss'), msgId],
          (err) => {
            if (err) return reject(err);
            resolve(1);
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '置顶成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //取消置顶-留言板
  router.get('/cancelTopMsgForBoard/:msgId', (req, res, next) => {
    const { msgId } = req.params;
    if (!msgId) return res.json({ code: 400, msg: '请传入正确的msgId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update msgboardforall set toTop = ? where msgId = ? ',
          ['1970-01-01 08:00:01', msgId],
          (err) => {
            if (err) return reject(err);
            resolve(1);
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '取消置顶成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });

  //点赞功能-文章
  router.get(
    '/upvokeForArticle/:articleId/:msgId/:checked',
    (req, res, next) => {
      const { articleId, msgId, checked } = req.params;
      new Promise((finalResolve, finalReject) => {
        pool.query(
          'select upvoke from msgboardforarticle where articleId=? and msgId = ?',
          [articleId, msgId],
          (err, data) => {
            if (err) return finalReject(err);
            const upvokeCount = data[0].upvoke;
            pool.query(
              'update msgboardforarticle set upvoke = ? where articleId=? and msgId = ?',
              [
                +checked === 1 ? upvokeCount + 1 : upvokeCount - 1,
                articleId,
                msgId,
              ],
              (err) => {
                if (err) return finalReject(err);
                finalResolve(1);
              },
            );
          },
        );
      }).then(
        () => {
          res.json({ code: 200, msg: '点赞成功' });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器错误' });
        },
      );
    },
  );
  //点赞功能-留言板
  router.get('/upvokeForBoard/:msgId/:checked', (req, res, next) => {
    const { msgId, checked } = req.params;
    new Promise((finalResolve, finalReject) => {
      pool.query(
        'select upvoke from msgboardforall where msgId = ?',
        [msgId],
        (err, data) => {
          if (err) return finalReject(err);
          const upvokeCount = data[0].upvoke;
          pool.query(
            'update msgboardforall set upvoke = ? where msgId = ?',
            [+checked === 1 ? upvokeCount + 1 : upvokeCount - 1, msgId],
            (err) => {
              if (err) return finalReject(err);
              finalResolve(1);
            },
          );
        },
      );
    }).then(
      () => {
        res.json({ code: 200, msg: '点赞成功' });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器错误' });
      },
    );
  });
});

module.exports = router;
