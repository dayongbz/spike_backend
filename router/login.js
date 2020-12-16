const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');

const router = express.Router();

dotenv.config();

router.post(
  '/',
  passport.authenticate('local', {
    failureFlash: true,
  }),
  (req, res) => {
    const { username, keystore } = {};
    res.send('success');
  },
);

module.exports = router;
