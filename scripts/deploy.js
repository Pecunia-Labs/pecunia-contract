const hre = require('hardhat')
const fs = require('fs')
const { BigNumber } = require('ethers')
const snarkjs = require("snarkjs")

async function main() {
	const accounts = await hre.ethers.getSigners()
	const [owner, heir, lawyer] = accounts

	const PecuniaLockFactory = await ethers.getContractFactory('PecuniaLock')
	const PecuniaLock = await PecuniaLockFactory.deploy()
	await PecuniaLock.deployed()
	console.log('PecuniaLock deployed:', PecuniaLock.address)

	const MockERC20 = await ethers.getContractFactory('MockERC20')
    const usdt = await MockERC20.deploy('MockUSDT', 'USDT')
    await usdt.deployed()
	console.log('USDT deployed:', usdt.address)

	await usdt.mint(accounts[0].address, m(1000, 18))
	console.log('usdt mint to accounts[0]', d(await usdt.balanceOf(accounts[0].address), 18))
	await usdt.mint(accounts[1].address, m(1000, 18))
	console.log('usdt mint to accounts[1]', d(await usdt.balanceOf(accounts[1].address), 18))
	await usdt.mint(accounts[2].address, m(1000, 18))
	console.log('usdt mint to accounts[2]', d(await usdt.balanceOf(accounts[2].address), 18))



	let psw = 'abc123'
	let tokenAddr = '0x0' //hex or int
	let amount = '0' //hex or int
	let input = [stringToHex(psw), tokenAddr, amount]
	console.log('input', input)

	let data = await snarkjs.groth16.fullProve({in:input}, "./zk/circuit3/main3_js/main3.wasm", "./zk/circuit3/main3_0001.zkey")

	// console.log("pswHash: ", data.publicSignals[0])
	console.log(JSON.stringify(data))

	const vKey = JSON.parse(fs.readFileSync("./zk/circuit3/verification_key.json"))
	const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

	if (res === true) {
		console.log("Verification OK")

		let pswHash = data.publicSignals[0]
		let allHash = data.publicSignals[3]
		let boxhash = ethers.utils.solidityKeccak256(['uint256', 'address'], [pswHash, accounts[0].address])

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

		await PecuniaLock.register(boxhash, proof, pswHash, allHash)
		console.log('register done')

	} else {
		console.log("Invalid proof")
	}

	await usdt.connect(accounts[0]).approve(PecuniaLock.address, m(100, 18))
	console.log('step 1 approve done')

	await PecuniaLock.connect(accounts[0]).rechargeWithAddress(accounts[0].address, accounts[0].address, usdt.address, m(100, 18))
	console.log('step 2 rechargeWithAddress done')

	// let psw = 'abc123'
	let tokenAddr2 = usdt.address //hex or int
	let amount2 = s(m(30, 18)) //hex or int
	let input2 = [stringToHex(psw), tokenAddr2, amount2]
	console.log('input2', input2)

	let data2 = await snarkjs.groth16.fullProve({in:input2}, "./zk/circuit3/main3_js/main3.wasm", "./zk/circuit3/main3_0001.zkey")

	// console.log("pswHash: ", data.publicSignals[0])
	console.log(JSON.stringify(data2))

	const vKey2 = JSON.parse(fs.readFileSync("./zk/circuit3/verification_key.json"))
	const res2 = await snarkjs.groth16.verify(vKey2, data2.publicSignals, data2.proof)

	if (res2 === true) {
		console.log("Verification OK")

		let pswHash2 = data2.publicSignals[0]
		let allHash2 = data2.publicSignals[3]

		let proof2 = [
			BigNumber.from(data2.proof.pi_a[0]).toHexString(),
			BigNumber.from(data2.proof.pi_a[1]).toHexString(),
			BigNumber.from(data2.proof.pi_b[0][1]).toHexString(),
			BigNumber.from(data2.proof.pi_b[0][0]).toHexString(),
			BigNumber.from(data2.proof.pi_b[1][1]).toHexString(),
			BigNumber.from(data2.proof.pi_b[1][0]).toHexString(),
			BigNumber.from(data2.proof.pi_c[0]).toHexString(),
			BigNumber.from(data2.proof.pi_c[1]).toHexString()
		]

		await PecuniaLock.withdraw(proof2, pswHash2, usdt.address, m(30, 18), allHash2, accounts[2].address)
		console.log('withdraw done')


	} else {
		console.log("Invalid proof")
	}
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

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});