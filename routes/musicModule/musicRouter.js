const express = require('express');
const { loadMusicMetadata } = require('music-metadata');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const pool = require('../../mysql/pool');
const { resolve } = require('path');
const custom = require('../../utils/log');
const dayjs = require('dayjs');
const router = express.Router();
const publicPath = __dirname + '/../../public';
const uploadMusic = multer({
  dest: publicPath + '/music/',
  limits: { fileSize: 20 * 1024 * 1024 },
});
const uploadFile = multer({
  dest: publicPath + '/temp/',
  limits: { fileSize: 1 * 1024 * 1024 },
});

//上传音乐
router.post('/uploadMusic', uploadMusic.single('music'), (req, res) => {
  const path = req.file.path;
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      //没token则删除文件
      fs.unlink(path, (err) => {
        if (err) throw err;
        custom.log('文件已删除');
      });
      return res.json({ code: 401, msg: 'token失效' });
    }
    const exName = 'mp3';
    const filename = req.file.filename;
    fs.renameSync(path, path + `.${exName}`);
    res.json({ code: 200, msg: '音乐上传成功', url: `${filename}.mp3` });
  });
});
//删除音乐
router.get('/deleteMusic/:path', (req, res) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' });
    }
    const path = resolve(publicPath, 'music', req.params.path);
    fs.unlink(path, (err) => {
      if (err) {
        custom.log(err);
        return res.json({ code: 500, msg: '删除失败' });
      }
      custom.log('文件已删除');
      res.json({ code: 200, msg: '删除成功' });
    });
  });
});
//上传歌词
router.post('/uploadLyric', uploadFile.single('lyric'), (req, res) => {
  const path = req.file.path;
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      //没token则删除文件
      fs.unlink(path, (err) => {
        if (err) throw err;
        custom.log('文件已删除');
      });
      return res.json({ code: 401, msg: 'token失效' });
    }
    const filename = req.file.filename;
    res.json({ code: 200, msg: '歌词上传成功', url: `${filename}` });
  });
});
//删除歌词
router.get('/deleteLyric/:path', (req, res) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' });
    }
    const path = resolve(publicPath, 'temp', req.params.path);
    fs.unlink(path, (err) => {
      if (err) {
        custom.log(err);
        return res.json({ code: 500, msg: '删除失败' });
      }
      custom.log('文件已删除');
      res.json({ code: 200, msg: '删除成功' });
    });
  });
});
//添加音乐信息
router.post('/addMusic', (req, res) => {
  jwt.verify(req.headers.token, '123456', (err) => {
    if (err) {
      return res.json({ code: 401, msg: 'token失效' });
    }
    const param = req.body;
    const path = resolve(publicPath, 'temp', param.lyricUrl);
    const musicPath = resolve(publicPath, 'music', param.musicUrl);
    new Promise(async (resolve, reject) => {
      const lyric = param.lyricUrl ? fs.readFileSync(path).toString() : '';
      const mm = await loadMusicMetadata();
      const metadata = await mm.parseFile(musicPath);
      const musicTime = metadata.format.duration;
      pool.query(
        'insert into music set picUrl=?,lyric=?,musicUrl=?,musicName=?,musicAuthor=?,musicTime=?,sort=?',
        [
          param.picUrl,
          lyric,
          param.musicUrl,
          param.musicName,
          param.musicAuthor,
          musicTime,
          dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')
        ],
        (err, data) => {
          if (err) {
            custom.log(err);
            return reject('服务器错误');
          }
          resolve('上传成功');
        },
      );
    })
      .then(
        (data) => {
          res.json({ code: 200, msg: data });
        },
        (err) => {
          res.json({ code: 500, msg: err });
        },
      )
      .finally(() => {
        fs.unlink(path, (err) => {
          if (err) custom.log(err);
        });
      });
  });
});
//获取音乐信息
router.get('/getMusicInfo', (req, res) => {
  pool.query('select * from music', (err, data) => {
    if (err) {
      custom.log(err);
      res.json({ code: 500, msg: '获取音乐失败' });
    }
    res.json({
      code: 200,
      msg: '获取音乐成功',
      result: data.sort((a, b) => dayjs(b.sort).unix() - dayjs(a.sort).unix()),
    });
  });
});

module.exports = router;
