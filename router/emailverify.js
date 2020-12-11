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
  // check email verify status
  '/',
  doAsync(async (req, res) => {
    const email = CryptoJS.SHA3(req.query.email, { outputLength: 256 });
    const result = await runQuery(
      'SELECT verify FROM Emailverify WHERE email = @email AND verify = 0 ORDER BY id DESC',
      ['email', sql.VarChar(100), email],
    );
    result !== defaultErrorMsg
      ? result.length == 0
        ? res.status(406).send('Not Exist')
        : res.send(result[0])
      : res.status(500).send(result);
  }),
);

router.post(
  // create new email verify
  '/',
  doAsync(async (req, res) => {
    const email = CryptoJS.SHA3(req.body.email, { outputLength: 256 });
    const code = CryptoJS.lib.WordArray.random(128 / 8);

    const result = await runTransQuery(
      'INSERT INTO Emailverify(email, code) VALUES(@email, @code)',
      ['email', sql.VarChar(100), email],
      ['code', sql.VarChar(100), code],
    );
    sendResult(res, result);
  }),
);

router.delete(
  // delete target in emailverify table
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
