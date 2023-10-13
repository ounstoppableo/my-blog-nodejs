const mysql = require('mysql')
const pool = mysql.createPool({
    connectionLimit: 10,
    host: '0.0.0.0',
    port: '3306',
    user: 'root',
    password: '你的密码',
    database: 'myblog'
});
module.exports = pool 