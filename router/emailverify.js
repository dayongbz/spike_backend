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
const sendMail = require('../mail');

const router = express.Router();

dotenv.config();

// check email verify status
router.get(
  '/',
  doAsync(async (req, res) => {
    const email = CryptoJS.SHA3(req.query.email, { outputLength: 256 });
    const result = await runQuery(
      'SELECT verify FROM Emailverify WHERE email = @email ORDER BY id DESC',
      ['email', sql.VarChar(100), email],
    );
    result !== defaultErrorMsg
      ? result.length == 0
        ? res.status(406).send('Not Exist')
        : res.send(result[0])
      : res.status(500).send(result);
  }),
);

// create new email verify
router.post(
  '/',
  doAsync(async (req, res) => {
    const email = CryptoJS.SHA3(req.body.email, { outputLength: 256 });
    const code = CryptoJS.lib.WordArray.random(128 / 8);
    const result = await runTransQuery(
      'INSERT INTO Emailverify(email, code) VALUES(@email, @code)',
      ['email', sql.VarChar(100), email],
      ['code', sql.VarChar(100), code],
    );
    sendMail(
      req.body.email,
      `https://spike.dayong.xyz/emailverify?email=${email}&code=${code}`,
    );
    sendResult(res, result);
  }),
);

// update status 0 to 1
router.patch(
  '/',
  doAsync(async (req, res) => {
    const result = await runTransQuery(
      'UPDATE Emailverify SET verify = 1 WHERE email = @email AND code = @code',
      ['email', sql.VarChar(100), req.query.email],
      ['code', sql.VarChar(100), req.query.code],
    );
    sendResult(res, result);
  }),
);

// delete target in emailverify table
router.delete(
  '/',
  doAsync(async (req, res) => {
    const email = CryptoJS.SHA3(req.query.email, { outputLength: 256 });
    const result = await runTransQuery(
      'DELETE FROM Emailverify WHERE email = @email',
      ['email', sql.VarChar(100), email],
    );
    sendResult(res, result);
  }),
);

module.exports = router;
