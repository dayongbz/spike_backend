const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');
const CryptoJS = require('crypto-js');
const port = 3001;
const defaultErrorMsg = "error// sorry we can't response";

dotenv.config();

const dbConfig = {
  user: 'dayongbz',
  password: process.env.SQLPWD,
  server: 'dayong.database.windows.net',
  database: 'dayong_sq',
  options: {
    encrypt: true,
    enableArithAbort: true,
  },
};

const doAsync = (fn) => {
  return async (req, res, next) => {
    try {
      return await fn(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};

const runQuery = async (query, ...input) => {
  const dbConn = new sql.ConnectionPool(dbConfig);
  try {
    await dbConn.connect();
    const request = new sql.Request(dbConn);
    if (input.length !== 0) {
      for (let i = 0; i < input.length; i++) {
        request.input(input[i][0], input[i][1], input[i][2]);
      }
    }
    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error(err);
    return defaultErrorMsg;
  } finally {
    dbConn.close();
  }
};

const runTransQuery = async (query, ...input) => {
  const dbConn = new sql.ConnectionPool(dbConfig);
  try {
    await dbConn.connect();
    const transaction = new sql.Transaction(dbConn);
    await transaction.begin();
    const request = new sql.Request(transaction);
    if (input.length !== 0) {
      for (let i = 0; i < input.length; i++) {
        request.input(input[i][0], input[i][1], input[i][2]);
      }
    }
    await request.query(query);
    await transaction.commit();
    return 'success';
  } catch (err) {
    console.error(err);
    return defaultErrorMsg;
  } finally {
    dbConn.close();
  }
};

const sendResult = (res, result) => {
  result !== defaultErrorMsg ? res.send(result) : res.status(500).send(result);
};

// middleware
app.use(bodyParser.json());
app.use(cors());

app.get(
  // check overlap(nickname, email)
  '/users',
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

app.post(
  // create new account
  '/users',
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

app.get(
  // check email verify status
  '/emailverify',
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

app.post(
  // create new email verify
  '/emailverify',
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

app.delete(
  // delete target in emailverify table
  '/emailverify',
  doAsync(async (req, res) => {
    const email = CryptoJS.SHA3(req.query.email, { outputLength: 256 });

    const result = await runTransQuery(
      'DELETE FROM Emailverify WHERE email = @email',
      ['email', sql.VarChar(100), email],
    );
    sendResult(res, result);
  }),
);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
