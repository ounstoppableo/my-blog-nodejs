const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../../mysql/pool');
const moment = require('moment');
const mdImgtagToHtmlImgtag = require('../../utils/mdImgtagToHtmlImgtag');
const { rdmRgbColor } = require('../../utils/randomColor');
const { readingTime } = require('reading-time-estimator');
const custom = require('../../utils/log');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const dayjs = require('dayjs');
const mailTransporter = require('../../mail/mail');
const generateMailTemplate = require('../../utils/generateMailTemplate');
const redisClient = require('../../redis/connect');
const router = express.Router();
const publicPath = __dirname + '/../../public';
const blogUrl = 'https://www.unstoppable840.cn';
const cancelToTopSign = '1970-01-01 08:00:01';
const dayFormat = 'YYYY-MM-DD hh:mm:ss';

redisClient.then((redisClient) => {
  //添加文章
  router.post('/addArticle', (req, res, next) => {
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      const {
        articleId,
        title,
        folderId,
        description,
        articleUrl,
        backImgUrl,
        listOfTagOptions,
      } = req.body;
      const date = moment(new Date()).format('YYYY-MM-DD');
      const fileUrl = publicPath + articleUrl;
      //先把文章读取出来
      new Promise((finalResolve, reject) => {
        fs.readFile(fileUrl, (err, fileData) => {
          if (err) return reject(err);
          fileData = mdImgtagToHtmlImgtag(fileData.toString());
          if (!articleId) {
            const newArticleId = uuidv4();
            //先更新文章信息表，有了articleId再进行文章内容表的更新
            pool.query(
              'INSERT INTO articleinfo SET ?',
              {
                articleId: newArticleId,
                title,
                folderId,
                subTime: date,
                lastModifyTime: date,
                description,
                backImgUrl,
                VT: 0,
              },
              (err) => {
                if (err) return reject(err);
                //文章内容表的更新
                pool.query(
                  'INSERT INTO articledetail SET ?',
                  { articleId: newArticleId, articleContent: fileData },
                  (err) => {
                    if (err) return reject(err);
                    //tags表的更新
                    pool.query('select * from tags', (err, data) => {
                      if (err) return reject(err);
                      const tags = listOfTagOptions
                        .filter((item) => {
                          return (
                            data.findIndex((tag) => tag.tagName === item) === -1
                          );
                        })
                        .map((item) => {
                          return {
                            tagName: item,
                            tagColor: rdmRgbColor(),
                          };
                        });
                      const promiseArr = tags.map((item) => {
                        return new Promise((resolve) => {
                          pool.query('insert into tags set ?', item, (err) => {
                            if (err) return reject(err);
                            resolve(1);
                          });
                        });
                      });
                      Promise.all(promiseArr).then(() => {
                        //tags表更新后接着更新articleToTags表
                        const promiseArr = listOfTagOptions.map((item) => {
                          return new Promise((resolve) => {
                            pool.query(
                              'insert into articletotag set ?',
                              { articleId: newArticleId, tagName: item },
                              (err) => {
                                if (err) return reject(err);
                                resolve(1);
                              },
                            );
                          });
                        });
                        Promise.all(promiseArr).then(() => {
                          finalResolve(1);
                        });
                      });
                    });
                    //更新完删除本地存储
                    fs.unlink(fileUrl, (err) => {
                      if (err) throw err;
                      custom.log('文件已删除');
                    });
                  },
                );
              },
            );
          }
        });
      }).then(
        () => {
          res.json({ code: 200, msg: '添加成功' });
          pool.query('select * from subscribeList', (err, data) => {
            if (err) {
              return custom.log(err);
            }
            data.forEach((item) => {
              const { mail } = item;
              mailTransporter
                .sendMail({
                  from: '1263032107@qq.com',
                  to: mail,
                  subject: `unustoppable840's blog 更新了文章🎊，快来看看吧~~`,
                  html: generateMailTemplate(
                    title,
                    mail,
                    description,
                    blogUrl + '/article/' + articleId,
                  ),
                })
                .catch((err) => {
                  custom.log(err);
                });
            });
          });
        },
        () => {
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //首页文件分类
  router.get('/folder', (req, res, next) => {
    pool.query('select * from folder', (err, data) => {
      if (err) return res.json({ code: 500, msg: '服务器出错!' });
      res.json({ code: 200, data: data });
    });
  });
  //获取标签
  router.get('/getTags', (req, res, next) => {
    new Promise((resolve, reject) => {
      pool.query('select * from tags', (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    }).then(
      (data) => {
        res.json({ code: 200, data });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器出错' });
      },
    );
  });
  //获取文章信息
  router.get('/getArticleInfo', (req, res, next) => {
    const articleInfoList = [];
    new Promise((resolve, reject) => {
      //获取文章基本信息
      const sql = `select * from articleinfo order by lastModifyTime DESC`;
      pool.query(sql, (err, dataForArticleinfo) => {
        if (err) return reject(err);
        const promiseArr = dataForArticleinfo.map((item, index) => {
          articleInfoList.push(item);
          //获取文章标签
          return new Promise((resolve) => {
            pool.query(
              'select folderName from folder where folderId = ?',
              [item.folderId],
              (err, dataForfolder) => {
                if (err) return reject(err);
                articleInfoList[index].folderName = dataForfolder[0].folderName;
                pool.query(
                  'select * from articletotag where articleId = ?',
                  [item.articleId],
                  (err, dataForArticletotag) => {
                    if (err) return reject(err);
                    articleInfoList[index].tags = [];
                    const promiseArr = dataForArticletotag.map((item) => {
                      return new Promise((resolve) => {
                        pool.query(
                          'select * from tags where tagName = ?',
                          [item.tagName],
                          (err, dataForTags) => {
                            if (err) return reject(err);
                            articleInfoList[index].tags.push(dataForTags[0]);
                            resolve(1);
                          },
                        );
                      });
                    });
                    Promise.all(promiseArr).then(() => {
                      resolve(1);
                    });
                  },
                );
              },
            );
          });
        });
        Promise.all(promiseArr).then(() => {
          resolve(1);
        });
      });
    }).then(
      () => {
        res.json({
          code: 200,
          data: articleInfoList.map((item) => ({
            ...item,
            toTop: dayjs(item.toTop).format(dayFormat),
          })),
        });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器出错' });
      },
    );
  });
  //获取文章内容
  router.get('/getArticle/:articleId', (req, res, next) => {
    const { articleId } = req.params;
    new Promise((finalResolve, finalReject) => {
      pool.query(
        'select * from articledetail where articleId = ?',
        [articleId],
        (err, data) => {
          if (err) return finalReject(err);
          finalResolve(data[0]);
        },
      );
    }).then(
      (data) => {
        const result = readingTime(data.articleContent, 225, 'cn');
        res.json({ code: 200, data: Object.assign(data, result) });
      },
      (err) => {
        res.json({ code: 500, msg: '服务器错误' });
      },
    );
  });
  //获取文章信息通过文章id
  router.get('/getArticleInfo/:articleId', (req, res, next) => {
    const { articleId } = req.params;
    const articleInfoList = [];
    //设置访问量
    pool.query(
      'select VT from articleinfo where articleId = ?',
      [articleId],
      (err, data) => {
        const VT = data[0].VT;
        pool.query(
          'update articleinfo set VT=? where articleId = ?',
          [VT + 1, articleId],
          (err) => {
            if (err) custom.log(err);
          },
        );
      },
    );
    new Promise((resolve, reject) => {
      //获取文章基本信息
      const sql = `select * from articleinfo where articleId = ? order by subTime DESC`;
      pool.query(sql, [articleId], (err, dataForArticleinfo) => {
        if (err) return reject(err);
        const promiseArr = dataForArticleinfo.map((item, index) => {
          articleInfoList.push(item);
          //获取文章标签
          return new Promise((resolve) => {
            pool.query(
              'select folderName from folder where folderId = ?',
              [item.folderId],
              (err, dataForfolder) => {
                if (err) return reject(err);
                articleInfoList[index].folderName = dataForfolder[0].folderName;
                pool.query(
                  'select * from articletotag where articleId = ?',
                  [item.articleId],
                  (err, dataForArticletotag) => {
                    if (err) return reject(err);
                    articleInfoList[index].tags = [];
                    const promiseArr = dataForArticletotag.map((item) => {
                      return new Promise((resolve) => {
                        pool.query(
                          'select * from tags where tagName = ?',
                          [item.tagName],
                          (err, dataForTags) => {
                            if (err) return reject(err);
                            articleInfoList[index].tags.push(dataForTags[0]);
                            resolve(1);
                          },
                        );
                      });
                    });
                    Promise.all(promiseArr).then(() => {
                      resolve(1);
                    });
                  },
                );
              },
            );
          });
        });
        Promise.all(promiseArr).then(() => {
          resolve(1);
        });
      });
    }).then(
      () => {
        res.json({ code: 200, data: articleInfoList[0] });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器出错' });
      },
    );
  });
  //更新文章
  router.post('/updateArticle', (req, res, next) => {
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      const {
        articleId,
        title,
        folderId,
        description,
        articleUrl,
        backImgUrl,
        listOfTagOptions,
      } = req.body;
      // if (!articleId || !title || !folderId || !description || !articleUrl || !backImgUrl || listOfTagOptions.length === 0) return res.json({ code: 400, msg: '字段不全' })
      const date = moment(new Date()).format('YYYY-MM-DD');
      const fileUrl = publicPath + articleUrl;
      //先把文章读取出来
      new Promise((finalResolve, reject) => {
        fs.readFile(fileUrl, (err, fileData) => {
          if (err) return reject(err);
          fileData = mdImgtagToHtmlImgtag(fileData.toString());
          //先更新文章信息表，有了articleId再进行文章内容表的更新
          pool.query(
            'update articleinfo SET ? where articleId = ?',
            [
              {
                title,
                folderId,
                lastModifyTime: date,
                description,
                backImgUrl,
              },
              articleId,
            ],
            (err) => {
              if (err) return reject(err);
              //文章内容表的更新
              pool.query(
                'update articledetail SET ? where articleId = ?',
                [{ articleContent: fileData }, articleId],
                (err) => {
                  if (err) return reject(err);
                  //tags表的更新
                  pool.query('select * from tags', (err, data) => {
                    if (err) return reject(err);
                    const tags = listOfTagOptions
                      .filter((item) => {
                        return (
                          data.findIndex((tag) => tag.tagName === item) === -1
                        );
                      })
                      .map((item) => {
                        return {
                          tagName: item,
                          tagColor: rdmRgbColor(),
                        };
                      });
                    const promiseArr = tags.map((item) => {
                      return new Promise((resolve) => {
                        pool.query('insert into tags set ?', item, (err) => {
                          if (err) return reject(err);
                          resolve(1);
                        });
                      });
                    });
                    Promise.all(promiseArr).then(() => {
                      //tags表更新后接着更新articleToTags表
                      pool.query(
                        'select * from articletotag where articleId = ?',
                        [articleId],
                        (err, data) => {
                          if (err) return reject(err);
                          const needDelTags = data
                            .filter(
                              (item) =>
                                listOfTagOptions.findIndex(
                                  (tagName) => tagName === item.tagName,
                                ) === -1,
                            )
                            .map((item) => item.tagName);
                          const needAddTags = listOfTagOptions.filter(
                            (tagName) =>
                              data.findIndex(
                                (item) => item.tagName === tagName,
                              ) === -1,
                          );
                          const promiseArr1 = needDelTags.map((item) => {
                            return new Promise((resolve) => {
                              pool.query(
                                'delete from articletotag where articleId = ? and tagName=?',
                                [articleId, item],
                                (err) => {
                                  if (err) return reject(err);
                                  resolve(1);
                                },
                              );
                            });
                          });
                          const promiseArr2 = needAddTags.map((item) => {
                            return new Promise((resolve) => {
                              pool.query(
                                'insert into articletotag set ?',
                                { articleId, tagName: item },
                                (err) => {
                                  if (err) return reject(err);
                                  resolve(1);
                                },
                              );
                            });
                          });
                          Promise.all([...promiseArr1, ...promiseArr2]).then(
                            () => {
                              finalResolve(1);
                            },
                          );
                        },
                      );
                    });
                  });
                  //更新完删除本地存储
                  fs.unlink(fileUrl, (err) => {
                    if (err) throw err;
                    custom.log('文件已删除');
                  });
                },
              );
            },
          );
        });
      }).then(
        () => {
          res.json({ code: 200, msg: '更新成功' });
          pool.query('select * from subscribeList', (err, data) => {
            if (err) {
              return custom.log(err);
            }
            data.forEach((item) => {
              const { mail } = item;
              mailTransporter
                .sendMail({
                  from: '1263032107@qq.com',
                  to: mail,
                  subject: `unustoppable840's blog 更新了文章🎊，快来看看吧~~`,
                  html: generateMailTemplate(
                    title,
                    mail,
                    description,
                    blogUrl + '/article/' + articleId,
                  ),
                })
                .catch((err) => {
                  custom.log(err);
                });
            });
          });
        },
        (err) => {
          custom.log(err);
          res.json({ code: 500, msg: '服务器出错' });
        },
      );
    });
  });
  //删除文章
  router.get('/delArticle/:articleId', (req, res, next) => {
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        const { articleId } = req.params;
        pool.query(
          'delete from articleinfo where articleId = ?',
          articleId,
          (err) => {
            if (err) return reject(err);
            resolve(1);
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
  //获取文件夹分类下的文章数量
  router.get('/articleInFolderCount', (req, res, next) => {
    new Promise((finalResolve, finalReject) => {
      let result = [];
      pool.query('select * from folder', (err, data) => {
        if (err) return finalReject(err);
        result = data;
        const promiseArr = result.map((item) => {
          return new Promise((resolve) => {
            pool.query(
              'select COUNT(*) from articleinfo where folderId = ?',
              item.folderId,
              (err, data) => {
                if (err) return finalReject(err);
                item.count = data[0]['COUNT(*)'];
                resolve(1);
              },
            );
          });
        });
        Promise.all(promiseArr).then(() => {
          finalResolve(result);
        });
      });
    }).then(
      (data) => {
        res.json({ code: 200, data });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器错误' });
      },
    );
  });
  //单个文件夹对应的文章信息页
  router.get('/singleFolder/:folderId/:page/:limit', (req, res, next) => {
    const { folderId, page, limit } = req.params;
    if (page <= 0 || limit <= 0)
      return res.json({ code: 400, msg: 'page或limit有误' });
    const result = {};
    new Promise((finalResolve, finalReject) => {
      pool.query(
        'select * from articleinfo where folderId = ? order by lastModifyTime DESC',
        folderId,
        (err, data) => {
          if (err) return finalReject(err);
          result.articleInfos = data;
          pool.query(
            'select folderName from folder where folderId = ?',
            folderId,
            (err, data) => {
              if (err) return finalReject(err);
              result.folderName = data[0].folderName;
              result.articleInfos.forEach(
                (item) => (item.folderName = result.folderName),
              );
              const promiseArr = result.articleInfos.map((item) => {
                return new Promise((resolve) => {
                  pool.query(
                    'select * from articletotag where articleId = ? ',
                    item.articleId,
                    (err, data) => {
                      if (err) return finalReject(err);
                      item.tags = data;
                      const promiseArr2 = item.tags.map((tag) => {
                        return new Promise((resolve2) => {
                          pool.query(
                            'select tagColor from tags where tagName = ?',
                            tag.tagName,
                            (err, data) => {
                              if (err) return finalReject(err);
                              tag.tagColor = data[0].tagColor;
                              resolve2(1);
                            },
                          );
                        });
                      });
                      Promise.all(promiseArr2).then(() => resolve(1));
                    },
                  );
                });
              });
              Promise.all(promiseArr).then(() => {
                finalResolve(result);
              });
            },
          );
        },
      );
    }).then(
      (data) => {
        const start = (page - 1) * limit;
        const end = page * limit;
        data.total = data.articleInfos.length;
        data.pages = Math.ceil(data.articleInfos.length / limit) || 1;
        if (page > data.pages)
          return res.json({ code: 400, msg: 'page超过限制' });
        data.articleInfos = data.articleInfos.slice(start, end).map((item) => ({
          ...item,
          toTop: dayjs(item.toTop).format(dayFormat),
        }));
        res.json({ code: 200, data });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器错误' });
      },
    );
  });
  //获取标签分类下的文章数量
  router.get('/articleInTagCount', (req, res, next) => {
    new Promise((finalResolve, finalReject) => {
      let result = [];
      pool.query('select * from tags', (err, data) => {
        if (err) return finalReject(err);
        result = data;
        const promiseArr = result.map((item) => {
          return new Promise((resolve) => {
            pool.query(
              'select COUNT(*) from articletotag where tagName = ?',
              item.tagName,
              (err, data) => {
                if (err) return finalReject(err);
                item.count = data[0]['COUNT(*)'];
                resolve(1);
              },
            );
          });
        });
        Promise.all(promiseArr).then(() => finalResolve(result));
      });
    }).then(
      (data) => {
        res.json({ code: 200, data });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器错误' });
      },
    );
  });
  //单个标签对应的文章信息页
  router.get('/singleTag/:tagName/:page/:limit', (req, res, next) => {
    const { tagName, page, limit } = req.params;
    if (page <= 0 || limit <= 0)
      return res.json({ code: 400, msg: 'page或limit有误' });
    new Promise((finalResolve, finalReject) => {
      const result = { tagName };
      pool.query(
        'select articleId from articletotag where tagName = ?',
        tagName,
        (err, data) => {
          if (err) return finalReject(err);
          result.articleInfos = [];
          const promiseArr = data.map((item) => {
            return new Promise((resolve) => {
              pool.query(
                'select * from articleinfo where articleId = ?',
                item.articleId,
                (err, data) => {
                  if (err) return finalReject(err);
                  result.articleInfos.push(data[0]);
                  resolve(1);
                },
              );
            });
          });
          Promise.all(promiseArr).then(() => {
            const promiseArr2 = result.articleInfos.map((item) => {
              return new Promise((resolve2) => {
                pool.query(
                  'select folderName from folder where folderId = ?',
                  item.folderId,
                  (err, data) => {
                    if (err) return finalReject(err);
                    item.folderName = data[0].folderName;
                    resolve2(1);
                  },
                );
              });
            });
            const promiseArr3 = result.articleInfos.map((item) => {
              return new Promise((resolve3) => {
                pool.query(
                  'select * from articletotag where articleId = ?',
                  item.articleId,
                  (err, data) => {
                    if (err) return finalReject(err);
                    item.tags = data;
                    const promiseArr4 = item.tags.map((tag) => {
                      return new Promise((resolve5) => {
                        pool.query(
                          'select tagColor from tags where tagName = ?',
                          tag.tagName,
                          (err, data) => {
                            if (err) return finalReject(err);
                            tag.tagColor = data[0].tagColor;
                            resolve5(1);
                          },
                        );
                      });
                    });
                    Promise.all(promiseArr4).then(() => resolve3(1));
                  },
                );
              });
            });
            Promise.all([...promiseArr2, ...promiseArr3]).then(() =>
              finalResolve(result),
            );
          });
        },
      );
    }).then(
      (data) => {
        const start = (page - 1) * limit;
        const end = page * limit;
        data.total = data.articleInfos.length;
        data.pages = Math.ceil(data.articleInfos.length / limit) || 1;
        if (page > data.pages)
          return res.json({ code: 400, msg: 'page超出限制' });
        data.articleInfos = data.articleInfos.slice(start, end).map((item) => ({
          ...item,
          toTop: dayjs(item.toTop).format(dayFormat),
        }));
        res.json({ code: 200, data });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器出错' });
      },
    );
  });
  //获取文章信息-分页
  router.get('/getArticleInfoByPage/:page/:limit', (req, res, next) => {
    const { page, limit } = req.params;
    if (page <= 0 || limit <= 0)
      return res.json({ code: 400, msg: 'page或limit有误' });
    const articleInfoList = [];
    new Promise((resolve, reject) => {
      //获取文章基本信息
      const sql = `select * from articleinfo order by lastModifyTime DESC`;
      pool.query(sql, (err, dataForArticleinfo) => {
        if (err) return reject(err);
        const promiseArr = dataForArticleinfo.map((item, index) => {
          articleInfoList.push(item);
          //获取文章标签
          return new Promise((resolve) => {
            pool.query(
              'select folderName from folder where folderId = ?',
              [item.folderId],
              (err, dataForfolder) => {
                if (err) return reject(err);
                articleInfoList[index].folderName = dataForfolder[0].folderName;
                pool.query(
                  'select * from articletotag where articleId = ?',
                  [item.articleId],
                  (err, dataForArticletotag) => {
                    if (err) return reject(err);
                    articleInfoList[index].tags = [];
                    const promiseArr = dataForArticletotag.map((item) => {
                      return new Promise((resolve) => {
                        pool.query(
                          'select * from tags where tagName = ?',
                          [item.tagName],
                          (err, dataForTags) => {
                            if (err) return reject(err);
                            articleInfoList[index].tags.push(dataForTags[0]);
                            resolve(1);
                          },
                        );
                      });
                    });
                    Promise.all(promiseArr).then(() => {
                      resolve(1);
                    });
                  },
                );
              },
            );
          });
        });
        Promise.all(promiseArr).then(() => {
          resolve(1);
        });
      });
    }).then(
      () => {
        const start = (page - 1) * limit;
        const end = page * limit;
        const result = {};
        result.pages = Math.ceil(articleInfoList.length / limit) || 1;
        result.total = articleInfoList.length;
        try {
          articleInfoList.forEach((articleInfo) => {
            redisClient.HSET(
              'articleInfo',
              articleInfo.articleId,
              JSON.stringify(articleInfo),
            );
          });
        } catch (err) {
          custom.log(err);
          console.log(err);
        }
        if (page > result.pages)
          return res.json({ code: 400, msg: 'page超过最大页数' });
        result.articleInfoList = articleInfoList
          .slice(start, end)
          .map((item) => ({
            ...item,
            toTop: dayjs(item.toTop).format(dayFormat),
          }));
        res.json({ code: 200, data: result });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器出错' });
      },
    );
  });
  //获取前一个文章和后一个文章
  router.get('/preAndNextArticle/:articleId', (req, res, next) => {
    new Promise((finalResolve, finalReject) => {
      const { articleId } = req.params;
      pool.query(
        'select articleId,title,backImgUrl from articleinfo order by lastModifyTime DESC',
        (err, data) => {
          if (err) return finalReject(err);
          const index = data.findIndex((item) => item.articleId === articleId);
          const result = {
            pre: index > 0 ? data[index - 1].articleId : '',
            preTitle: index > 0 ? data[index - 1].title : '',
            prebackImgUrl: index > 0 ? data[index - 1].backImgUrl : '',
            next: index < data.length - 1 ? data[index + 1].articleId : '',
            nextTitle: index < data.length - 1 ? data[index + 1].title : '',
            nextbackImgUrl:
              index < data.length - 1 ? data[index + 1].backImgUrl : '',
          };
          finalResolve(result);
        },
      );
    }).then(
      (data) => {
        res.json({ code: 200, data });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器出错' });
      },
    );
  });

  //置顶文章
  router.get('/toTopArticle/:articleId', (req, res, next) => {
    const { articleId } = req.params;
    if (!articleId)
      return res.json({ code: 400, msg: '请传入正确的articleId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update articleinfo set toTop = ? where articleId = ? ',
          [dayjs(Date.now()).format(dayFormat), articleId],
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
  //取消置顶文章
  router.get('/cancelTopArticle/:articleId', (req, res, next) => {
    const { articleId } = req.params;
    if (!articleId)
      return res.json({ code: 400, msg: '请传入正确的articleId!' });
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) return res.json({ code: 401, msg: 'token失效' });
      new Promise((resolve, reject) => {
        pool.query(
          'update articleinfo set toTop = ? where articleId = ? ',
          [cancelToTopSign, articleId],
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
  //获取置顶文章
  router.get('/getTopArticleInfo', (req, res, next) => {
    const articleInfoList = [];
    new Promise((resolve, reject) => {
      //获取文章基本信息
      const sql = `select * from articleinfo where toTop !='${cancelToTopSign}' order by toTop DESC`;
      pool.query(sql, (err, dataForArticleinfo) => {
        if (err) return reject(err);
        const promiseArr = dataForArticleinfo.map((item, index) => {
          articleInfoList.push(item);
          //获取文章标签
          return new Promise((resolve) => {
            pool.query(
              'select folderName from folder where folderId = ?',
              [item.folderId],
              (err, dataForfolder) => {
                if (err) return reject(err);
                articleInfoList[index].folderName = dataForfolder[0].folderName;
                pool.query(
                  'select * from articletotag where articleId = ?',
                  [item.articleId],
                  (err, dataForArticletotag) => {
                    if (err) return reject(err);
                    articleInfoList[index].tags = [];
                    const promiseArr = dataForArticletotag.map((item) => {
                      return new Promise((resolve) => {
                        pool.query(
                          'select * from tags where tagName = ?',
                          [item.tagName],
                          (err, dataForTags) => {
                            if (err) return reject(err);
                            articleInfoList[index].tags.push(dataForTags[0]);
                            resolve(1);
                          },
                        );
                      });
                    });
                    Promise.all(promiseArr).then(() => {
                      resolve(1);
                    });
                  },
                );
              },
            );
          });
        });
        Promise.all(promiseArr).then(() => {
          resolve(1);
        });
      });
    }).then(
      () => {
        res.json({ code: 200, data: articleInfoList });
      },
      (err) => {
        custom.log(err);
        res.json({ code: 500, msg: '服务器出错' });
      },
    );
  });
  //搜索文章
  router.get('/search', async (req, res, next) => {
    const { searchText, page, limit } = req.query;
    if (!searchText)
      return res.json({
        code: 200,
        data: { articleInfoList: [], total: 0, pages: 0 },
      });
    const records = await redisClient.HGETALL('articleInfo');
    const articleInfos = [];
    for (let key in records) {
      articleInfos.push(JSON.parse(records[key]));
    }
    articleInfos.sort((a, b) => b.VT - a.VT);
    const articleInfoList = articleInfos.filter((articleInfo) => {
      return articleInfo.title.toLowerCase().includes(searchText.toLowerCase());
    });
    const start = (page - 1) * limit;
    const end = page * limit;
    const result = {};
    result.pages = Math.ceil(articleInfoList.length / limit) || 1;
    result.total = articleInfoList.length;
    if (page > result.pages)
      return res.json({ code: 400, msg: 'page超过最大页数' });
    result.articleInfoList = articleInfoList.slice(start, end);
    return res.json({ code: 200, data: result });
  });
  //随机文章
  router.get('/getRandomArticle', async (req, res, next) => {
    const { limit } = req.query;
    const records = await redisClient.HGETALL('articleInfo');
    const articleInfos = [];
    for (let key in records) {
      articleInfos.push(JSON.parse(records[key]));
    }
    const indexArr = [];
    while (indexArr.length < limit) {
      const index = Math.floor(Math.random() * articleInfos.length);
      if (indexArr.includes(index)) continue;
      indexArr.push(index);
    }
    const data = indexArr.map((index) => articleInfos[index]);
    return res.json({ code: 200, data });
  });
});

module.exports = router;
