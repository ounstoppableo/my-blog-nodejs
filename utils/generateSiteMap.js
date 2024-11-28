const dayjs = require('dayjs');
const pool = require('../mysql/pool');
const custom = require('./log');
const fs = require('fs');
const path = require('path');

const generateSiteMap = () => {
  return new Promise((reolve) => {
    pool.query('select * from articleinfo', (err, data) => {
      if (err) {
        reolve(1);
        return custom.log(err);
      }
      const siteUnit = data.map((item) => {
        return generateSiteUnit(
          `https://www.unstoppable840.cn/article/${item.articleId}`,
          dayjs(item.lastModifyTime).format('YYYY-MM-DD'),
        );
      });
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://www.unstoppable840.cn/home</loc>
        <lastmod>${dayjs(new Date()).format('YYYY-MM-DD')}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1</priority>
    </url>
    ${siteUnit.join('')}
</urlset> 
  `;
      fs.writeFile(
        path.resolve(__dirname, '../public/sitemap/sitemap.xml'),
        sitemap,
        (err) => {
          if (err) {
            custom.log(err);
          }
        },
      );
      reolve(1);
    });
  });
};
const generateSiteUnit = (
  url,
  lastmod = dayjs(new Date()).format('YYYY-MM-DD'),
  changefreq = 'yearly',
  priority = 0.8,
) => {
  return `
  <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
   </url>
    `;
};
module.exports = generateSiteMap;
