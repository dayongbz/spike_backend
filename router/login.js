const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');

const router = express.Router();

dotenv.config();

router.post(
  '/',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  }),
);

module.exports = router;
