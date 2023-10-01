const pool = require('../mysql/pool')
const sha256 = require('crypto-js/sha256')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const uploadImg = multer({ dest: __dirname + '/../public/images/' })
const uploadFile = multer({ dest: __dirname + '/../public/temp/' })
const fs = require('fs')
const express = require('express');
const { rdmRgbColor } = require('../utils/randomColor')
const { resolve } = require('path')
const router = express.Router();


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
        if (!articleId) {
          const newArticleId = uuidv4()
          //先更新文章信息表，有了articleId再进行文章内容表的更新
          pool.query('INSERT INTO articleinfo SET ?', { articleId: newArticleId, title, folderId, subTime: date, lastModifyTime: date, description, backImgUrl }, (err) => {
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
    pool.query('select * from articleinfo order by subTime DESC', (err, dataForArticleinfo) => {
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
module.exports = router;
