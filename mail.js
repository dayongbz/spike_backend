const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

async function sendMail(to, data) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.kakao.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAILUSER,
      pass: process.env.EMAILPWD,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: to,
    subject: '[SPIKE] Verify your email',
    text: data,
    html: `<a href='${data}'>${data}</a>`,
  });
  console.log('Message sent: %s', info.messageId);
}

module.exports = sendMail;
