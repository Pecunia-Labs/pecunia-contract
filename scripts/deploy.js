const hre = require('hardhat')
const network = require('hardhat')
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
	console.log('USDT deployed:', usdt.address);

	const heirTokenFactory = await ethers.getContractFactory('HeirToken');
	const heirToken = await heirTokenFactory.attach(await PecuniaLock.heirToken());
	console.log('Heir Token:', heirToken.address);

	await usdt.mint(accounts[0].address, m(1000, 18))
	console.log('usdt mint to accounts[0]', d(await usdt.balanceOf(accounts[0].address), 18))
	await usdt.mint(accounts[1].address, m(1000, 18))
	console.log('usdt mint to accounts[1]', d(await usdt.balanceOf(accounts[1].address), 18))
	await usdt.mint(accounts[2].address, m(1000, 18))
	console.log('usdt mint to accounts[2]', d(await usdt.balanceOf(accounts[2].address), 18))

	let psw = 'abc123'
	let settingUpTokenAddr = '0x0' //hex or int
	let settingUpAmount = '0' //hex or int
	let p = await getProof(psw, settingUpTokenAddr, settingUpAmount, accounts);
	await PecuniaLock.register(p.boxhash, p.proof, p.pswHash, p.allHash, 60)
	console.log('register done');

	let amountToHeir = m(400, 18) //hex or int
	await usdt.connect(owner).approve(PecuniaLock.address, amountToHeir)
	console.log('step 1 approve done')

	const tokenId = await rechargeWithAddress(PecuniaLock, owner, usdt.address, heir.address, amountToHeir, "test")

	console.log(`tokenId: ${tokenId}`)
	
	// console.log(`Moving time...`);
  	// await network.provider.send("evm_increaseTime", [18000]);
  	// await network.provider.send("evm_mine");
  	// console.log(`Time moved by 18000`)

	let tokenAddr = usdt.address //hex or int
	await approveNFT(heirToken, heir, PecuniaLock.address, s(1))
	let p2 = await getProof(psw, tokenAddr, s(amountToHeir), accounts)
	await PecuniaLock.connect(heir).withdrawSignature(p2.proof, p2.pswHash, p2.allHash, owner.address)
	console.log('withdrawSignature done')

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

async function getProof(psw, tokenAddr, amount, accounts) {

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
		// TODO remove aacounts and add owner address
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

async function rechargeWithAddress(PecuniaLock, owner, tokenAddr, heirAddr, amount, tokenuri){
	const tokenId = await PecuniaLock.connect(owner).rechargeWithAddress(owner.address, heirAddr, tokenuri, {value: ethers.utils.parseEther('400')})
	
	console.log('step 2 rechargeWithAddress done')
	return tokenId
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});