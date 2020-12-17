const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const session = require('express-session');
const logger = require('morgan');
const https = require('https');
const http = require('http');
const fs = require('fs');
const flash = require('connect-flash');

const usersRouter = require('./router/users');
const emailverifyRouter = require('./router/emailverify');
const loginRouter = require('./router/login');
const passportConfig = require('./passport');
const httpsOptions = {};

dotenv.config();

const app = express();
const dev = process.env.NODE_ENV !== 'production';
const sess = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {},
};

if (!dev) {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
  sess.cookie.sameSite = 'none';
  // sess.cookie.domain = '.dayong.xyz';
  httpsOptions.ca = fs.readFileSync(
    '/etc/letsencrypt/live/api.dayong.xyz/fullchain.pem',
  );
  httpsOptions.key = fs.readFileSync(
    '/etc/letsencrypt/live/api.dayong.xyz/privkey.pem',
  );
  httpsOptions.cert = fs.readFileSync(
    '/etc/letsencrypt/live/api.dayong.xyz/cert.pem',
  );
} else {
  httpsOptions.key = fs.readFileSync('./devKey/private.pem');
  httpsOptions.cert = fs.readFileSync('./devKey/public.pem');
}

passportConfig(passport);

// middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(sess));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(dev ? logger('dev', { format: 'dev' }) : logger({ format: 'default' }));

app.all('*', (req, res, next) => {
  let protocol = req.headers['x-forwarded-proto'] || req.protocol;
  if (protocol == 'https') {
    next();
  } else {
    let from = `${protocol}://${req.hostname}${req.url}`;
    let to = `https://${req.hostname}${req.url}`;
    // log and redirect
    // console.log(`[${req.method}]: ${from} -> ${to}`);
    res.redirect(to);
  }
});

app.use('/users', usersRouter);
app.use('/emailverify', emailverifyRouter);
app.use('/login', loginRouter);

http.createServer(app).listen(80, () => {
  console.log('start http server');
});
https.createServer(httpsOptions, app).listen(443, () => {
  console.log('start https server');
});
