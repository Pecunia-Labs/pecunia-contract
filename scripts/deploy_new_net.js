const hre = require('hardhat')
const network = require('hardhat')
const fs = require('fs')
const { BigNumber } = require('ethers')
const snarkjs = require("snarkjs")

async function main() {
	const accounts = await hre.ethers.getSigners()
	
	// FOR NEW DEPLOYMENT //
	// const [owner, heir, lawyer] = accounts
	const owner = accounts[0]
	console.log(`owner add ${owner.address}`)
	const PecuniaLockFactory = await ethers.getContractFactory('PecuniaLock')
	const pecunia_lock = await PecuniaLockFactory.deploy()
	await pecunia_lock.deployed()
	console.log('PecuniaLock deployed:', pecunia_lock.address)
	const heirTokenFactory = await ethers.getContractFactory('HeirToken');
	const heir_token = await heirTokenFactory.attach(await pecunia_lock.heirToken());
	console.log('Heir Token:', heir_token.address);

	// let psw = 'abc123'
	// let settingUpAmount = '0' //hex or int
	// let interval = '120'
	// let p = await getProof(psw, settingUpAmount, owner);
	// await pecunia_lock.register(p.boxhash, p.proof, p.pswHash, p.allHash, interval, {gasLimit: 1e6})
	// console.log('register done');

	// let amountToHeir = ethers.utils.parseEther("0.01") //hex or int

	// const tokenId = await rechargeWithAddress(pecunia_lock, owner, '0x3e60B11022238Af208D4FAEe9192dAEE46D225a6', amountToHeir, "test")
	// console.log(`tokenId: ${tokenId}`)
	
	// console.log(`Moving time...`);
  	// await network.provider.send("evm_increaseTime", [18000]);
  	// await network.provider.send("evm_mine");
  	// console.log(`Time moved by 18000`)

	// await approveNFT(heir_token, heir, pecunia_lock.address, s(1))
	// let p2 = await getProof(psw, s(amountToHeir), owner)
	// let owner_address = '0x1AEb23bdC154f227De6b009936e1eBc0D4a9db20'
	// await pecunia_lock.connect(owner).withdrawSignature(p2.proof, p2.pswHash, p2.allHash, owner_address, {gasLimit: 1e7})
	// console.log('withdrawSignature done')

}

function stringToHex(string) {
	let hexStr = '';
	for (let i = 0; i < string.length; i++) {
		let compact = string.charCodeAt(i).toString(16)
		hexStr += compact
	}
	return '0x' + hexStr
}

function getAbi(jsonPath) {
	let file = fs.readFileSync(jsonPath)
	let abi = JSON.parse(file.toString()).abi
	return abi
}

async function delay(sec) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, sec * 1000);
	})
}

function m(num, decimals) {
	return BigNumber.from(num).mul(BigNumber.from(10).pow(decimals))
}

function d(bn, decimals) {
	return bn.mul(BigNumber.from(100)).div(BigNumber.from(10).pow(decimals)).toNumber() / 100
}

function b(num) {
	return BigNumber.from(num)
}

function n(bn) {
	return bn.toNumber()
}

function s(bn) {
	return bn.toString()
}

async function getProof(psw, amount, user) {

	let input = [stringToHex(psw), amount]
	console.log('input', input)

	let data = await snarkjs.groth16.fullProve({in:input}, "./zk/new_circuit/circuit_js/circuit.wasm", "./zk/new_circuit/circuit_0001.zkey")

	// console.log("pswHash: ", data.publicSignals[0])
	console.log(JSON.stringify(data))

	const vKey = JSON.parse(fs.readFileSync("./zk/new_circuit/verification_key.json"))
	const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

	if (res === true) {
		console.log("Verification OK")

		let pswHash = data.publicSignals[0]
		let allHash = data.publicSignals[2]
		// console.log(`getProof: user add ${user.address}`)
		let boxhash = ethers.utils.solidityKeccak256(['uint256', 'address'], [pswHash, user.address])

		let proof = [
			BigNumber.from(data.proof.pi_a[0]).toHexString(),
			BigNumber.from(data.proof.pi_a[1]).toHexString(),
			BigNumber.from(data.proof.pi_b[0][1]).toHexString(),
			BigNumber.from(data.proof.pi_b[0][0]).toHexString(),
			BigNumber.from(data.proof.pi_b[1][1]).toHexString(),
			BigNumber.from(data.proof.pi_b[1][0]).toHexString(),
			BigNumber.from(data.proof.pi_c[0]).toHexString(),
			BigNumber.from(data.proof.pi_c[1]).toHexString()
		]

		
		return {proof, pswHash, boxhash, allHash}

	} else {
		console.log("Invalid proof")
	}
}


async function approveNFT(
    heirToken,
    user,
    to,
    tokenId
  ){
    await heirToken.connect(user).approve(to, tokenId);
	console.log(`Heir token approved`)
  }

async function moveBlocks(numOfBlocks){
    console.log("Moving blocks.... ")
    for (let i =0; i<= numOfBlocks; i++){
        await network.provider.request({
            method: "evm_mine",
            params: [],
        })
    }
    console.log(` Blocks moved by ${numOfBlocks} `)
}

async function rechargeWithAddress(PecuniaLock, owner, heirAddr, amount, tokenuri){
	const tokenId = await PecuniaLock.connect(owner).rechargeWithAddress(owner.address, heirAddr, tokenuri, {value: amount})
	
	console.log('step 2 rechargeWithAddress done')
	return tokenId
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});