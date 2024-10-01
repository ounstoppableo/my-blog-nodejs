const express = require('express');
const getClientIp = require('../../utils/getIp')
const redisClient = require('../../redis/connect')
const pool = require('../../mysql/pool')
const sha256 = require('crypto-js/sha256')
const jwt = require('jsonwebtoken')
const custom = require('../../utils/log')

const router = express.Router();

redisClient.then((redisClient) => {
//登录验证
router.post('/login', async (req, res, next) => {
    const ip = getClientIp(req)
    let count = await redisClient.get('ip:' + ip)
    if (count && count >= 3) return res.json({ code: 402, msg: '请求次数过多！' })
    if (count) {
        count = +count + 1
        redisClient.set('ip:' + ip, count, { EX: 60 * 60 * 24 })
    } else {
        count = 1
        redisClient.set('ip:' + ip, count)
    }
    pool.query('SELECT * FROM user', (err, data) => {
        if (err) return res.json({ code: 500, msg: '服务器出错误!' })
        const username = sha256(data[0].username).toString()
        const password = data[0].password
        if (username === req.body.username && password === req.body.password) {
            const token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (30 * 60),
                data: username
            }, '123456')
            redisClient.del('ip:' + ip)
            res.json({ code: 200, token: token })
        } else {
            res.json({ code: 402, msg: `用户名或密码错误，您还有${3 - count}次机会！` })
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
})
module.exports = router;