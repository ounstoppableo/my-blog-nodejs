## 这是一个blog后端系统

主要用于支持my-blog前端项目的动态取值

### 构建流程

#### 数据库的创建

这里使用的是mysql+数据库图形化工具DBeaver

##### 数据库结构搭建

- articleinfo表

  用于记录article的基本信息

  基本字段：

  <img src=".\images\QQ截图20230925172808.png" style="margin:0" />

- folder表

  用于记录文档的信息

  基本字段：

  <img src=".\images\QQ截图20230925172936.png" style="margin:0" />

- articleDetail表

  用于记录实际文章的信息

  基本字段：

  <img src=".\images\QQ截图20230925172959.png" style="margin:0" />

- tags表

  用于记录tag标签的信息

  基本字段：

  <img src=".\images\QQ截图20230925173221.png" style="margin:0" />

- articleToTag表

  用于进行article与tag的映射

  基本字段：

  <img src=".\images\QQ截图20230925173255.png" style="margin:0" />

##### nodejs进行数据库连接

~~~javascript
const mysql = require('mysql')
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost:3306',
    user: 'root',
    password: 'woaini121',
    database: 'myblog'
});
module.exports = pool
//外部直接使用pool.xxx就可以直接进行数据库查询
//例如：
pool.query('SELECT * FROM articleinfo', function (error, results, fields) {
    if (error) throw error;
    console.log(results)
})
~~~

**小坑：**

> 当我们进行数据库连接时，可能会出现1251错误：Client does not support authentication protocol requested by server; consider upgrading MySQL client
>
> 这是因为mysql8.0以上版本使用的密码编码方式与原来不同，nodejs的mysql包还没更新
>
> 解决方式：
>
> ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ’你的密码';
>
> 如果执行出错，则输入：
>
> ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY ’你的密码';

