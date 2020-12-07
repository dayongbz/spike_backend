const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');
const port = 3001;

dotenv.config();

const dbConfig = {
  user: 'dayongbz',
  password: process.env.SQLPWD,
  server: 'dayong.database.windows.net',
  database: 'dayong_sq',
};

const runQuery = (res, query, dbConfig) => {
  const dbConn = new sql.ConnectionPool(dbConfig);
  dbConn
    .connect()
    .then(() => {
      const request = new sql.Request(dbConn);
      request
        .query(query)
        .then((resp) => {
          console.log(resp);
          res.send(resp.recordset);
          dbConn.close();
        })
        .catch((err) => {
          console.error(err);
          dbConn.close();
        });
    })
    .catch((err) => {
      console.error(err);
    });
};

const runTransQuery = (res, query) => {
  const dbConn = new sql.ConnectionPool(dbConfig);
  dbConn.connect().then(function () {
    const transaction = new sql.Transaction(dbConn);
    transaction
      .begin()
      .then(function () {
        const request = new sql.Request(transaction);
        request
          .query(query)
          .then(function () {
            transaction
              .commit()
              .then(function (resp) {
                console.log(resp);
                dbConn.close();
              })
              .catch(function (err) {
                console.log('Error in Transaction Commit ' + err);
                dbConn.close();
              });
          })
          .catch(function (err) {
            console.log('Error in Transaction Begin ' + err);
            dbConn.close();
          });
      })
      .catch(function (err) {
        console.log(err);
        dbConn.close();
      })
      .catch(function (err) {
        //12.
        console.log(err);
      });
  });
};

// middleware
app.use(bodyParser.json());
app.use(cors());

app.get('/users', (req, res) => {
  runQuery(res, 'select * from users');
});

app.post('/users', (req, res) => {
  runTransQuery(
    res,
    `INSERT INTO Users( nickname, email, keystore) VALUES('${req.body.nickname}', '${req.body.email}', '${req.body.keystore}')`,
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
