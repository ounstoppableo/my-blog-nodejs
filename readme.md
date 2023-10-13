## 这是一个blog后端系统

主要用于支持my-blog前端项目的动态取值

### 构建流程

#### 数据库的创建

这里使用的是mysql+数据库图形化工具DBeaver

##### 数据库结构搭建

- articleinfo表

  用于记录article的基本信息

  ER关系：

  ![](.\images\Snipaste_2023-10-02_16-49-18.png)

  | 列名           | 数据类型 | 主键 | 外键 |
  | -------------- | -------- | ---- | ---- |
  | articleId      | varchar  | √    |      |
  | title          | varchar  |      |      |
  | subTime        | datetime |      |      |
  | lastModifyTime | datetime |      |      |
  | folderId       | varchar  |      | √    |
  | description    | varchar  |      |      |
  | backImgUrl     | varchar  |      |      |

- folder表

  用于记录文档的信息

  ER关系：

  ![](.\images\Snipaste_2023-10-02_16-47-49.png)

  | 列名       | 数据类型 | 主键 | 外键 |
  | ---------- | -------- | ---- | ---- |
  | folderId   | varchar  | √    |      |
  | folderName |          |      |      |

- articleDetail表

  用于记录实际文章的信息

  ER关系：

  ![](.\images\Snipaste_2023-10-02_16-48-43.png)

  | 列名           | 数据类型   | 主键 | 外键 |
  | -------------- | ---------- | ---- | ---- |
  | articleId      | varchar    | √    | √    |
  | articleContent | mediumtext |      |      |

- tags表

  用于记录tag标签的信息

  ER关系：

  ![](.\images\Snipaste_2023-10-02_16-51-00.png)

  | 列名     | 数据类型 | 主键 | 外键 |
  | -------- | -------- | ---- | ---- |
  | tagName  | varchar  | √    |      |
  | tagColor | varchar  |      |      |

- articleToTag表

  用于进行article与tag的映射

  ER关系：

  ![](.\images\Snipaste_2023-10-04_17-07-05.png)
  
  | 列名      | 数据类型 | 主键 | 外键 |
  | --------- | -------- | ---- | ---- |
  | articleId | varchar  | √    | √    |
  | tagName   | varchar  | √    | √    |

- msgboardforarticle表

  存储文章下留言

  | 列名        | 数据类型 | 主键 | 外键 |
  | ----------- | -------- | ---- | ---- |
  | msgId       | int      | √    |      |
  | avatar      | varchar  |      |      |
  | articleId   | varchar  |      | √    |
  | name        | varchar  |      |      |
  | content     | varchar  |      |      |
  | subTime     | datetime |      |      |
  | browser     | varchar  |      |      |
  | device      | varchar  |      |      |
  | upvoke      | int      |      |      |
  | fatherMsgId | int      |      |      |
  | mail        | varchar  |      |      |
  | website     | varchar  |      |      |

  ER关系：

  ![](.\images\Snipaste_2023-10-08_18-17-44.png)

- msgboardforall表

  存储留言板下的留言

  | 列名        | 数据类型 | 主键 | 外键 |
  | ----------- | -------- | ---- | ---- |
  | msgId       | int      | √    |      |
  | avatar      | varchar  |      |      |
  | name        | varchar  |      |      |
  | content     | varchar  |      |      |
  | subTime     | datetime |      |      |
  | browser     | varchar  |      |      |
  | device      | varchar  |      |      |
  | upvoke      | int      |      |      |
  | fatherMsgId | int      |      |      |
  | mail        | varchar  |      |      |
  | website     | varchar  |      |      |

  ER关系：

  ![](.\images\Snipaste_2023-10-08_18-20-46.png)

- mailmapavatar表

  用于留言区域对应用户头像

  | 列名   | 数据类型 | 主键 | 外键 |
  | ------ | -------- | ---- | ---- |
  | mail   | varchar  | √    |      |
  | avatar | varchar  |      |      |

  ER关系：
  ![](.\images\Snipaste_2023-10-08_18-23-00.png)

总体ER关系：

![](.\images\Snipaste_2023-10-08_18-24-59.png)

##### nodejs进行数据库连接

~~~javascript
const mysql = require('mysql')
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost:3306',
    user: 'root',
    password: '你的密码',
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

