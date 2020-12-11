const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const usersRouter = require('./router/users');
const emailverifyRouter = require('./router/emailverify');

const app = express();
const port = 3001;

// middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/users', usersRouter);
app.use('/emailverify', emailverifyRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
