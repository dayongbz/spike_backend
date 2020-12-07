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

const runQuery = (res, query) => {
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

// middleware
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  runQuery(res, 'select * from users');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
