const pool = require('../mysql/pool')
const sha256 = require('crypto-js/sha256')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const uploadImg = multer({ dest: __dirname + '/../public/images/' })
const uploadMusic = multer({ dest: __dirname + '/../public/music/' })
const uploadFile = multer({ dest: __dirname + '/../public/temp/' })
const fs = require('fs')
const express = require('express');
const { rdmRgbColor } = require('../utils/randomColor')
const router = express.Router();
const mdImgtagToHtmlImgtag = require('../utils/mdImgtagToHtmlImgtag')
const { resolve } = require('path')
const lodash = require('lodash')
const validateInput = require('../utils/validateInput')
const redisClient = require('../redis/connect')
const browserPriority = {
  1: 'Safari',
  2: 'Chrome',
  3: 'Opera',
  4: 'Firefox',
  5: 'Edg',
}

/* GET home page. */
// router.get('/', function (req, res, next) {
//   // fs.readFile('./assets/nodejs入门.md', (err, data) => {
//   //   pool.query('INSERT INTO articledetail SET ?', { articleId: 1, articleContent: data }, function (error, results, fields) {
//   //     if (error) throw error;
//   //     console.log(results)
//   //   })
//   // })
//   pool.query('SELECT * FROM tags', (err, data) => {
//     const tags = ['nodejs', '222'].filter(item => {
//       return data.findIndex(tag => tag.tagName === item) === -1
//     }).map(item => {
//       return {
//         tagName: item,
//         tagColor: randomColor()
//       }
//     })
//     res.json(tags);
//   })
// });
redisClient.then((redisClient)=>{
//登录验证
router.post('/login', (req, res, next) => {
  pool.query('SELECT * FROM user', (err, data) => {
    if (err) return res.json({ code: 500, msg: '服务器出错误!' })
    const username = sha256(data[0].username).toString()
    const password = data[0].password
    if (username === req.body.username && password === req.body.password) {
      const token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (30 * 60),
        data: username
      }, '123456')
      res.json({ code: 200, token: token })
    } else {
      res.json({ code: 402, meg: "用户名或密码错误" })
    }
  })
})
//token验证
router.get('/userInfo', (req, res, next) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) return res.json({ code: 401, msg: 'token失效' })
    return res.json({ code: 200, msg: 'token有效' })
  })
})
//首页文件分类
router.get('/folder', (req, res, next) => {
  pool.query('select * from folder', (err, data) => {
    if (err) return res.json({ code: 500, msg: '服务器出错!' })
    res.json({ code: 200, data: data })
  })
})
//上传图片
router.post('/uploadImg', uploadImg.single('img'), (req, res, next) => {
  const path = req.file.path
  //有token才能上传
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      //没token则删除文件
      fs.unlink(path, (err) => {
        if (err) throw err;
        console.log('文件已删除');
      });
      return res.json({ code: 401, msg: 'token失效' })
    }
    const exName = req.file.mimetype.split('/')[1]
    const filename = req.file.filename
    fs.renameSync(path, path + `.${exName}`)
    res.json({ code: 200, data: `/images/${filename}.${exName}` })
  })
})
//上传文件
router.post('/uploadFile', uploadFile.any(), (req, res, next) => {
  const path = req.files[0].path
  //有token才能上传
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      //没token删除文件
      fs.unlink(path, (err) => {
        if (err) throw err;
        console.log('文件已删除');
      });
      return res.json({ code: 401, msg: 'token失效' })
    }
    const fileName = req.files[0].filename
    res.json({ code: 200, data: `/temp/${fileName}` })
  })
})
//文件删除
router.delete('/delFile', (req, res, next) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) res.json({ code: 401, msg: 'token失效' })
    const path = __dirname + '/../public' + req.body.url
    new Promise((resolve, reject) => {
      fs.unlink(path, (err) => {
        if (err) return reject(err)
        resolve(1)
      })
    }).then(() => {
      res.json({ code: 200, msg: '删除成功' })
    }, () => {
      res.json({ code: 500, msg: '服务器错误' })
    })
  })
})
//添加文章
router.post('/addArticle', (req, res, next) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) return res.json({ code: 401, msg: 'token失效' })
    const { articleId, title, folderId, description, articleUrl, backImgUrl, listOfTagOptions } = req.body
    const date = moment(new Date()).format('YYYY-MM-DD')
    const fileUrl = __dirname + '/../public' + articleUrl
    //先把文章读取出来
    new Promise((finalResolve, reject) => {
      fs.readFile(fileUrl, (err, fileData) => {
        if (err) return reject(err)
        fileData = mdImgtagToHtmlImgtag(fileData.toString())
        if (!articleId) {
          const newArticleId = uuidv4()
          //先更新文章信息表，有了articleId再进行文章内容表的更新
          pool.query('INSERT INTO articleinfo SET ?', { articleId: newArticleId, title, folderId, subTime: date, lastModifyTime: date, description, backImgUrl, VT: 0 }, (err) => {
            if (err) return reject(err)
            //文章内容表的更新
            pool.query('INSERT INTO articledetail SET ?', { articleId: newArticleId, articleContent: fileData }, (err) => {
              if (err) return reject(err)
              //tags表的更新
              pool.query('select * from tags', (err, data) => {
                if (err) return reject(err)
                const tags = listOfTagOptions.filter(item => {
                  return data.findIndex(tag => tag.tagName === item) === -1
                }).map(item => {
                  return {
                    tagName: item,
                    tagColor: rdmRgbColor()
                  }
                })
                const promiseArr = tags.map(item => {
                  return new Promise((resolve) => {
                    pool.query('insert into tags set ?', item, (err) => {
                      if (err) return reject(err)
                      resolve(1)
                    })
                  })
                })
                Promise.all(promiseArr).then(() => {
                  //tags表更新后接着更新articleToTags表
                  const promiseArr = listOfTagOptions.map(item => {
                    return new Promise((resolve) => {
                      pool.query('insert into articletotag set ?', { articleId: newArticleId, tagName: item }, (err) => {
                        if (err) return reject(err)
                        resolve(1)
                      })
                    })
                  })
                  Promise.all(promiseArr).then(() => {
                    finalResolve(1)
                  })
                })
              })
              //更新完删除本地存储
              fs.unlink(fileUrl, (err) => {
                if (err) throw err;
                console.log('文件已删除');
              });
            })
          })
        }
      })
    }).then(() => {
      res.json({ code: 200, msg: '添加成功' })
    }, () => {
      res.json({ code: 500, msg: '服务器出错' })
    })
  })
})
//获取标签
router.get('/getTags', (req, res, next) => {
  new Promise((resolve, reject) => {
    pool.query('select * from tags', (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  }).then((data) => {
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
})
//获取文章信息
router.get('/getArticleInfo', (req, res, next) => {
  const articleInfoList = []
  new Promise((resolve, reject) => {
    //获取文章基本信息
    const sql = `select * from articleinfo order by lastModifyTime DESC`
    pool.query(sql, (err, dataForArticleinfo) => {
      if (err) return reject(err)
      const promiseArr = dataForArticleinfo.map((item, index) => {
        articleInfoList.push(item)
        //获取文章标签
        return new Promise((resolve) => {
          pool.query('select folderName from folder where folderId = ?', [item.folderId], (err, dataForfolder) => {
            if (err) return reject(err)
            articleInfoList[index].folderName = dataForfolder[0].folderName
            pool.query('select * from articletotag where articleId = ?', [item.articleId], (err, dataForArticletotag) => {
              if (err) return reject(err)
              articleInfoList[index].tags = []
              const promiseArr = dataForArticletotag.map(item => {
                return new Promise((resolve) => {
                  pool.query('select * from tags where tagName = ?', [item.tagName], (err, dataForTags) => {
                    if (err) return reject(err)
                    articleInfoList[index].tags.push(dataForTags[0])
                    resolve(1)
                  })
                })
              })
              Promise.all(promiseArr).then(() => { resolve(1) })
            })
          })
        })
      })
      Promise.all(promiseArr).then(() => { resolve(1) })
    })
  }).then(() => {
    res.json({ code: 200, data: articleInfoList })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
}
)
//获取文章内容
router.get('/getArticle/:articleId', (req, res, next) => {
  const { articleId } = req.params
  new Promise((finalResolve, finalReject) => {
    pool.query('select * from articledetail where articleId = ?', [articleId], (err, data) => {
      if (err) return finalReject(err)
      finalResolve(data[0])
    })
  }).then((data) => {
    res.json({ code: 200, data })
  }, (err) => {
    res.json({ code: 500, msg: '服务器错误' })
  })
})
//获取文章信息通过文章id
router.get('/getArticleInfo/:articleId', (req, res, next) => {
  const { articleId } = req.params
  const articleInfoList = []
  //设置访问量
  pool.query('select VT from articleinfo where articleId = ?', [articleId], (err, data) => {
    const VT = data[0].VT
    pool.query('update articleinfo set VT=? where articleId = ?', [VT + 1, articleId], (err) => {
      if (err) console.log(err)
    })
  })
  new Promise((resolve, reject) => {
    //获取文章基本信息
    const sql = `select * from articleinfo where articleId = ? order by subTime DESC`
    pool.query(sql, [articleId], (err, dataForArticleinfo) => {
      if (err) return reject(err)
      const promiseArr = dataForArticleinfo.map((item, index) => {
        articleInfoList.push(item)
        //获取文章标签
        return new Promise((resolve) => {
          pool.query('select folderName from folder where folderId = ?', [item.folderId], (err, dataForfolder) => {
            if (err) return reject(err)
            articleInfoList[index].folderName = dataForfolder[0].folderName
            pool.query('select * from articletotag where articleId = ?', [item.articleId], (err, dataForArticletotag) => {
              if (err) return reject(err)
              articleInfoList[index].tags = []
              const promiseArr = dataForArticletotag.map(item => {
                return new Promise((resolve) => {
                  pool.query('select * from tags where tagName = ?', [item.tagName], (err, dataForTags) => {
                    if (err) return reject(err)
                    articleInfoList[index].tags.push(dataForTags[0])
                    resolve(1)
                  })
                })
              })
              Promise.all(promiseArr).then(() => { resolve(1) })
            })
          })
        })
      })
      Promise.all(promiseArr).then(() => { resolve(1) })
    })
  }).then(() => {
    res.json({ code: 200, data: articleInfoList[0] })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
}
)
//更新文章
router.post('/updateArticle', (req, res, next) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) return res.json({ code: 401, msg: 'token失效' })
    const { articleId, title, folderId, description, articleUrl, backImgUrl, listOfTagOptions } = req.body
    // if (!articleId || !title || !folderId || !description || !articleUrl || !backImgUrl || listOfTagOptions.length === 0) return res.json({ code: 400, msg: '字段不全' })
    const date = moment(new Date()).format('YYYY-MM-DD')
    const fileUrl = __dirname + '/../public' + articleUrl
    //先把文章读取出来
    new Promise((finalResolve, reject) => {
      fs.readFile(fileUrl, (err, fileData) => {
        if (err) return reject(err)
        fileData = mdImgtagToHtmlImgtag(fileData.toString())
        //先更新文章信息表，有了articleId再进行文章内容表的更新
        pool.query('update articleinfo SET ? where articleId = ?', [{ title, folderId, lastModifyTime: date, description, backImgUrl }, articleId], (err) => {
          if (err) return reject(err)
          //文章内容表的更新
          pool.query('update articledetail SET ? where articleId = ?', [{ articleContent: fileData }, articleId], (err) => {
            if (err) return reject(err)
            //tags表的更新
            pool.query('select * from tags', (err, data) => {
              if (err) return reject(err)
              const tags = listOfTagOptions.filter(item => {
                return data.findIndex(tag => tag.tagName === item) === -1
              }).map(item => {
                return {
                  tagName: item,
                  tagColor: rdmRgbColor()
                }
              })
              const promiseArr = tags.map(item => {
                return new Promise((resolve) => {
                  pool.query('insert into tags set ?', item, (err) => {
                    if (err) return reject(err)
                    resolve(1)
                  })
                })
              })
              Promise.all(promiseArr).then(() => {
                //tags表更新后接着更新articleToTags表
                pool.query('select * from articletotag where articleId = ?', [articleId], (err, data) => {
                  if (err) return reject(err)
                  const needDelTags = data.filter(item => listOfTagOptions.findIndex(tagName => tagName === item.tagName) === -1).map(item => item.tagName)
                  const needAddTags = listOfTagOptions.filter(tagName => data.findIndex(item => item.tagName === tagName) === -1)
                  const promiseArr1 = needDelTags.map(item => {
                    return new Promise((resolve) => {
                      pool.query('delete from articletotag where articleId = ? and tagName=?', [articleId, item], (err) => {
                        if (err) return reject(err)
                        resolve(1)
                      })
                    })
                  })
                  const promiseArr2 = needAddTags.map(item => {
                    return new Promise((resolve) => {
                      pool.query('insert into articletotag set ?', { articleId, tagName: item }, (err) => {
                        if (err) return reject(err)
                        resolve(1)
                      })
                    })
                  })
                  Promise.all([...promiseArr1, ...promiseArr2]).then(() => {
                    finalResolve(1)
                  })
                })
              })
            })
            //更新完删除本地存储
            fs.unlink(fileUrl, (err) => {
              if (err) throw err;
              console.log('文件已删除');
            });
          })
        })

      })
    }).then(() => {
      res.json({ code: 200, msg: '更新成功' })
    }, (err) => {
      console.log(err)
      res.json({ code: 500, msg: '服务器出错' })
    })
  })
})
//删除文章
router.get('/delArticle/:articleId', (req, res, next) => {
  new Promise((resolve, reject) => {
    const { articleId } = req.params
    pool.query('delete from articleinfo where articleId = ?', articleId, (err) => {
      if (err) return reject(err)
      resolve(1)
    })
  }).then(() => {
    res.json({ code: 200, msg: '删除成功' })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
})
//获取文件夹分类下的文章数量
router.get('/articleInFolderCount', (req, res, next) => {
  new Promise((finalResolve, finalReject) => {
    let result = []
    pool.query('select * from folder', (err, data) => {
      if (err) return finalReject(err)
      result = data
      const promiseArr = result.map(item => {
        return new Promise((resolve) => {
          pool.query('select COUNT(*) from articleinfo where folderId = ?', item.folderId, (err, data) => {
            if (err) return finalReject(err)
            item.count = data[0]['COUNT(*)']
            resolve(1)
          })
        })
      })
      Promise.all(promiseArr).then(() => {
        finalResolve(result)
      })
    })
  }).then((data) => {
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器错误' })
  })
})
//单个文件夹对应的文章信息页
router.get('/singleFolder/:folderId/:page/:limit', (req, res, next) => {
  const { folderId, page, limit } = req.params
  if (page <= 0 || limit <= 0) return res.json({ code: 400, msg: 'page或limit有误' })
  const result = {}
  new Promise((finalResolve, finalReject) => {
    pool.query('select * from articleinfo where folderId = ? order by lastModifyTime DESC', folderId, (err, data) => {
      if (err) return finalReject(err)
      result.articleInfos = data
      pool.query('select folderName from folder where folderId = ?', folderId, (err, data) => {
        if (err) return finalReject(err)
        result.folderName = data[0].folderName
        result.articleInfos.forEach(item => item.folderName = result.folderName)
        const promiseArr = result.articleInfos.map(item => {
          return new Promise((resolve) => {
            pool.query('select * from articletotag where articleId = ? ', item.articleId, (err, data) => {
              if (err) return finalReject(err)
              item.tags = data
              const promiseArr2 = item.tags.map(tag => {
                return new Promise((resolve2) => {
                  pool.query('select tagColor from tags where tagName = ?', tag.tagName, (err, data) => {
                    if (err) return finalReject(err)
                    tag.tagColor = data[0].tagColor
                    resolve2(1)
                  })
                })
              })
              Promise.all(promiseArr2).then(() => resolve(1))
            })
          })
        })
        Promise.all(promiseArr).then(() => { finalResolve(result) })
      })
    })
  }).then((data) => {
    const start = (page - 1) * limit
    const end = page * limit
    data.total = data.articleInfos.length
    data.pages = Math.ceil(data.articleInfos.length / limit) || 1
    if (page > data.pages) return res.json({ code: 400, msg: 'page超过限制' })
    data.articleInfos = data.articleInfos.slice(start, end)
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器错误' })
  })
})
//获取标签分类下的文章数量
router.get('/articleInTagCount', (req, res, next) => {
  new Promise((finalResolve, finalReject) => {
    let result = []
    pool.query('select * from tags', (err, data) => {
      if (err) return finalReject(err)
      result = data
      const promiseArr = result.map(item => {
        return new Promise((resolve) => {
          pool.query('select COUNT(*) from articletotag where tagName = ?', item.tagName, (err, data) => {
            if (err) return finalReject(err)
            item.count = data[0]['COUNT(*)']
            resolve(1)
          })
        })
      })
      Promise.all(promiseArr).then(() => finalResolve(result))
    })
  }).then((data) => {
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器错误' })
  })
})
//单个标签对应的文章信息页
router.get('/singleTag/:tagName/:page/:limit', (req, res, next) => {
  const { tagName, page, limit } = req.params
  if (page <= 0 || limit <= 0) return res.json({ code: 400, msg: 'page或limit有误' })
  new Promise((finalResolve, finalReject) => {
    const result = { tagName }
    pool.query('select articleId from articletotag where tagName = ?', tagName, (err, data) => {
      if (err) return finalReject(err)
      result.articleInfos = []
      const promiseArr = data.map(item => {
        return new Promise((resolve) => {
          pool.query('select * from articleinfo where articleId = ?', item.articleId, (err, data) => {
            if (err) return finalReject(err)
            result.articleInfos.push(data[0])
            resolve(1)
          })
        })
      })
      Promise.all(promiseArr).then(() => {
        const promiseArr2 = result.articleInfos.map(item => {
          return new Promise((resolve2) => {
            pool.query('select folderName from folder where folderId = ?', item.folderId, (err, data) => {
              if (err) return finalReject(err)
              item.folderName = data[0].folderName
              resolve2(1)
            })
          })
        })
        const promiseArr3 = result.articleInfos.map(item => {
          return new Promise((resolve3) => {
            pool.query('select * from articletotag where articleId = ?', item.articleId, (err, data) => {
              if (err) return finalReject(err)
              item.tags = data
              const promiseArr4 = item.tags.map(tag => {
                return new Promise((resolve5) => {
                  pool.query('select tagColor from tags where tagName = ?', tag.tagName, (err, data) => {
                    if (err) return finalReject(err)
                    tag.tagColor = data[0].tagColor
                    resolve5(1)
                  })
                })
              })
              Promise.all(promiseArr4).then(() => resolve3(1))
            })
          })
        })
        Promise.all([...promiseArr2, ...promiseArr3]).then(() => finalResolve(result))
      })
    })
  }).then((data) => {
    const start = (page - 1) * limit
    const end = page * limit
    data.total = data.articleInfos.length
    data.pages = Math.ceil(data.articleInfos.length / limit) || 1
    if (page > data.pages) return res.json({ code: 400, msg: 'page超出限制' })
    data.articleInfos = data.articleInfos.slice(start, end)
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
})
//添加留言-文章
router.post('/addMsgForArticle', (req, res, next) => {
  let { name, content, fatherMsgId, articleId, mail, website } = req.body
  name = validateInput(name)
  content = validateInput(content)
  mail =  validateInput(mail)
  website = validateInput(website)
  const subTime = moment(new Date()).format('YYYY-MM-DD hh:mm:ss')
  let avatar = `/avatar/${Math.floor(Math.random() * 9) + 1}.jpg`
  const device = req.headers['user-agent'].match(/\(.*?\)/)[0].slice(1).split(';')[0]
  const ua = req.headers['user-agent'].split(' ')
  let browser = ''
  ua.forEach(item => {
    if (browser) {
      let browserPri = 0
      let itemPri = 0
      Object.keys(browserPriority).forEach(key => {
        if (browser.includes(browserPriority[key])) browserPri = +key
        if (item.includes(browserPriority[key])) itemPri = +key
      })
      if (browserPri < itemPri) browser = item
    } else {
      browser = item
    }
  })
  const upvoke = 0
  new Promise((finalResolve, finalReject) => {
    //查头像
    pool.query('select * from mailmapavatar where mail=?', mail, (err, data) => {
      if (err) return finalReject(err)
      if (data[0]) avatar = data[0].avatar
      else {
        pool.query('insert into mailmapavatar set ?', { mail, avatar }, (err) => {
          if (err) console.log(err)
        })
      }
      pool.query('insert into msgboardforarticle set ?', { name, content, fatherMsgId, articleId, mail, website, avatar, subTime, device, browser, upvoke }, (err) => {
        if (err) return finalReject(err)
        finalResolve()
      })
    })
  }).then(() => {
    res.json({ code: 200, msg: '添加成功' })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
})
//获取留言-文章
router.get('/getMsgForArticle/:articleId/:page/:limit', (req, res, next) => {
  const { articleId, page, limit } = req.params
  let result = {}
  new Promise((finalResolve, finalReject) => {
    pool.query('select * from msgboardforarticle where articleId = ? order by subTime DESC', articleId, (err, data) => {
      if (err) return finalReject(err)
      result.msgData = data
      result.msgCount = data.length
      const map = new Map()
      const promiseArr = data.map(item => {
        return new Promise((resolve) => {
          if (item.fatherMsgId) {
            map.set(item.msgId, true)
            const target = data.find(item2 => +item2.msgId === +item.fatherMsgId)
            item.parent = {
              parentName: target.name,
              parentWebsite: target.website
            }
            target.children ? target.children.push(item) : target.children = [item]
          }
          resolve(1)
        })
      })
      Promise.all(promiseArr).then(() => {
        result.msgData = result.msgData.filter(item => !map.get(item.msgId))
        result.pages = Math.ceil(result.msgData.length / limit) || 1
        if (page > result.pages) {
          finalReject('page超出范围')
        }
        const start = (page - 1) * limit
        const end = limit * page
        result.msgData = result.msgData.slice(start, end)
        finalResolve(result)
      })
    })
  }).then((data) => {
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    if (err === 'page超出范围') res.json({ code: 400, msg: err })
    else res.json({ code: 500, msg: '服务器错误' })
  })
})
//添加留言-留言板
router.post('/addMsgForBoard', (req, res, next) => {
  let { name, content, fatherMsgId, mail, website } = req.body
  name = validateInput(name)
  content = validateInput(content)
  mail =  validateInput(mail)
  website = validateInput(website)
  const subTime = moment(new Date()).format('YYYY-MM-DD hh:mm:ss')
  let avatar = `/avatar/${Math.floor(Math.random() * 9) + 1}.jpg`
  const device = req.headers['user-agent'].match(/\(.*?\)/)[0].slice(1).split(';')[0]
  const ua = req.headers['user-agent'].split(' ')
  let browser = ''
  ua.forEach(item => {
    if (browser) {
      let browserPri = 0
      let itemPri = 0
      Object.keys(browserPriority).forEach(key => {
        if (browser.includes(browserPriority[key])) browserPri = +key
        if (item.includes(browserPriority[key])) itemPri = +key
      })
      if (browserPri < itemPri) browser = item
    } else {
      browser = item
    }
  })
  const upvoke = 0
  new Promise((finalResolve, finalReject) => {
    //查头像
    pool.query('select * from mailmapavatar where mail=?', mail, (err, data) => {
      if (err) return finalReject(err)
      if (data[0]) avatar = data[0].avatar
      else {
        pool.query('insert into mailmapavatar set ?', { mail, avatar }, (err) => {
          if (err) console.log(err)
        })
      }
      pool.query('insert into msgboardforall set ?', { name, content, fatherMsgId, mail, website, avatar, subTime, device, browser, upvoke }, (err) => {
        if (err) return finalReject(err)
        finalResolve()
      })
    })
  }).then(() => {
    res.json({ code: 200, msg: '添加成功' })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
})
//获取留言-留言板
router.get('/getMsgForBoard/:page/:limit', (req, res, next) => {
  const { page, limit } = req.params
  let result = {}
  new Promise((finalResolve, finalReject) => {
    pool.query('select * from msgboardforall order by subTime DESC', (err, data) => {
      if (err) return finalReject(err)
      result.msgData = data
      result.msgCount = data.length
      const map = new Map()
      const promiseArr = data.map(item => {
        return new Promise((resolve) => {
          if (item.fatherMsgId) {
            map.set(item.msgId, true)
            const target = data.find(item2 => +item2.msgId === +item.fatherMsgId)
            item.parent = {
              parentName: target.name,
              parentWebsite: target.website
            }
            target.children ? target.children.push(item) : target.children = [item]
          }
          resolve(1)
        })
      })
      Promise.all(promiseArr).then(() => {
        result.msgData = result.msgData.filter(item => !map.get(item.msgId))
        result.pages = Math.ceil(result.msgData.length / limit) || 1
        if (page > result.pages) {
          finalReject('page超出范围')
        }
        const start = (page - 1) * limit
        const end = limit * page
        result.msgData = result.msgData.slice(start, end)
        finalResolve(result)
      })
    })
  }).then((data) => {
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    if (err === 'page超出范围') res.json({ code: 400, msg: err })
    else res.json({ code: 500, msg: '服务器错误' })
  })
})
//获取文章信息-分页
router.get('/getArticleInfoByPage/:page/:limit', (req, res, next) => {
  const { page, limit } = req.params
  if (page <= 0 || limit <= 0) return res.json({ code: 400, msg: 'page或limit有误' })
  const articleInfoList = []
  new Promise((resolve, reject) => {
    //获取文章基本信息
    const sql = `select * from articleinfo order by lastModifyTime DESC`
    pool.query(sql, (err, dataForArticleinfo) => {
      if (err) return reject(err)
      const promiseArr = dataForArticleinfo.map((item, index) => {
        articleInfoList.push(item)
        //获取文章标签
        return new Promise((resolve) => {
          pool.query('select folderName from folder where folderId = ?', [item.folderId], (err, dataForfolder) => {
            if (err) return reject(err)
            articleInfoList[index].folderName = dataForfolder[0].folderName
            pool.query('select * from articletotag where articleId = ?', [item.articleId], (err, dataForArticletotag) => {
              if (err) return reject(err)
              articleInfoList[index].tags = []
              const promiseArr = dataForArticletotag.map(item => {
                return new Promise((resolve) => {
                  pool.query('select * from tags where tagName = ?', [item.tagName], (err, dataForTags) => {
                    if (err) return reject(err)
                    articleInfoList[index].tags.push(dataForTags[0])
                    resolve(1)
                  })
                })
              })
              Promise.all(promiseArr).then(() => { resolve(1) })
            })
          })
        })
      })
      Promise.all(promiseArr).then(() => { resolve(1) })
    })
  }).then(() => {
    const start = (page - 1) * limit
    const end = page * limit
    const result = {}
    result.pages = Math.ceil(articleInfoList.length / limit) || 1
    result.total = articleInfoList.length
    if (page > result.pages) return res.json({ code: 400, msg: 'page超过最大页数' })
    result.articleInfoList = articleInfoList.slice(start, end)
    res.json({ code: 200, data: result })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
}
)
//点赞功能-文章
router.get('/upvokeForArticle/:articleId/:msgId/:checked', (req, res, next) => {
  const { articleId, msgId, checked } = req.params
  new Promise((finalResolve, finalReject) => {
    pool.query('select upvoke from msgboardforarticle where articleId=? and msgId = ?', [articleId, msgId], (err, data) => {
      if (err) return finalReject(err)
      const upvokeCount = data[0].upvoke
      pool.query('update msgboardforarticle set upvoke = ? where articleId=? and msgId = ?', [+checked === 1 ? upvokeCount + 1 : upvokeCount - 1, articleId, msgId], (err) => {
        if (err) return finalReject(err)
        finalResolve(1)
      })
    })

  }).then(() => {
    res.json({ code: 200, msg: '点赞成功' })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器错误' })
  })
})
//点赞功能-留言板
router.get('/upvokeForBoard/:msgId/:checked', (req, res, next) => {
  const { msgId, checked } = req.params
  new Promise((finalResolve, finalReject) => {
    pool.query('select upvoke from msgboardforall where msgId = ?', [msgId], (err, data) => {
      if (err) return finalReject(err)
      const upvokeCount = data[0].upvoke
      pool.query('update msgboardforall set upvoke = ? where msgId = ?', [+checked === 1 ? upvokeCount + 1 : upvokeCount - 1, msgId], (err) => {
        if (err) return finalReject(err)
        finalResolve(1)
      })
    })

  }).then(() => {
    res.json({ code: 200, msg: '点赞成功' })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器错误' })
  })
})
//获取前一个文章和后一个文章
router.get('/preAndNextArticle/:articleId', (req, res, next) => {
  new Promise((finalResolve, finalReject) => {
    const { articleId } = req.params
    pool.query('select articleId,title from articleinfo order by lastModifyTime DESC', (err, data) => {
      if (err) return finalReject(err)
      const index = data.findIndex(item => item.articleId === articleId)
      const result = {
        pre: index > 0 ? data[index - 1].articleId : '',
        preTitle: index > 0 ? data[index - 1].title : '',
        next: index < data.length - 1 ? data[index + 1].articleId : '',
        nextTitle: index < data.length - 1 ? data[index + 1].title : '',
      }
      finalResolve(result)
    })
  }).then((data) => {
    res.json({ code: 200, data })
  }, (err) => {
    console.log(err)
    res.json({ code: 500, msg: '服务器出错' })
  })
})


//上传音乐
router.post('/uploadMusic', uploadMusic.single('music'), (req, res) => {
  const path = req.file.path
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      //没token则删除文件
      fs.unlink(path, (err) => {
        if (err) throw err;
        console.log('文件已删除');
      });
      return res.json({ code: 401, msg: 'token失效' })
    }
    const exName = 'mp3'
    const filename = req.file.filename
    fs.renameSync(path, path + `.${exName}`)
    res.json({ code: 200, msg: '音乐上传成功', url: `${filename}.mp3` })
  })
})
//删除音乐
router.get('/deleteMusic/:path', (req, res) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' })
    }
    const path = resolve(__dirname, '../public/music', req.params.path)
    fs.unlink(path, (err) => {
      if (err) {
        console.log(err)
        return res.json({ code: 500, msg: '删除失败' })
      }
      console.log('文件已删除');
      res.json({ code: 200, msg: '删除成功' })
    });
  })
})
//上传歌词
router.post('/uploadLyric', uploadFile.single('lyric'), (req, res) => {
  const path = req.file.path
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      //没token则删除文件
      fs.unlink(path, (err) => {
        if (err) throw err;
        console.log('文件已删除');
      });
      return res.json({ code: 401, msg: 'token失效' })
    }
    const filename = req.file.filename
    res.json({ code: 200, msg: '歌词上传成功', url: `${filename}` })
  })
})
//删除歌词
router.get('/deleteLyric/:path', (req, res) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' })
    }
    const path = resolve(__dirname + '/../public/temp/' + req.params.path)
    fs.unlink(path, (err) => {
      if (err) {
        console.log(err)
        return res.json({ code: 500, msg: '删除失败' })
      }
      console.log('文件已删除');
      res.json({ code: 200, msg: '删除成功' })
    });
  })
})
//添加音乐信息
router.post('/addMusic', (req, res) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' })
    }
    const param = req.body
    const path = resolve(__dirname, '../public/temp', param.lyricUrl)
    new Promise((resolve, reject) => {
      const lyric = param.lyricUrl ? fs.readFileSync(path).toString() : ''
      pool.query('insert into music set picUrl=?,lyric=?,musicUrl=?,musicName=?,musicAuthor=?', [param.picUrl, lyric, param.musicUrl, param.musicName, param.musicAuthor], (err, data) => {
        if (err) {
          console.log(err)
          return reject('服务器错误')
        }
        resolve('上传成功')
      })
    }).then((data) => {
      res.json({ code: 200, msg: data })
    }, (err) => {
      res.json({ code: 500, msg: err })
    }).finally(() => {
      fs.unlink(path, (err) => {
        if (err) console.log(err)
      })
    })
  })
})
//获取音乐信息
router.get('/getMusicInfo', (req, res) => {
  pool.query('select * from music', (err, data) => {
    if (err) {
      console.log(err)
      res.json({ code: 500, msg: '获取音乐失败' })
    }
    res.json({ code: 200, msg: '获取音乐成功', result: data })
  })
})
//网站浏览次数监控
router.get('/viewTimes', (req, res) => {
  pool.query('select * from siteInfo', (err, data) => {
    if (err) {
      console.log(err)
      return res.json({ code: 200, VT: 0 })
    }
    const VT = data[0].VT
    res.json({ code: 200, VT })
    pool.query('update siteInfo set VT = ?', [VT + 1], (err) => {
      console.log(err)
    })
  })
})
})


module.exports = router;
