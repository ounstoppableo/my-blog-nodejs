function generateMailTemplate(title, mail, description, url) {
  return `
     <style type="text/css">
    @media screen and (max-width:600px) {

      .afterimg,
      .beforeimg {
        display: none !important
      }
    }
  </style>
  <div
    style="background: url(https://npm.elemecdn.com/sarakale-assets@v1/Article/email/bg2.png);padding:20px 0px 20px;margin:0px;background-color:#d6d6d6;width:100%;">
    <div
      style="border-radius: 10px 10px 10px 10px;font-size:14px;color: #555555;width: 530px;font-family:'Century Gothic','Trebuchet MS','Hiragino Sans GB',微软雅黑,'Microsoft Yahei',Tahoma,Helvetica,Arial,'SimSun',sans-serif;margin:50px auto;max-width:100%;">
      <img class="beforeimg"
        style="margin-top: -30px;margin-bottom: -120px;width:530px;height:317px;z-index:-100;pointer-events:none"
        src="https://npm.elemecdn.com/hexo-butterfly-envelope/lib/before.png">
      <img src="https://npm.elemecdn.com/hexo-butterfly-envelope/lib/violet.jpg"
        style="width:100%;overflow:hidden;pointer-events:none">
      <div
        style="width:100%;background:#f8d1ce;color:#9d2850;border-radius: 10px 10px 0 0;background-image: -moz-linear-gradient(0deg, rgb(67, 198, 184), rgb(255, 209, 244));height: 66px;background: url(https://npm.elemecdn.com/sarakale-assets@v1/Article/email/line034_666x66.png) left top no-repeat;">
        <p style="font-size:16px;font-weight: bold;text-align:center;word-break:break-all;padding: 23px 32px;margin:0;">
          您订阅的
          <a style="text-decoration:none;color: #9d2850;" href="https://www.unstoppable840.cn/home">『unstoppable840's blog』</a>上发布新的文章啦！
        </p>
      </div>
      <div class="formmain"
        style="background:#fff;width:96%;max-width:800px;margin:auto auto;border-radius:5px;border: 1px solid #564f4f59;overflow:hidden;pointer-events:none">
        <div style="margin:40px auto;width:90%;">
          <p>Hi，${mail}，『unstoppable840's blog』上更新了文章：</p>
          <div style="background: #eee;margin:20px 0px;padding:15px;border-radius:5px;font-size:15px;color:#555555;">
            ${title}</div>
          <p> 文章概要：</p>
          <div style="background: #eee;margin:20px 0px;padding:15px;border-radius:5px;font-size:15px;color:#555555;">
            ${description}</div>
          <p>您可以点击<a style="text-decoration:none; color:#cf5c83" href="${url}" target="_blank"> 查看完整文章
            </a>，欢迎再次光临<a style="text-decoration:none; color:#cf5c83" href="https://www.unstoppable840.cn/home" target="_blank"> 『unstoppable840's blog』
            </a>。
            <hr />
          <p style="font-size:14px;color:#b7adad;text-align:center">
            本邮件为系统自动发送，请勿直接回复邮件哦，可到博文内容回复。<br />https://www.unstoppable840.com</p>
          </p>
          <img src="https://npm.elemecdn.com/hexo-butterfly-envelope/lib/line.png"
            style="width:100%;margin:25px auto 5px auto;display:block;pointer-events:none">
          <p class="bottomhr" style="font-size:12px;text-align:center;color:#999">自动书记人偶竭诚为您服务！</p>
        </div>
      </div><img class="afterimg" style="width:530px;height:317px;margin-top: -155px;z-index:100;"
        src="https://npm.elemecdn.com/hexo-butterfly-envelope/lib/after.png">
    </div>
  </div>
  `;
}
module.exports = generateMailTemplate;
