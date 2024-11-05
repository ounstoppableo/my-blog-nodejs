const redisClient = require('../redis/connect');
const pool = require('../mysql/pool');
const articleInfoPreheat = () => {
  return new Promise((topRes, topRej) => {
    redisClient.then((redisClient) => {
      pool.query('select * from articleinfo', (err, articleinfos) => {
        if (err) {
          return console.log(err);
        }
        const promises = articleinfos.map((articleInfo) => {
          return Promise.all([
            new Promise((resovle, reject) => {
              pool.query(
                'select folderName from folder where folderId = ?',
                articleInfo.folderId,
                (err, data) => {
                  if (err) return reject(err);
                  articleInfo.folderName = data[0].folderName;
                  resovle(1);
                },
              );
            }),
            new Promise((resovle, reject) => {
              pool.query(
                'select tagName from articletotag where articleId = ?',
                articleInfo.articleId,
                (err, tags) => {
                  if (err) return reject(err);
                  articleInfo.tags = tags;
                  Promise.all(
                    tags.map((tag) => {
                      return new Promise(
                        (resovleForTagQuery, rejectForTagQuery) => {
                          pool.query(
                            'select tagColor from tags where tagName = ?',
                            tag.tagName,
                            (err, tagColor) => {
                              if (err) return rejectForTagQuery(err);
                              tag.tagColor = tagColor[0].tagColor;
                              resovleForTagQuery(1);
                            },
                          );
                        },
                      );
                    }),
                  )
                    .then(() => {
                      resovle(1);
                    })
                    .catch((err) => reject(err));
                },
              );
            }),
          ]);
        });
        Promise.all(promises)
          .then(() => {
            const promises = articleinfos.map((articleInfo) => {
              return redisClient.HSET(
                'articleInfo',
                articleInfo.articleId,
                JSON.stringify(articleInfo),
              );
            });
            Promise.all(promises)
              .then(() => {
                topRes(1);
              })
              .catch((err) => {
                console.log(err);
                topRej(err);
              });
          })
          .catch((err) => console.log(err));
      });
    });
  });
};
module.exports = articleInfoPreheat;
