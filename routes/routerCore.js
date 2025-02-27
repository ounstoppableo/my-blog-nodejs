const loginRouter = require('./loginModule/loginRouter');
const uploadRouter = require('./uploadModule/uploadRouter');
const articleRouter = require('./blogLogicModule/articleRouter');
const userInteractionRouter = require('./blogLogicModule/userInteractionRouter');
const musicRouter = require('./musicModule/musicRouter');
const burialPointRouter = require('./serverInfoModule/burialPointRouter');
const serverBaseInfoRouter = require('./serverInfoModule/serverBaseInfoRouter');
const outerApiRouter = require('./outerApiModule/outerApiRouter');
const bookRouter = require('./bookLogicModule/bookRouter');
const friendRouter = require('./friendLogicModule/friendRouter');
const treeHoleRouter = require('./treeHoleModule/treeHoleRouter');

const express = require('express');
const router = express.Router();
const redisClient = require('../redis/connect');

/* GET home page. */
redisClient.then((redisClient) => {
  router.use('/', loginRouter);
  router.use('/', uploadRouter);
  router.use('/', articleRouter);
  router.use('/', userInteractionRouter);
  router.use('/', musicRouter);
  router.use('/', burialPointRouter);
  router.use('/', serverBaseInfoRouter);
  router.use('/', outerApiRouter);
  router.use('/', bookRouter);
  router.use('/', friendRouter);
  router.use('/', treeHoleRouter);
});

module.exports = router;
