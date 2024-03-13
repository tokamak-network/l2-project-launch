const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'
const PublicSaleLogicAddr = "0x70a8ffF8fD3a2910bb60BE8048E5E25467bE0187"
const PublicSaleSettingAddr = "0xc16530E5e68E6ce991E1e33647690D034172cA27"
const PublicSaleVaultProxyAddr = "0x03eF47Cf6d7F13Bce40FaB4D18e41C965Be71F32"
const PublicSaleVaultABI = require("../../artifacts/contracts/L2/vaults/L2PublicSaleVaultProxy.sol/L2PublicSaleVaultProxy.json")
const PublicSaleProxyABI = require("../../artifacts/contracts/L2/vaults/L2PublicSaleProxy.sol/L2PublicSaleProxy.json")

const Web3EthAbi = require("web3-eth-abi");

async function main() {
	//==== getPublicSaleVaultProxy =================================
	const L2PublicSaleVaultProxy = await ethers.getContractAt(
		PublicSaleVaultABI.abi,
		PublicSaleVaultProxyAddr
	)

	const L2PublicSaleProxy = await ethers.getContractAt(
		PublicSaleProxyABI.abi,
		PublicSaleVaultProxyAddr
	)

	const quoter = "0xfd0c2acfe71af67bc150ccd13df3bed6a3c22875"
	const vestingFund = "0x5ee33244050b52b00396834dbc6778516a4cdb67"
	const liquidityVault = "0x9b8b80b2b3b47a525a1f2cee4f9df1390d77e171"
	const uniswapRouter = "0xf28cfa043766e4fe9e390d66e0cd07991290fdd8"
	const lockTOS = "0xC903C31D5257eEa1FFc17275C092442162E7B218"
	const tos = "0x6af3cb766d6cd37449bfd321d961a61b0515c1bc"
	const ton = "0xfa956eb0c4b3e692ad5a6b2f08170ade55999aca"
	let minPer = 5
	let maxPer = 10
	let standardTier1 = ethers.utils.parseUnits("100", 18);
	let standardTier2 = ethers.utils.parseUnits("200", 18);
	let standardTier3 = ethers.utils.parseUnits("1000", 18);
	let standardTier4 = ethers.utils.parseUnits("4000", 18);
	let delayTime = 600

	await L2PublicSaleProxy.initialize(
		[
			quoter,
			vestingFund,
			liquidityVault,
			uniswapRouter,
			lockTOS,
			tos,
			ton
		],
		minPer,
		maxPer,
		standardTier1,
		standardTier2,
		standardTier3,
		standardTier4,
		delayTime
	)
	console.log("finish the initialize")


	// await (
	// 	await L2PublicSaleProxy.setAddress(
	// 		[
	// 			quoter,
	// 			vestingFund,
	// 			liquidityVault,
	// 			uniswapRouter,
	// 			lockTOS,
	// 			tos,
	// 			ton
	// 		]
	// 	)
	// ).wait();
	// console.log("finish the set Address")

	let check = await L2PublicSaleProxy.lockTOS();
	console.log("lockTOS addr : ", check);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
