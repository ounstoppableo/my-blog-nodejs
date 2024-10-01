const express = require('express');
const multer = require('multer')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const router = express.Router();
const custom = require('../../utils/log')
const publicPath = __dirname + '/../../public'
const uploadImg = multer({ dest: publicPath + '/images/', limits: { fileSize: 1 * 1024 * 1024 } })
const uploadFile = multer({ dest: publicPath + '/temp/', limits: { fileSize: 1 * 1024 * 1024 } })
 //上传图片
 router.post('/uploadImg', uploadImg.single('img'), (req, res, next) => {
    const path = req.file.path
    //有token才能上传
    jwt.verify(req.headers.token, '123456', (err) => {
      if (err) {
        //没token则删除文件
        fs.unlink(path, (err) => {
          if (err) throw err;
          custom.log('文件已删除');
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
          custom.log('文件已删除');
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
      const path = publicPath + req.body.url
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

  module.exports = router;