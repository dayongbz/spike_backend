const express = require('express');
const CryptoJS = require('crypto-js');
const sql = require('mssql');
const dotenv = require('dotenv');

const {
  runQuery,
  runTransQuery,
  sendResult,
  doAsync,
  defaultErrorMsg,
} = require('../query');

const router = express.Router();

dotenv.config();

router.get(
  // check overlap(nickname, email)
  '/',
  doAsync(async (req, res) => {
    let query, input;

    if (req.query.nickname) {
      query = 'SELECT nickname FROM Users WHERE nickname = @nickname';
      input = ['nickname', sql.VarChar(20), req.query.nickname];
    } else if (req.query.email) {
      query = 'SELECT email FROM Users WHERE email = @email';
      input = ['email', sql.VarChar(20), req.query.email];
    }

    const result = await runQuery(query, input);
    result !== defaultErrorMsg
      ? result.length === 0
        ? res.send('You can use it')
        : res.status(406).send("You can't use it")
      : res.status(500).send(result);
  }),
);

router.post(
  // create new account
  '/',
  doAsync(async (req, res) => {
    const pwdSalt = CryptoJS.lib.WordArray.random(128 / 8);
    const keystoreSalt = CryptoJS.lib.WordArray.random(128 / 8);
    const password = CryptoJS.PBKDF2(req.body.password, pwdSalt, {
      keySize: 256 / 32,
      iterations: process.env.ITERATION,
    });
    const keystore = CryptoJS.PBKDF2(req.body.keystore, keystoreSalt, {
      keySize: 256 / 32,
      iterations: process.env.ITERATION,
    });

    const result = await runTransQuery(
      `INSERT INTO Users(nickname, password, pwd_salt, address, email, keystore, keystore_salt) VALUES(@nickname, @password, @pwd_salt, @address, @email, @keystore, @keystore_salt)`,
      ['nickname', sql.VarChar(20), req.body.nickname],
      ['password', sql.VarChar(50), password],
      ['pwd_salt', sql.VarChar(100), pwdSalt],
      ['address', sql.VarChar(100), req.body.address],
      ['email', sql.VarChar(200), req.body.email],
      ['keystore', sql.Text, keystore],
      ['keystore_salt', sql.VarChar(100), keystoreSalt],
    );
    sendResult(res, result);
  }),
);

module.exports = router;
