const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();
const aMapKey = require('../../secretManage/secretManage')['amapKey'];
const hefengKey = require('../../secretManage/secretManage')['hefengKey'];
const dayjs = require('dayjs');
const { lowerCase } = require('lodash');
const custom = require('../../utils/log');
const weatherData = require('./defaultData')['weatherData'];
const locationData = require('./defaultData')['locationData'];

const weatherDescriptionTrans = (text, hour) => {
  text = lowerCase(text);
  switch (text) {
    case 'clear':
      if (hour < 6 || hour > 18) return 'clear-night';
      else return 'sunny';
    case 'overcast':
      if (hour < 6 || hour > 18) return 'partly-cloudy-night';
      else return 'partly-cloudy';
    case 'partly cloudy':
      if (hour < 6 || hour > 18) return 'partly-cloudy-night';
      else return 'partly-cloudy';
    case 'thundershower':
      return 'thunderstorm';
  }
  if (text.includes('rain')) return 'rainy';
  if (text.includes('snow')) return 'snowy';
  if (text.includes('foggy')) return 'foggy';
  if (text.includes('clouds')) return 'cloudy';
  return text;
};

router.get('/weather', (req, res) => {
  let { location } = req.query;
  if (!location) location = '114.06,22.54';
  fetch(
    `https://km6e4cn2t9.re.qweatherapi.com/geo/v2/city/lookup?location=${location}&key=${hefengKey}`,
  )
    .then(async (fRes) => {
      const data = await fRes.json();
      if (data.code == '200') {
        const { location: locationDetail } = data;
        fetch(
          `https://devapi.qweather.com/v7/weather/24h?location=${location}&lang=en&key=${hefengKey}`,
        )
          .then(async (fRes) => {
            const data = await fRes.json();
            if (data.code == '200') {
              const { hourly } = data;
              const result = hourly.map((hour) => {
                const fxTime = dayjs(hour.fxTime.split('+')[0]).format(
                  'YYYY-MM-DD HH:mm:ss',
                );
                return {
                  day:
                    dayjs(fxTime).date() === dayjs(data.updateTime).date()
                      ? 'tod'
                      : 'tom',
                  hour: dayjs(fxTime).hour(),
                  weather: weatherDescriptionTrans(
                    hour.text,
                    dayjs(fxTime).hour(),
                  ),
                  temp: +hour.temp,
                  time: dayjs(fxTime).format('HH:mm'),
                };
              });
              res.json({
                code: 200,
                msg: '获取成功',
                data: { weatherData: result, location: locationDetail },
              });
            } else {
              throw new Error('接口请求失败');
            }
          })
          .catch((err) => {
            throw new Error(err);
          });
      } else {
        throw new Error('接口请求失败');
      }
    })
    .catch((err) => {
      custom.log(err);
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          weatherData,
          location: locationData,
        },
      });
    });
});

module.exports = router;
