const hre = require('hardhat')
const network = require('hardhat')
const fs = require('fs')
const { BigNumber } = require('ethers')
const snarkjs = require("snarkjs")

const HeirToken = JSON.parse(fs.readFileSync("./artifacts/contracts/mock/HeirToken.sol/HeirToken.json"))
const PecuniaLock = JSON.parse(fs.readFileSync("./artifacts/contracts/PecuniaLock.sol/PecuniaLock.json"));

const PECUNIA_LOCK = '0xF1A631C177B663fc070325c188664534cBEFcfFC';
const HEIR_TOKEN = '0x0ce454ab05b2797f4425dC84A8e5b7155Ff7C60c';

async function main(){
  let accounts;
  accounts = await hre.ethers.getSigners();
  let signer = accounts[0];

  let pecunia_lock = new ethers.Contract(PECUNIA_LOCK, PecuniaLock.abi, signer);
  let heir_token = new ethers.Contract(HEIR_TOKEN, HeirToken.abi, signer);




};

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});



// enum ProposalState {
//   Pending,
//   Active,
//   Canceled,
//   Defeated,
//   Succeeded,
//   Queued,
//   Expired,
//   Executed
// }
