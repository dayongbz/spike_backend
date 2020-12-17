const Web3 = require('web3');
const dotenv = require('dotenv');

dotenv.config();

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://kovan.infura.io/v3/${process.env.INFURA}`,
  ),
);

module.exports = web3;
