const redis = require('redis')

// 创建 Redis 客户端
const redisClient = redis.createClient({
  url: 'redis://localhost:6379',
  database: 1,
}).on('error', err =>{ 
  console.log('Redis Client Error', err);},
).connect();

module.exports = redisClient;
