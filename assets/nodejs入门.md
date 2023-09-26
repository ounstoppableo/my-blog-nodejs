### Node.js入门

#### 为什么要学习Node.js

<img src=".\image\QQ截图20230516125918.png" style="zoom:50%;margin-left: 50px" />

1. 上图可看出，vue、augular、react，三大框架都是基于node.js的
2. node.js是让别人访问我们的网站的一个途径

#### 什么是Node.js

> 官方解释：Node.js是一个开源的、跨平台的JavaScript运行环境
>
> 通俗来讲：Node.js就是一款应用程序，是一款软件，它可以允许JavaScript代码

#### Node.js的作用

<img src=".\image\zy.png" style="zoom:50%;margin-left:50px" />

#### Node.js的下载

[node.js下载网站](https://nodejs.org/en)

> 安装完后在cmd输入node -v检测是否下载成功

#### Node.js初体验

> 打开CMD
>
> 将CMD路径调整到js文件所在文件夹下
>
> 输入指令 node 文件名.js 可执行

> 或者在vscode中
>
> 右键js文件打开集成终端
>
> 这时就打开了该路径的命令行

#### Node.js注意点

node.js能操作的对象如下：

<img src=".\image\api.png" style="zoom:50%;margin-left:50px" />

> Node.js不能使用dom和bom的API，可以使用console和定时器API
>
> Node.js中的顶级对象为global，也可以使用globalThis访问顶级对象

### Buffer

#### 概念

Buffer是一个类似于数组的***对象***，用于表示***固定长度***的字节序列

Buffer本质是一段内存空间，专门用来处理***二进制数据***

#### 特点

1. Buffer大小固定且无法调整
2. Buffer性能较好，可以直接对计算机内存进行操作
3. 每个元素的大小为1字节（byte）

#### 使用

##### 创建方式

1. alloc

   ~~~javascript
   //创建10字节的buffer空间
   let buf = Buffer.alloc(10)
   console.log(buf) //<Buffer 00 00 00 00 00 00 00 00 00 00>
   //使用alloc方式创建的buffer每个二进制位都会归零
   ~~~

2. allocUnsafe

   ~~~javascript
   let buf = Buffer.allocUnsafe(10)
   console.log(buf) //<Buffer 00 00 00 00 00 00 00 00 00 00>
   //使用allocUnsafe创建的buffer可能会包含以前的数据，因为allocUnsafe不会对以前的数据进行清零操作
   //但是allocUnsafe创建速度比alloc快
   ~~~

3. from

   ~~~javascript
   let buf = Buffer.from('hello')
   console.log(buf) //<Buffer 68 65 6c 6c 6f>
   //使用from会按照内容创建buffer并赋值
   ~~~

##### buffer与字符串的转化

~~~javascript
let buf = Buffer.from([105,108,111,118,101,121,111,117])
console.log(buf.toString()) //iloveyou
//toString默认采用utf-8的方式
~~~

### FS模块（file system）

fs模块可以实现与硬盘的交互

例如文件的创建、删除、重命名、移动

还有文件的读取、写入

以及文件夹的相关操作

#### 文件写入

##### 写入文件基操

~~~javascript
//1. 导入fs模块
const fs = require('fs')
//2. 写入文件
//fs.writeFile(file,data[,options],callback) 返回值undefined
fs.writeFile('./zuoyouming.txt','三人行，则必有我师焉', err => {
    //写入失败：err是一个错误对象
    //写入成功：err是null
    if(err){
        console.log('写入失败')
        return
    }
    console.log('写入成功')
})
~~~

##### fs同步与异步

###### 同步

~~~javascript
//同步写入方法
fs.writeFileSync('./zuoyouming.txt','三人行，则必有我师焉') //没有回调函数这个参数
~~~

###### 异步

~~~javascript
fs.writeFile()
~~~

##### 文件的追加写入

~~~javascript
const fs = require('fs')
//调用appenFile方法
fs.appendFile('./zuoyouming.txt','则其善者而从之，其不善者而改之', err => {
   if(err){
        console.log('写入失败')
        return
    }
    console.log('写入成功')
})

//同步方法
//fs.appendFileSync()
~~~

##### 流式写入

~~~javascript
const fs = require('fs')
//创建写入流对象，其实就类似于建立一个通道
const ws = fs.createWriteStream('./guanshuyougan.txt')
//write
ws.write('床前明月光\r\n')
ws.write('疑是地上霜\r\n')
ws.write('举头望明月\r\n')
ws.write('低头思故乡\r\n')
//关闭通道
ws.close()
~~~

> 流式写入方式适用于***大文件写入或频繁写入***的场景，writeFile适用于***写入频率较低***的场景
>
> ***程序打开一个文件是需要消耗资源的***，流式写入可以减少打开关闭文件的次数

##### 写入文件的应用场景

- 下载文件
- 安装软件
- 保存程序日志，如git
- 编辑器保存文件
- 视频录制

#### 读取文件

##### 文件读取基操

~~~javascript
const fs = require('fs')
//异步读取
fs.readFile('./guanshuyougan.txt',(err,data)=>{
    if(err){
        console.log('读取失败')
    	return
    }
    console.log(data) //读取的是buffer类型的数据，可以使用toString()转化成文字
})

//同步读取
//fs.readFileSync('./guanshuyougan.txt')
~~~

##### 流式读取

<img src=".\image\wj.png" style="zoom:50%;margin-left:50px" />

假设上图红框代表一个文件，里面的黑框则表示文件内的块，而流式读取就是将文件内的块一块一块的读取出来

~~~javascript
const fs = require('fs')
//创建读取流对象
const rs = fs.createReadStream('./1.mp4')
//绑定data事件
rs.on('data', chunk => { //chunk有块的意思
    console.log(chunk.length) //65536字节 => 64KB
})
//绑定end事件
rs.on('end', ()=>{
    console.log('读取完成')
})
~~~

##### 读取文件的应用场景

- 电脑开机
- 程序运行
- 编辑器打开文件
- 查看图片
- 播放视频
- git查看日志
- 上传文件
- 查看聊天记录

#### 复制文件

~~~javascript
const fs = require('fs')
let data = fs.readFileSync('./1.mp4')
fs.writeFileSync('./1(2).mp4',data)
~~~

~~~javascript
const fs = require('fs')
const rs = fs.createReadStream('./1.mp4')
const ws = fs.createWriteStream('./1(2).mp4')
rs.on('data', chunk => {
    ws.write(chunk)
})
~~~

> 第一种方式一次性把文件读完，然后放进data变量中，如果文件很大，那么程序占据的内存会非常大
>
> 而第二种是一块一块的取文件，理想状态下内存只需要64KB就可以完成复制，因为每块的大小就是64KB
>
> 但是由于读取速度比写入速度更快，所以会造成读取了很多块，结果只写了一块，所以实际占用的内存比64KB更大

> 流式简写
>
> ~~~javascript
> const fs = require('fs')
> const rs = fs.createReadStream('./1.mp4')
> const ws = fs.createWriteStream('./1(2).mp4')
> rs.pipe(ws) //pipe表示管道
> ~~~

#### 文件的移动和重命名

##### 重命名

~~~javascript
const fs = require('fs')
//调用rename方法,第一个参数表示需要重命名的文件名，第二个参数表示需要赋值的名字
fs.rename('./zuoyouming.txt','./座右铭.txt', err =>{
    if(err){
        console.log(err)
        return
    }
    console.log('重命名成功')
})
~~~

##### 移动文件

~~~javascript
const fs = require('fs')
//调用rename方法，如果第二个参数在一个文件夹路径下，则表示重命名，不在同一个文件夹路径下表示移动文件
fs.rename('./zuoyouming.txt','../zuoyouming.txt', err =>{
    if(err){
        console.log(err)
        return
    }
    console.log('重命名成功')
})
~~~

#### 文件删除

~~~javascript
const fs = require('fs')
//调用unlink方法
fs.unlink('./guanshuyougan.txt', err => {
    if(err){
        console.log(err)
        return
    }
    console.log('删除成功')
})
~~~

~~~javascript
const fs = require('fs')
//调用rm方法
fs.rm('./guanshuyougan.txt', err => {
    if(err){
        console.log(err)
        return
    }
    console.log('删除成功')
})
~~~

#### 文件夹操作

##### 创建文件夹

~~~JavaScript
const fs = require('fs')
//创建文件夹 mkdir()
fs.mkdir('./html', err => {
    if(err){
        console.log(err)
        return
    }
    console.log('创建成功')
})
~~~

递归创建

~~~javascript
const fs = require('fs')
fs.mkdir('./a/b/c', {recursive: true} , err => {
    if(err){
        console.log(err)
        return
    }
    console.log('创建成功')
})
~~~

##### 读取文件夹

~~~javascript
const fs = require('fs')
//读取文件夹 readdir()
fs.readdir('./html', (err,data) => {
    if(err){
        console.log(err)
        return
    }
    console.log(data)
})
~~~

##### 删除文件夹

~~~javascript
const fs = require('fs')
//删除文件夹 rmdir()
fs.rmdir('./html', err => {
    if(err){
        console.log(err)
        return
    }
    console.log('删除成功')
})
~~~

递归删除

~~~javascript
const fs = require('fs')
fs.rm('./a',{recursive: true}, err => {
    if(err){
        console.log(err)
        return
    }
    console.log('删除成功')
})
~~~

#### 查看资源状态

~~~javascript
const fs = require('rs')
//stat()
fs.stat('./1.mp4',(err,data)=>{
     if(err){
        console.log(err)
        return
    }
    console.log(data)
})
~~~

#### __dirname

> 由于文档的操作中，路径如果是相对路径的话，执行结果将会以命令行的路径为基础
>
> 这样会造成读取、创建文档不稳定的问题
>
> 为了解决这个问题只好使用绝对路径
>
> 然而每次都写绝对路径会显得很繁琐
>
> 这时__dirname的作用就体现出来了

> __dirname保存的是：执行文件的所在目录的绝对路径

##### PATH

<img src=".\image\PATH.png" style="zoom:75%;margin-left:50px" />

### HTTP模块(重要)

#### 创建HTTP服务

~~~JavaScript
//导入http模块
const http = require('http')
//创建服务对象
const server = http.createServer((request,response)=>{
    response.end('hello http server') //设置响应体，即显示在浏览器上的内容
}) //回调函数执行时间：收到http请求的时候
//监听端口，启动服务
server.listen(9000, ()=>{
    console.log('服务启动时执行')
}) //9000是端口号，可自定义
~~~

**注意：**

> 以上代码的含义就是:
>
> const server表示创建了一个http服务，这时候还只是一个对象，等待启动
>
> server.listen()表示启动了http服务，代表着node.js占用了计算机的9000端口号
>
> 此时若是收到了request请求，则会被server接收到，并且执行http.createServer()内的回调函数

> ctrl+c停止服务

> 响应体更新问题：
>
> 更改内容后必须重启服务，才能更新

> 响应体中如果有中文会乱码，解决方法：
>
> ~~~javascript
> response.header('content-type','text/html;charset=utf-8')
> response.end('你好')
> ~~~

> 如果端口被其他程序占用，可以使用***资源管理器***找到占用端口的程序，然后使用任务管理器关闭对应的程序

#### 获取HTTP请求报文

| 含义          | 语法                                                         | 重点掌握 |
| ------------- | ------------------------------------------------------------ | -------- |
| 请求方法      | request.method                                               | *        |
| 请求版本      | request.httpVersion                                          |          |
| 请求路径      | request.url                                                  | *        |
| URL路径       | require('url').parse(request.url).pathname                   | *        |
| URL查询字符串 | require('url').parse(request.url,true).query                 | *        |
| 请求头        | request.headers                                              | *        |
| 请求体        | request.on('data',function(chunk){})<br/>request.on('end',function(){}) |          |

**注意事项**

1. request.url只能获取路径以及查询字符串，无法获取URL中的域名以及协议内容
2. request.headers将请求信息转化成一个对象，并将属性名都转化成了***小写***
3. 关于路径：如果访问网站的时候，只填写了IP地址或者是域名信息，此时请求路径为***/***
4. 关于favicon.ico：这个请求是属于浏览器自动发送的请求

#### 设置响应报文

~~~ javascript
const http = require('http')
const post = 9000
const hostname = '127.0.0.1'
const server = http.createServer((request,response)=>{
    //设置响应状态码
    response.statusCode = 200
    //设置响应状态描述,几乎用不到
    response.statusMessage = 'ok'
    //设置响应头
    response.setHeader('content-type','text/html;charset=utf-8')
    //自定义响应头，只需要第一个参数的值不与响应头中的参数重叠即可
    response.setHeader('myName','hhh')
    //设置多个同名响应头
    response.setHeader('test',['a','b','c'])
    //设置响应体
	//1. response.end('hello!http server')
    //2.response.write()可以多次调用，并且一般写了response.write()后response.end()内就不需要传值了，只起到结束的效果
    response.write('1')
    response.write('2')
    response.write('3')
    response.write('4')
    response.end() //end()方法只能写一次
})
server.listen(post,hostname,()=>{
    console.log('服务开启成功')
})
~~~

#### 网页外部引入问题

~~~javascript
const http = require('http')
const fs = require('fs')
const post = 9000
const hostname = '127.0.0.1'
const server = http.createServer((request,response)=>{
    //response.end(html) 如果响应体这样写，外部样式的请求都会访问这个结果，所以必须要根据路径返回不同的样式
    let {pathname} = new URL(request.url,'http://127.0.0.1')
    if(pathname === './index.js'){
        let js = fs.readFileSync(path.resolve(__dirname,'index.js'))
        response.end(js)
    }else if(pathname === './index.css'){
        let css = fs.readFileSync(path.resolve(__dirname,'index.css'))
        response.end(css)
    }else if(pathname === '/'){
        let html = fs.readFileSync(path.resolve(__dirname,'index.html'))
        response.end(html)
    }else {
        response.statusCode = 404
        response.end('<h1>404 Not Found</h1>')
    }
})
server.listen(post,hostname,()=>{
    console.log('服务开启成功')
})
~~~

##### 搭建静态资源服务

> 由于一个网页静态资源（css、js、html）可能有很多，如果使用上述方法来搭建会比较耗费精力，***静态资源服务***可以很好的解决这个问题

~~~javascript
const http = require('http')
const fs = require('fs')
const path = require('node:path')
const post = 9000
const hostname = '127.0.0.1'
const server = http.createServer((request,response)=>{
    //获取路径
    const { pathname } = new URL(req.url, 'http://127.0.0.1')
    //获取文件根路径
    const root = path.resolve(__dirname, 'page')
    //获取文件路径
    const filePath = pathname === '/' ? root + pathname + 'index.html' : root + pathname
    //文件异步读取
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.setHeader('content-type', 'text/html;charset=utf-8')
            res.statusCode = 500
            res.end('文件读取失败')
            return
        }
        res.end(data)
    })
})
server.listen(post,hostname,()=>{
    console.log('服务开启成功')
})
~~~

###### 设置资源类型（MIME类型）

媒体类型通称为MIME类型，用来表示文档、文件或字节流的性质和格式

~~~javascript
mime类型结构：[type]/[subType]
例如：text/html text/css image/ipeg image/png application/json
~~~

HTTP服务可以设置响应头content-type来表明响应体的MIME类型，浏览器会根据该类型决定如何处理资源

下面是常见MIME类型

~~~javascript
html: 'text/html',
css: 'text/css',
js: 'text/javascript',
png: 'image/png',
jpg: 'image/jpeg',
gif: 'image/gif',
mp4: 'video/mp4',
mp3: 'audio/mpeg',
json: 'application/json'
~~~

> 对未知类型，可以选择***application/octet-stream***类型，浏览器在遇到该类型的响应时，会对响应体内容进行独立存储，也就是我们常见的***下载***效果

### Node.js模块化

#### 模块化初体验

> me.js

~~~javascript
function tiemo(){
    console.log('贴膜')
}
//暴露数据
module.exports = tiemo
~~~

> index.js

~~~javascript
const tiemo = require('./me.js')
tiemo()
~~~

**注意事项**

>1. 对于自己创建的模块，导入路径建议写***相对路径***，且不能省略./或../
>2. js和json文件导入时可以不用写后缀
>3. 如果导入其他类型的文件，会以JS文件进行处理
>4. 如果导入的是一个文件夹，则会***首先***检测该文件夹下***package.json***文件中main属性对应的文件，如果***main属性不存在***，或者***package.json不存在***，则会检测文件夹下index.js和index.json，如果还是没找到则会报错
>5. 导入node.js内置模块时，直接require模块的名字即可，无需加./和../

#### 模块暴露数据

> me.js

~~~ javascript
function tiemo(){
    console.log('贴膜')
}
function niejiao(){
    console.log('捏脚')
}
//暴露数据
module.exports = {
    tiemo: tiemo,
    niejiao: niejiao
}

//暴露数据第二种写法
//exports.tiemo = tiemo
//exports.niejiao = niejiao
~~~

> index.js

~~~javascript
const me = require('./me.js')
me.tiemo()
me.niejiao()
~~~

**注意事项**

>- module.exports可以暴露***任意***数据
>
>- 不能使用***exports = value***的形式暴露数据，模块内部module与exports的隐式关系 ***exports = module.exports = {}***
>
>  实际上就是require()是从module.exports中获取暴露信息的，exports原来指向module.exports，如果改变值了，则不指向module.exports了，就不能通过exports暴露信息了

#### 导入自定义模块的基本流程（require内部执行流程）

1. 将相对路径转为绝对路径，定位目标文件
2. 缓存检测（查看之前有没有导入过该文件，如果有则从缓存中取）
3. 读取目标文件代码
4. 包裹一个函数并执行（自执行函数）。通过***arguments.callee.toString()***查看自执行函数
5. 缓存模块的值
6. 返回module.exports的值

#### commonJS规范

node.js与commomJs的关系类似于JavaScript与ECMAScript的关系

module.exports、exports和require这些都是commonJS模块化规范中的内容

### 包管理工具

#### 包是什么

英文package，代表了一组特定功能的源码集合

#### 包管理工具

***管理包的应用软件***，可以对包进行***下载安装、更新、删除、上传***等操作

#### 常用的包管理工具

- npm
- yarn
- cnpm

##### npm

###### npm的安装

node.js在安装时会自动安装npm，所以如果已经按照了node.js，可以直接使用npm

可以通过npm -v查看版本号

###### npm的初始化

- 创建一个空目录，然后以此目录作为工作目录***启动命令行***，执行***npm init***

- npm init命令的作用是将文件夹初始化为一个包，***交互式创建package.json文件***

- ***package.json***是包的配置文件，每个包都必须有package.json

- 内容示例：

  ~~~javascript
  {
    "name": "npm_use",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1"
    },
    "author": "",
    "license": "ISC"
  }
  ~~~

- 也可以使用***npm init -y***快速初始化，文件夹名字不能包含中文和大写

###### 搜索包

***网站搜索***，网址是[搜索包](https://www.npmjs.com/)

###### 下载和安装包

我们可以通过***npm install***或***npm i***命令安装包

~~~sh
# 格式
npm install <包名>
npm i <包名>
#实例
npm install uniq //数组去重
~~~

下载完后会多出两个文件：***node_modules***（代码存放目录）与***package-lock.json***（固定包的版本信息）

###### 导入包

~~~javascript
const uniq = require('uniq') //直接写包名
~~~

> 我们初始化了一个包A，然后包中下载了一个外部包B，我们可以说B是A的***依赖包***，或者A**依赖**B

###### require导入npm包的基本流程

1. 在当前文件夹下node_modules中寻找同名的文件夹
2. 在上级目录中的node_modules中寻找同名的文件夹，直至找到磁盘根目录

###### 生产与开发

**生产环境**与**开发环境**

生产环境指的是项目上线后的环境，每个客户都可以访问

开发环境指的是专门用来写代码的环境，只有程序员自己能访问

***生产依赖***与***开发依赖***

我们可以在安装时设置选项来区分依赖的类型，目前有两类：

| 类型     | 命令                                    | 补充                                                         |
| -------- | --------------------------------------- | ------------------------------------------------------------ |
| 生产依赖 | npm i -S uniq<br/>npm i --save uniq     | -S等效于--save，-S是默认选项<br/>包信息保存在package.json中***dependencies***属性 |
| 开发依赖 | npm i -D less<br/>npm i --save-dev less | -D等效于--save-dev<br />包信息保存在package.json中devDependencies属性 |

###### npm全局安装

我们可以执行安装选项***-g***进行全局安装

~~~sh
npm i -g nodemon
~~~

全局安装完后就可以在任何位置的命令行执行nodemon命令

> nodemon可以代替npm命令
>
> 以前写的http服务中，修改代码总需要重新启动服务才能生效，非常麻烦
>
> 使用nodemon代替npm启动服务则会自动监听代码内容，代码内容发生修改了也能不需要重启服务就能响应到页面上

>可以通过***npm root -g***查看全局安装包的位置
>
>不是所有包都适合全局安装，只有全局类的工具适合，可以通过文档介绍确定安装方式

###### 安装包依赖（非常实用）

在项目协作中有一个常用命令就是***npm i***，通过命令可以依据package.json和package-lock.json的依赖声明安装项目依赖：

~~~sh
npm i
~~~

> 使用该命令的原因：
>
> 版本控制软件中，比如git时大多情况node_modules都会被忽略，因为node_modules太大了
>
> 所以git下来后都需要更新依赖才能执行代码

###### npm配置命令别名

> 在package.json中的scripts属性按照json语法添加即可

实例：

~~~javascript
"scripts":{
    "server": "node ./http.js"
}
~~~

>执行npm run server就相当于执行node ./http.js

###### npm配置淘宝镜像

***直接配置***

执行以下命令完成配置：

~~~ sh
npm config set registry https://registry.npmmirror.com/
~~~

***工具配置***

~~~sh
npm i -g nrm
nrm use taobao
nrm ls //可查看支持的镜像列表
~~~

##### cnpm

cnpm是淘宝构建的一个npmjs.con的完整镜像，也称***淘宝镜像***

cnpm部署服务器在国内***阿里云服务器**上，可以提高包下载速度

官方也提供了一个全局工具包cnpm，操作命令与npm大体相同

###### cnpm安装

> npm install -g cnpm --registry=https://registry.npmmirror.com

##### yarn

官方网址：[yarn官方网站](https://yarnpkg.com/)

###### yarn的安装

~~~sh
npm i -g yarn
~~~

##### 使用yarn还是npm

> 包管理文件千万不能混用

可以根据团队使用的包管理工具来进行选择

怎么判断团队使用哪种包管理工具呢？

可以通过锁文件判断：yarn的锁文件是：yarn.lock，npm的锁文件是：package-lock.json

#### nvm

nvm全称***Node Version Manager***顾名思义它是用来管理node版本的工具，方便切换不同版本的Node.js

##### 下载安装

[nvm下载地址](https://github.com/coreybutler/nvm-windows/releases)

选择***nvm-setup.exe***下载即可

##### 使用教程

可在下载地址查看

### express框架介绍

#### express介绍

express是一个基于Node.js平台的极简、灵活的WEB应用开发框架，[官方网址](https://www.expressjs.com.cn/)

简单来说，express是一个封装好的工具包，封装了很多功能，便于我们开发WEB应用（HTTP服务）

#### express使用

##### express下载

express本身是一个npm包，所以可以通过npm安装

~~~sh
npm i express
~~~

##### express初体验

~~~JavaScript
//导入express模块
const express = require('express')
//使用express创建对象
const app = express()
//创建路由，如果请求方法是get，请求路径是/home，则会触发回调函数
app.get('/home',(req,res)=>{
    res.end('hello express')
})
//监听端口，启动服务
app.listen(9000,()=>{
    console.log('服务启动成功')
})
~~~

##### express路由

###### 什么是路由

官方定义：***路由确定了应用程序如何响应客户端对特定端点的请求***

###### 路由的使用

一个路由的组成有：***请求方法***，***路径***，***回调函数***

express提供了一系列方法，可以很方便的使用路由，使用格式如下：

~~~javascript
app.<method>(path,callback)
~~~

###### 获取请求报文参数

~~~javascript
const express = require('express')
const app = express()
app.get('/home',(req,res)=>{
    //原生操作
    console.log(req.method)
    console.log(req.url)
    console.log(req.httpVersion)
    console.log(req.headers)
    
    //express操作
    //获取url路径
    console.log(req.path)
    //获取查询字符串
    console.log(req.query)
    //获取ip
    console.log(req.ip)
    //获取请求头
    console.log(req.get('host'))
    res.end('hello express')
})
app.listen(9000,()=>{
    console.log('服务启动成功')
})
~~~

###### 获取路由参数（路径名，不包含扩展名）

> 场景：商城中商品的路由路径一般是***一串数字.html***，我们不能根据每串数字都写一个路由规则，解决方法：

~~~javascript
const express = require('express')
const app = express()
// :id表示通配，但是这样一来又有一个问题，怎么确定一串数字对应的商品
app.get('/:id.html',(req,res)=>{
    //解决方法
    //获取URL路由参数，params表示路由参数，id与上边的占位符一致
    console.log(req.params.id)
    res.setHeader('content-type','text/html;charset=utf-8')
    res.end('商品详情')
})
app.listen(9000,()=>{
    console.log('服务启动成功')
})
~~~

###### 响应设置

***一般响应设置***

~~~Javascript
const express = require('express')
const app = express()
app.get('/',(req,res)=>{
    //原生响应
    //res.statusCode = 200
    //res.statusMessage = 'ok'
    //res.setHeader('content-type','text/html;charset=utf-8')
    //res.end('商品详情')
    
    //express响应
    res.status(200)
    res.set('content-type','text/html;charset=utf-8')
    //等价res.end(),但是遇到中文会自动设置响应头charset=utf-8
    res.send('你好 Express')
    //连写
    //res.status(200).set('content-type','text/html;charset=utf-8').send('你好 Express')
})
app.listen(9000,()=>{
    console.log('服务启动成功')
})
~~~

***其他响应设置***

~~~JavaScript
const express = require('express')
const app = express()
app.get('/xxx',(req,res)=>{
    //重定向
    res.redirect('http://baidu.com/')
    //下载响应
    res.download(__dirname + '/package.json')
    //json响应,返回JSON字符串
    res.json({
        name: '123',
        slogon: 'hhh'
    })
    //响应文件内容
    res.sendFile(__dirname + '/test.html')
})
app.listen(9000,()=>{
    console.log('服务启动成功')
})
~~~

##### express中间件

###### 什么是中间件

<font color=#dbaf33>中间件本质上是回调函数</font>

<font color=#dbaf33>中间件函数</font>可以像路由回调一样访问<font color=#dbaf33>请求对象</font>,<font color=#dbaf33>响应对象</font>

###### 中间件的作用

<font color=#dbaf33>中间件的作用</font>就是<font color=#dbaf33>使用函数封装公共操作，简化代码</font>

###### 中间件类型

- 全局中间件（不管满不满足路由，都会执行）
- 路由中间件（只有满足路由才会执行）

**全局中间件案例**

~~~JavaScript
/*
*将请求的url,ip写入到access.log文件中
*/
const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
//声明全局中间件函数
function recordMiddleware(req,res,next){
    const {url,ip} = req
    //将url与ip保存在access.log文件
    fs.appendFileSync(path.resolve(__dirname,'./access.log'),`${url} ${ip}\r\n`)
    //调用next,表示执行完全局中间件后继续执行后续请求的回调
    next()
}
//使用中间件函数
app.use(recordMiddleware)

app.get('/home',(req,res) => {
    res.send('前台首页')
})
app.get('/admin',(req,res) => {
    res.send('后台首页')
})
app.get('*',(req,res) => {
    res.send('<h1>404 Not Found</h1>')
})
app.listen(9000,()=>{
    console.log('服务开启成功')
})
~~~

**路由中间件案例**

~~~javascript
/*
*暗号正确才能进入后台
*/
const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
//声明路由中间件函数
let checkCodeMiddleware = (req,res,next)=>{
    //判断url中查询字符串的code参数是否等于521
    if(req.query.code === '521'){
       //执行后边的请求回调
       next()
    }else {
       res.send('暗号错误')
    }
}
app.get('/home',(req,res) => {
    res.send('前台首页')
})
//路由中间件调用
app.get('/admin',checkCodeMiddleware,(req,res) => {
	res.send('后台首页')
})
app.get('/setting',checkCodeMiddleware,(req,res) => {
    res.send('后台设置')
})
app.get('*',(req,res) => {
    res.send('<h1>404 Not Found</h1>')
})
app.listen(9000,()=>{
    console.log('服务开启成功')
})
~~~

**静态资源中间件**（属于全局中间件）

~~~JavaScript
const express = require('express')
const app = express()
//使用静态资源中间件,参数为静态资源文件夹的路径
app.use(express.static(__dirname+'/public'))
app.get('/',(req,res)=>{
    res.end('hello express')
})
app.listen(9000,()=>{
    sonsole.log('服务开启成功')
})
~~~

> ***<font color=red>静态资源中间件使用注意事项：</font>***
>
> - 不写路径，静态资源中间件会自动寻找index.html，也就是index.html会默认为网站首页
> - 如果静态资源与路由规则同时匹配，谁先匹配谁就响应（也就是哪个代码先出现就先响应）
> - 路由响应一般响应动态资源（新闻、排行榜），静态资源中间件响应静态资源

##### 获取请求体数据body-parser

express可以使用<font color=#dbaf33>body-parser</font>包处理请求体

~~~sh
npm i body-parser
~~~

~~~javascript
/*
*GET /login进入一个页面，有用户名，密码两个文本框
*POST /login获取表单信息
*/
const express = require('express')
const bodyParser = require('body-parser')
//解析json数据的中间件
const jsonParser = bodyParser.json()
//解析query字符串的中间件
const urlencodedParser = bodyParser.urlencoded()
const app = express()
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html')
})
app.post('/login',urlencodedParser,(req,res)=>{
    //获取用户名和密码,当中间件运行完后，会将值传递到req.body中
    console.log(req.body)
})
app.listen(9000, () => {
    console.log('服务开启成功')
})
~~~

##### 防盗链

> 建立网站时，常常会有链接别的网站的图片，但是显示不出来的情况
>
> 原因应该是被链接的网站使用了防盗链
>
> 如果不是被该网站允许的域名是不被允许使用该网站的图片的

> 实现防盗链最主要的是：请求头中的referer属性
>
> 只有设置referer属性为被链接的网站允许的域名时，才能使用该网站的图片

~~~javascript
const express = require('express')
const app =express()
//声明中间件
app.use((req,res,next)=>{
    //检测请求头中的referer属性是否为127.0.0.1
    //获取referer
    let referer = req.get('referer')
    if(referer === '127.0.0.1'){
       next()
    }
})
app.get('/',(req,res)=>{
    
})
app.listen(9000,()=>{
    console.log('服务开启成功')
})
~~~

##### 路由模块化

~~~javascript
const express = require('express')
//创建路由对象
const router = express.Router()
//创建路由规则
router.get('/home',(req,res)=>{
    res.send('前台首页')
})
router.get('/search',(req,res)=>{
    res.send('内容搜索')
})
//暴露router
module.exports = router
~~~

~~~javascript
//只要在别的文件引入
const router = require('模块化路由的路径')
const express = require('express')
const app = express()
//使用模块化router
app.use(router)
~~~

##### EJS模板引擎

~~~sh
npm i ejs
~~~

**ejs的使用**

~~~javascript
const ejs = require('ejs')
//以前拼接字符串与变量的方法，这种方法使得html与js变量耦合，不易拆解
let china = '中国'
// let str = `我爱你 ${china}`
//使用ejs.render()进行字符串拼接
// let result = ejs.render('我爱你 <%= china %>', { china: china })
let str = `我爱你 <%= china%>`
//这样就实现了变量与字符串的分离
let result = ejs.render(str, { china: china })
console.log(result);
~~~

**ejs实现列表渲染**

~~~javascript
const ejs = require('ejs')
const arr = ['唐僧','孙悟空','猪八戒','沙和尚']
// <% %>中可以写js语法
let result = ejs.render(`
	<ul>
	<% arr.forEach(item=>{ %>
		<li><%=item %></li>
	<% }) %>
	</ul>
`,{arr})
~~~

**ejs条件渲染**

~~~javascript
//通过isLogin决定最终的输出内容
const ejs = require('ejs')
let isLogin = true
/*if(isLogin){
*	console.log('<span>欢迎回来</span>')    
*}else {
* 	console.log('<button>登录</button>')   
*}
*/
let result = (`
	<% if(isLogin){ %>
		<span>欢迎回来</span>
	<% }else { %>
		<button>登录</button>
	<% } %>
`,{isLogin})
~~~

**在express中使用ejs**

~~~javascript
const express = require('express')
const ejs = require('ejs')
const path = require('path')
const app = express()
//设置模板引擎
app.set('view engine','ejs')
//设置模板文件存放位置，模板文件：具有模板语法内容的文件
app.set('views',path.resolve(__dirname,'views'))
app.get('/home',(req,res)=>{
    let data = '123456'
    //通过render方法响应
    //res.render('模板文件名',数据)
    res.render('demo',{data})
})
app.listen(9000,()=>{
    console.log('服务开启成功')
})
~~~

##### express-generator

~~~sh
npm i -g express-generator
~~~

### Mongodb

#### 什么是mongodb

Mongodb是基于分布式存储的<font color=red>数据库</font>，[官方网站](https://www.mongodb.com/)

#### 为什么选择Mongodb

操作语法与JavaScript类似，容易上手，学习成本低

#### Mongodb的结构

db(文件夹)->集合->文档(即对象，最小单位)

#### Mongodb的下载安装与启动

[下载地址](https://www.mongodb.com/download/commuity)

> 1. 将压缩包移动到C:\Program Files下，然后解压
> 2. 创建C:\data\db目录，mongodb会将数据默认保存在该文件夹
> 3. 以mongodb中bin目录作为工作目录，打开cmd
> 4. 运行命令mongod，启动mongodb服务端
> 5. 打开新的命令行执行mongo，启动mongodb客户端

#### Mongoose

##### 介绍

Mongoose是一个对象文档模型库，[官网](http://www.mongoosejs.net)

##### 作用

方便使用代码操作mongodb

##### 使用流程

~~~sh
npm i mongoose
~~~

~~~javascript
//导入mongoose
const mongoose = require('mongoose')
//连接mongodb服务							  数据库名称	没有会自动创建
mongoose.connect('mongodb://127.0.0.1:27017/bilibili')
//设置回调
//once表示只连接一次，官方推荐使用，防止重复连接
mongoose.connection.once('open',()=>{
    console.log('连接成功')
})
mongoose.connection.on('error',()=>{
    console.log('连接失败')
})
mongoose.connection.on('close',()=>{
    console.log('连接关闭')
})
~~~

###### 插入文档（对象）

~~~javascript
const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/bilibili')
mongoose.connection.once('open',()=>{
    //设置文档对象的结构
    //设置集合中文档的属性以及属性值的类型
    let BookSchema = new mongoose.Schema({
        name: String,
        author: String,
        price: number,
        is_Hot: Boolean
    })
    //创建模型对象(集合) 对文档操作的封装对象
    let BookModel = new mongoose.model('books',BookSchema)
    //新增
    BookModel.create({
        name: '西游记',
        author: '吴承恩',
        price: 19.9,
        is_Hot: true
    },(err,data)=>{
        if(err){
            console.log(err)
            return
        }
        console.log(data)
    })
})
mongoose.connection.on('error',()=>{
    console.log('连接失败')
})
mongoose.connection.on('close',()=>{
    console.log('连接关闭')
})
~~~

**字段类型**

<img src=".\image\ziduanleix.png" style="zoom:50%;margin-left:50px" />

**字段验证**

~~~javascript
//前边省略了一些内容

let BookSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true //表面该属性必须不为空
            unique: true //设置为独一无二，在集合中不能产生重复的
        },
        author: {
            type: String,
            defalut: '匿名' //设置默认值，该值如果没传参，则使用默认值
        },
    	style: {
            type: String,
            enum: ['言情','志怪'] //枚举，值只能从其中选
        },
        price: Number
    })
~~~

###### 删除文档

~~~javascript
//默认在回调函数内，且有数据
//删除一条
BookModel.deleteOne({_id:''},(err,data)=>{
        if(err){
            console.log(err)
            return
        }
        console.log(data)
})
//批量删除 将集合内有is_Hot属性的文档全部删除
BookModel.deleteMany({is_Hot: false},(err,data)=>{
        if(err){
            console.log(err)
            return
        }
        console.log(data)
})
~~~

###### 更新文档

~~~javascript
//默认在回调函数内，且有数据
//更新一条 将价格修改为9.9
BookModel.updateOne({name:'红楼梦'},{price:9.9},(err,data)=>{
        if(err){
            console.log(err)
            return
        }
        console.log(data)
})
//批量更新 将余华为作者的书都改为热门
BookModel.updateMany({author:'余华'},{is_Hot:true},(err,data)=>{
        if(err){
            console.log(err)
            return
        }
        console.log(data)
})
~~~

###### 读取文档

~~~javascript
//默认在回调函数内，且有数据
//读取一条
BookModel.findOne({name: '狂飙'},(err,data)=>{
        if(err){
            console.log(err)
            return
        }
        console.log(data)
})
//读取多条，不加条件表示获取所有
BookModel.find({author: '余华'},(err,data)=>{
        if(err){
            console.log(err)
            return
        }
        console.log(data)
})
~~~

###### 条件控制

**运算符**

在mongodb中不能使用> < >= <= !==等运算符，需要使用替代符号

- <font color=brown>> </font>使用 <font color=brown>$gt</font>
- <font color=brown><</font> 使用 <font color=brown>$lt</font>
- <font color=brown>>= </font>使用 <font color=brown>$gte</font>
- <font color=brown><= </font>使用 <font color=brown>$lte</font>
- <font color=brown>!== </font>使用 <font color=brown>$ne</font>

~~~javascript
//例子
BookModel.find({price: {$lt: 20}},(err,data)=>{
    if(err) return console.log(err)
    console.log(data)
})
~~~

**逻辑运算**

<font color=brown>$or </font>逻辑或的情况

~~~javascript
BookModel.find({$or:[{author: '曹雪芹'},{author: '余华'}]},(err,data)=>{
    if(err) return console.log(err)
    console.log(data)
})
~~~

<font color=brown>$and </font>逻辑与的情况

~~~javascript
BookModel.find({$and:[{price: {$gt: 30}},{price: {$lt: 70}}]},(err,data)=>{
    if(err) return console.log(err)
    console.log(data)
})
~~~

**正则表达式**

~~~javascript
BookModel.find({name: /三/},(err,data)=>{ //找出名字中带有三的书籍
    if(err) return console.log(err)
    console.log(data)
})
BookModel.find({name: new RegExp('三')},(err,data)=>{ //找出名字中带有三的书籍
    if(err) return console.log(err)
    console.log(data)
})
~~~

###### 个性化读取

**字段筛选**

~~~javascript
//筛选文档中的属性，选择性显示
//0: 不要的字段
//1: 要的字段
BookModel.find().select({_id:0,name:1,author:1}).exec((err,data)=>{
    if(err) throw(err)
    console.log(data)
    mongoose.connection.close()
})
~~~

**数据排序**

~~~javascript
//排序
//1: 升序
//-1: 降序
BookModel.find().sort({price: 1}).exec((err,data)=>{
    if(err) throw(err)
    console.log(data)
    mongoose.connection.close()
})
~~~

**数据截断**

~~~javascript
//skip跳过  limit截取
//表示取4-6的数据，跳过前三个取下三个
BookModel.find().skip(3).limit(3).exec((err,data)=>{
    if(err) throw(err)
    console.log(data)
    mongoose.connection.close()
})
~~~

##### mongoose代码模块化

暴露连接模块

~~~javascript
/**
* @param {*} success 数据库连接成功的回调
* @param {*} error 数据库连接失败的回调
*/
module.exports = function(success,error){
    const mongoose = require('mongoose')
	mongoose.connect('mongodb://127.0.0.1:27017/bilibili')
	mongoose.connection.once('open',()=>{
        success()
    })
    mongoose.connection.on('error',()=>{
        error()
    })
    mongoose.connection.on('close',()=>{
        console.log('连接关闭')
    })
}
~~~

暴露文档模板模块

~~~javascript
const mongoose = require('mongoose')
let BookSchema = new mongoose.Schema({
        name: String,
        author: String,
        price: number,
        is_Hot: Boolean
})
let BookModel = new mongoose.model('books',BookSchema)
module.exports = BookModel
~~~

### 会话控制

所谓会话控制就是***对会话进行控制***

HTTP是一种无状态的协议，它没有办法区分多次请求是否来源于同一个客户端，***无法区分用户***

而产品中又存在大量的这样的需求，所以我们需要通过***会话控制***来解决该问题

常见的会话控制技术有三种：

- cookie
- session
- token

#### Cookie

##### 什么是cookie

cookie是HTTP服务器发送到用户浏览器并保存在本地的一小块数据

***cookie 是保存在浏览器的一小块数据***

*** cookie 是按照域名划分保存的***

简单示例：

| 域名             | cookie                       |
| ---------------- | ---------------------------- |
| www.baidu.com    | a=100;b=200                  |
| www.bilibili.com | xid=1020abce121;hm=112411213 |
| jd.com           | x=100;ocw=12414cce           |

##### cookie的特点

浏览器向服务器发送请求时，会自动将***当前域名下***可用cookie设置在请求头中，然后传递给服务器

这个请求头名字也叫***cookie***，所以将***cookie理解为一个HTTP的请求头也是可以的***

##### cookie的运行流程

填写账号和密码校验身份，校验通过后下发cookie

<img src=".\image\cookie.png" style="zoom:50%;margin-left:50px" />

有了cookie之后，后续向服务器发送请求时就会携带cookie

<img src=".\image\cookie2.png" style="zoom:50%;margin-left:50px" />

##### express中设置cookie

~~~javascript
const express = require('express')
const app = express()
app.get('/',(req,res)=>{
    //res.cookie('name','zhangsan') //会在浏览器关闭后销毁
    res.cookie('name','lisi',{maxAge: 60*1000}) //使用此方法设置cookie的生命周期，单位：毫秒 注意：但是在报文内是以秒显示
    res.cookie('theme','bule') //cookie可以设置多个
    res.send('home')
})
app.listen(3000)
~~~

##### express中删除cookie

~~~javascript
const express = require('express')
const app = express()
app.get('/',(req,res)=>{
    res.cookie('name','lisi',{maxAge: 60*1000})
    res.send('home')
})
//删除cookie
app.get('/remove-cookie',(req,res)=>{
    //调用方法，传递cookie名
    res.clearCookie('name')
    res.send('删除成功')
})
app.listen(3000)
~~~

##### express中读取cookie

安装工具包cookie-parser

~~~sh
npm i cookie-parser
~~~

~~~javascript
const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
//使用cookieparser,实际上就是中间件
app.use(cookieParser())

app.get('/',(req,res)=>{
    res.cookie('name','lisi',{maxAge: 60*1000})
    res.send('home')
})
app.get('/get-cookie',(req,res)=>{
    console.log(req.cookies)
    res.send(`欢迎宁，${req.cookies.name}`)
})
app.listen(3000)
~~~

#### session

##### 什么是session

session是保存在***服务器端的一块数据***，保存当前访问用户的相关信息

##### session的作用

实现会话控制，可以识别用户的身份，快速获取当前用户的相关信息

##### session的运行流程

填写账号和密码校验身份，校验通过后创建***session信息***，然后将***session_id***的值通过响应头返回给浏览器

<img src=".\image\session.png" style="zoom:100%;margin-left:0px" />

有了cookie，下次发送请求时会自动携带cookie，服务器通过***cookie***中的***session_id***的值确定用户身份

<img src=".\image\session2.png" style="margin-left:0;" >

##### express中的session

先安装express-session包

~~~sh
npm i express-session
~~~

~~~javascript
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const app = express()
//设置中间件
app.use(session({
    name: 'sid', //设置cookie的name，默认值是: connect.sid
    secret: '12345', //参与加密的字符串（又称签名）
    saveUninitialized: false, //是否为每次请求都设置一个cookie用来存储session的id
    resave: true, //是否在每次请求时重新保存session
    store: MongoStore.create({ //数据库连接配置
        mongoUrl: 'mongodb://127.0.0.1:27017/test'
    }),
    cookie: {
        httpOnly: true, //开启后前端无法通过JS操作，防止从浏览器控制台获取cookie
        maxAge: 1000*300 //这一条是控制sessionID的过期时间
    }
}))
//登录 session设置
app.get('/login',(req,res)=>{
    if(req.query.username === 'admin' && req.query.password === 'admin'){
        //设置session信息
        req.session.username = 'admin'
        req.session.uid = '258aefccc'
        //成功响应
       	res.send('登录成功')
    }else {
        res.send('登录失败')
    }
})
//session读取
app.get('/car',(req,res)=>{
    //检测session是否存在用户数据
    if(req.session.username){
        //成功响应
       	res.send(`欢迎宁,${req.session.username}`)
    }else {
        res.send('宁还没登录')
    }
})

//session的销毁
app.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        res.send('销毁成功')
    })
})
app.listen(3000)
~~~

#### session和cookie的区别

1. 存在的位置
   - cookie: 浏览器端
   - session: 服务器端
2. 安全性
   - cookie是以明文的方式存放在客户端的，安全性较低
   - session存放于服务器中，所以安全性相对较好
3. 网络传输量
   - cookie设置内容太多会增大报文体积，会影响传输效率
   - session数据存储在服务器，只是通过cookie传递id，所以不影响传输效率
4. 存储限制
   - 浏览器限制单个cookie保存的数据不能超过***4K***，且单个域名下的存储数量也有限制
   - session数据存储在服务器中，所以没有这些限制

#### token

##### 什么是token

***token***是服务端生成并返回给HTTP客户端的一串加密字符串，***token***中保存着***用户信息***

##### token的作用

实现会话控制，可以识别用户的身份，主要用于移动端APP

##### token的工作流程

填写账号和密码校验身份，校验通过后响应token，token一般是在响应体中返回给客户端的

<img src=".\image\token.png" style="zoom:50%;margin-left:50px" />

后续发送请求时，需要手动将token添加在请求报文中，一般是放在请求头中

<img src=".\image\token2.png" style="zoom:50%;margin-left:50px" />

##### token的特点

- 服务端压力更小
  - 数据存储在客户端
- 相对更安全
  - 数据加密
  - 可以避免CSRF（跨站请求伪造）
- 扩展性更强
  - 服务间可以共享
  - 增加服务节点更简单

##### JWT

jwt是目前最流行的跨域认证解决方案，可用于基于***token***的身份验证

jwt使token的生成与校验更加规范

我们可以使用***jsonwebtoken***包来操作

~~~javascript
//导入jsonwebtoken
const jwt = require('jsonwebtoken')
//创建（生成）token
//let token = jwt.sign(用户数据,加密字符串,配置对象)
let token = jwt.sign({
    username: 'zhangsan'
},'123456',{
    expiresIn: 60, //单位是秒
})
//校验token       加密字符串
jwt.verify(token,'123456',(err,data)=>{
    if(err) throw(err)
    console.log(data)
})
~~~

