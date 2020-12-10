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
  // 이메일, 닉네임 중복 확인
  '/users',
  doAsync(async (req, res) => {
    let query, input;

    if (req.query.nickname) {
      query = 'select nickname from users where nickname = @nickname';
      input = ['nickname', sql.VarChar(20), req.query.nickname];
    } else if (req.query.email) {
      query = 'select email from users where email = @email';
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
  // 계정 추가
  '/users',
  doAsync(async (req, res) => {
    const result = await runTransQuery(
      `INSERT INTO Users( nickname, address, email, keystore) VALUES(@nickname, @address, @email, @keystore)`,
      ['nickname', sql.VarChar(20), req.body.nickname],
      ['address', sql.VarChar(100), req.body.address],
      ['email', sql.VarChar(200), req.body.email],
      ['keystore', sql.Text, req.body.keystore],
    );
    sendResult(res, result);
  }),
);

app.get(
  '/emailverify/:email',
  doAsync(async (req, res) => {
    const result = await runQuery(
      'SELECT id, verify FROM Emailverify WHERE email = @email AND verify = 0 ORDER BY id DESC',
      ['email', sql.VarChar(100), req.params.email],
    );
    result !== defaultErrorMsg
      ? res.send(result[0])
      : res.status(500).send(result);
  }),
);

app.post(
  '/emailverify',
  doAsync(async (req, res) => {
    const emailSha = {
      email: req.body.email,
      code: CryptoJS.lib.WordArray.random(128 / 8).toString(),
    };
    const result = await runTransQuery(
      'INSERT INTO Emailverify(email, code) VALUES(@email, @code)',
      ['email', sql.VarChar(100), emailSha.email],
      ['code', sql.VarChar(100), emailSha.code],
    );
    sendResult(res, result);
  }),
);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
