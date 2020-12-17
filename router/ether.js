const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const { isAuth } = require('../function/login');
const { doAsync } = require('../function/query');
const web3 = require('../function/web');

dotenv.config();
const router = express.Router();

router.get(
  // record
  '/record',
  isAuth,
  doAsync(async (req, res) => {
    const records = await axios.get(
      `https://api-kovan.etherscan.io/api?module=account&action=txlist&address=${req.user.address}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN}`,
    );
    const result = records.data.result.map((item) => {
      return {
        to: web3.utils.toChecksumAddress(item.to),
        from: web3.utils.toChecksumAddress(item.from),
        value: web3.utils.fromWei(item.value),
      };
    });
    res.send(result);
  }),
);

router.get(
  // balance
  '/balance',
  isAuth,
  doAsync(async (req, res) => {
    const balance = await web3.eth.getBalance(req.user.address);
    res.send(web3.utils.fromWei(balance));
  }),
);

module.exports = router;
