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

router.get(
  // 가스료 정보
  '/send',
  isAuth,
  doAsync(async (req, res) => {
    const gas = await web3.eth.estimateGas({
      to: req.query.to,
      from: req.user.address,
      value: web3.utils.toWei(req.query.value),
    });
    const gasPrice = await web3.eth.getGasPrice();
    const price = web3.utils.fromWei(String(gas * gasPrice));
    console.log(price);
    res.send({ gas, gasPrice, price });
  }),

  router.post(
    '/send',
    isAuth,
    doAsync(async (req, res) => {
      const gas = await web3.eth.estimateGas({
        to: req.query.to,
        from: req.user.address,
        value: web3.utils.toWei(req.body.value),
      });
      const account = await web3.eth.accounts.decrypt(
        JSON.parse(req.user.keystore),
        req.user.password,
      );
      const signed = await web3.eth.accounts.signTransaction(
        {
          to: req.body.to,
          value: web3.utils.toWei(req.body.value),
          gas,
        },
        account.privateKey,
      );
      web3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on('receipt', res.send('success'));
    }),
  ),
);

module.exports = router;
