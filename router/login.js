const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const { isAuth } = require('../function/login');

const router = express.Router();

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
