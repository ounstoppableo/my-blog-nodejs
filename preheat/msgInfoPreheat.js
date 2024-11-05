const redisClient = require('../redis/connect');
const pool = require('../mysql/pool');
const dayjs = require('dayjs');

const msgInfoPreheat = () => {
  return new Promise((topRes, topRej) => {
    redisClient
      .then((redisClient) => {
        Promise.all([
          new Promise((reolve1, reject1) => {
            pool.query(
              'select msgId, name, content, subTime,avatar from msgboardforall where audit = 1',
              (err, data) => {
                if (err) reject1(err);
                const promises = data.map((msgItem) => {
                  return new Promise((resolve11, reject11) => {
                    redisClient
                      .zAdd('msgInfo', {
                        score: dayjs(msgItem.subTime).unix(),
                        value: JSON.stringify(msgItem),
                      })
                      .then(() => {
                        resolve11(1);
                      })
                      .catch(() => {
                        reject11(1);
                      });
                  });
                });
                Promise.all(promises)
                  .then(() => {
                    reolve1(1);
                  })
                  .catch((err) => {
                    reject1(err);
                  });
              },
            );
          }),
          new Promise((reolve2, reject2) => {
            pool.query(
              'select msgId, name, content, subTime,avatar,articleId from msgboardforarticle where audit = 1',
              (err, data) => {
                if (err) reject2(err);
                const promises = data.map((msgItem) => {
                  return new Promise((resolve22, reject22) => {
                    redisClient
                      .zAdd('msgInfo', {
                        score: dayjs(msgItem.subTime).unix(),
                        value: JSON.stringify(msgItem),
                      })
                      .then(() => {
                        resolve22(1);
                      })
                      .catch(() => {
                        reject22(1);
                      });
                  });
                });
                Promise.all(promises)
                  .then(() => {
                    reolve2(1);
                  })
                  .catch((err) => {
                    reject2(err);
                  });
              },
            );
          }),
        ])
          .then(() => {
            topRes(1);
          })
          .catch((err) => {
            console.log(err);
            topRej(err);
          });
      })
      .catch((err) => {
        console.log(err);
        topRej(err);
      });
  });
};

module.exports = msgInfoPreheat;
