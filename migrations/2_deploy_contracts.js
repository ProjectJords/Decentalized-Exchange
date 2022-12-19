// const Web3 = require("web3");

const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");
//const SafeMath = artifacts.require("SafeMath");

module.exports = async function (deployer) {
  const accounts = await web3.eth.getAccounts()
  const feeAccount = accounts[0]
  const feePct = 10

  
  await deployer.deploy(Token)
  await deployer.deploy(Exchange, feeAccount, feePct)
  //deployer.deploy(SafeMath);
};
