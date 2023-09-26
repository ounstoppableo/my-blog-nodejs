const pool = require('../mysql/pool')
const sha256 = require('crypto-js/sha256')
const jwt = require('jsonwebtoken')
const fs = require('fs')
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {


  // fs.readFile('./assets/nodejs入门.md', (err, data) => {
  //   pool.query('INSERT INTO articledetail SET ?', { articleId: 1, articleContent: data }, function (error, results, fields) {
  //     if (error) throw error;
  //     console.log(results)
  //   })
  // })
  pool.query('SELECT * FROM articledetail', (err, data) => {
    const { articleId, articleContent } = data[0]
    res.json({ articleId, articleContent });
  })
});
//登录验证
router.post('/login', (req, res, next) => {
  const username = 'eb72dccb4540dca6c99ea0beff354aa7c5f9edf5978bb686866c18ef7cfc5957'
  const password = '6f11e544a4fc4078746c253517a399f0080e6d1db4015af8e9c26d92c4bd032c'
  if (username === req.body.username && password === req.body.password) {
    const token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (30 * 60),
      data: username
    }, '123456')
    res.json({ code: 200, token: token })
  } else {
    res.json({ code: 401, meg: "用户名或密码错误" })
  }

})
//token验证
router.get('/userInfo', (req, res, next) => {
  jwt.verify(req.headers.token,'123456',(err)=>{
    if(err) return res.json({code: 401,msg:'token失效'})
    return res.json({code: 200,msg:'token有效'})
  })
})
module.exports = router;
