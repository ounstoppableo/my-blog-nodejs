const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.google.com',
  port: 587,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: 'xxxxx',
    pass: 'xxxxx',
  },
});
module.exports = transporter
