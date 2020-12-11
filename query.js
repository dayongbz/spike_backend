const sql = require('mssql');
const dotenv = require('dotenv');

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

const doAsync = (fn) => {
  return async (req, res, next) => {
    try {
      return await fn(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = {
  runQuery,
  runTransQuery,
  sendResult,
  doAsync,
  defaultErrorMsg,
};
