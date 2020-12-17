const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');

const router = express.Router();

const isAuth = (req, res, next) => {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) return next();
  res.status(406).send('you have to login');
};

dotenv.config();

router.get('/', isAuth, (req, res) => {
  // console.log({ username: req.user.username, address: req.user.address });
  res.send({ username: req.user.username, address: req.user.address });
});

router.post(
  '/',
  passport.authenticate('local', {
    failureFlash: true,
  }),
  (req, res) => {
    res.send({ username: req.user.username, address: req.user.address });
  },
);

module.exports = router;
