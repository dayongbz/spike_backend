const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const dotenv = require('dotenv');
const session = require('express-session');

const usersRouter = require('./router/users');
const emailverifyRouter = require('./router/emailverify');
const loginRouter = require('./router/login');
const passportConfig = require('./passport');

dotenv.config();

const app = express();
const port = 3001;
const sess = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {},
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
}

passportConfig();

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(sess));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.use('/users', usersRouter);
app.use('/emailverify', emailverifyRouter);
app.use('/login', loginRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
