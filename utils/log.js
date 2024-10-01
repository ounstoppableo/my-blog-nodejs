const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

const custom = {};
custom.log = (...args) => {
  console.log(...args);
  const day = dayjs(new Date()).format('YYYY-MM-DD');
  const time = dayjs(new Date()).format('HH:mm:ss');
  // 创建可写流
  const writeStream = fs.createWriteStream(
    path.resolve(__dirname, `../logs/${day}.txt`),
    { flags: 'a' },
  );
  writeStream.write(time + ':' + '\n', 'utf-8');
  // 将数据写入流
  args.forEach((item) => {
    writeStream.write(item + '\n', 'utf8');
  });
  writeStream.write('\n', 'utf8');
  writeStream.end();
  return undefined;
};
module.exports = custom;
