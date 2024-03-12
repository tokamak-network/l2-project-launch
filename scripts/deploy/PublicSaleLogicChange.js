const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'
const PublicSaleLogicAddr = "0x70a8ffF8fD3a2910bb60BE8048E5E25467bE0187"
const PublicSaleSettingAddr = "0xc16530E5e68E6ce991E1e33647690D034172cA27"
const PublicSaleVaultProxyAddr = "0x03eF47Cf6d7F13Bce40FaB4D18e41C965Be71F32"
const PublicSaleVaultABI = require("../../artifacts/contracts/L2/vaults/L2PublicSaleVaultProxy.sol/L2PublicSaleVaultProxy.json")

const Web3EthAbi = require("web3-eth-abi");

async function main() {
	//==== getPublicSaleVaultProxy =================================
	const L2PublicSaleVaultProxy = await ethers.getContractAt(
		PublicSaleVaultABI.abi,
		PublicSaleVaultProxyAddr
	)

	let impl = await L2PublicSaleVaultProxy.implementation()
	if (impl != PublicSaleLogicAddr) {
		await (await L2PublicSaleVaultProxy.upgradeTo(PublicSaleLogicAddr)).wait()
		console.log("upgrade To finish")
	}

	let setting = await L2PublicSaleVaultProxy.implementation2(1)
    if (setting != PublicSaleSettingAddr){
        await (await L2PublicSaleVaultProxy.setImplementation2(
            PublicSaleSettingAddr, 1, true
        )).wait()
		console.log("setImplementation2 finish")
    }

	const _setL2ProjectManager = Web3EthAbi.encodeFunctionSignature(
		"setL2ProjectManager(address)"
	)
	let _setL2ProjectManager1 = await L2PublicSaleVaultProxy.getSelectorImplementation2(_setL2ProjectManager)
	if (_setL2ProjectManager1 != PublicSaleSettingAddr){

		const _setL2ProjectManager = Web3EthAbi.encodeFunctionSignature(
			"setL2ProjectManager(address)"
		)

		const _setBurnBridge = Web3EthAbi.encodeFunctionSignature(
			"setBurnBridge(address,address)"
		)

		const _initialize = Web3EthAbi.encodeFunctionSignature(
			"initialize(address[7],uint8,uint8,uint256,uint256,uint256,uint256,uint256)"
		)

		const _setAddress = Web3EthAbi.encodeFunctionSignature(
			"setAddress(address[7)"
		)

		const _setMaxMinPercent = Web3EthAbi.encodeFunctionSignature(
			"setMaxMinPercent(uint8,uint8)"
		)

		const _setSTOSstandard = Web3EthAbi.encodeFunctionSignature(
			"setSTOSstandard(uint256,uint256,uint256,uint256)"
		)

		const _setDelayTime = Web3EthAbi.encodeFunctionSignature(
			"setDelayTime(uint256)"
		)

		const _setVaultAdmin = Web3EthAbi.encodeFunctionSignature(
			"setVaultAdmin(address,address)"
		)

		const _vaultInitialize4 = Web3EthAbi.encodeFunctionSignature({
			name: 'vaultInitialize',
			type: 'function',
			inputs: [
				{
				  name: "_l2token",
				  type: "address"
				},
				{
					components: [
					  {
						name: "stosTier1",
						type: "uint256"
					  },
					  {
						name: "stosTier2",
						type: "uint256"
					  },
					  {
						name: "stosTier3",
						type: "uint256"
					  },
					  {
						name: "stosTier4",
						type: "uint256"
					  },
					  {
						name: "tier1Percents",
						type: "uint256"
					  },
					  {
						name: "tier2Percents",
						type: "uint256"
					  },
					  {
						name: "tier3Percents",
						type: "uint256"
					  },
					  {
						name: "tier4Percents",
						type: "uint256"
					  },
					  {
						name: "total1roundSaleAmount",
						type: "uint256"
					  },
					  {
						name: "total2roundSaleAmount",
						type: "uint256"
					  },
					  {
						name: "saleTokenPrice",
						type: "uint256"
					  },
					  {
						name: "payTokenPrice",
						type: "uint256"
					  },
					  {
						name: "hardcapAmount",
						type: "uint256"
					  },
					  {
						name: "changeTOSPercent",
						type: "uint256"
					  },
					  {
						name: "startWhiteTime",
						type: "uint256"
					  },
					  {
						name: "endWhiteTime",
						type: "uint256"
					  },
					  {
						name: "start1roundTime",
						type: "uint256"
					  },
					  {
						name: "end1roundTime",
						type: "uint256"
					  },
					  {
						name: "snapshotTime",
						type: "uint256"
					  },
					  {
						name: "start2roundTime",
						type: "uint256"
					  },
					  {
						name: "end2roundTime",
						type: "uint256"
					  }
					],
					name: "params",
					type: "tuple"
				},
				{
					components: [
					  {
						name: "claimCounts",
						type: "uint256"
					  },
					  {
						name: "firstClaimPercent",
						type: "uint256"
					  },
					  {
						name: "firstClaimTime",
						type: "uint256"
					  },
					  {
						name: "secondClaimTime",
						type: "uint256"
					  },
					  {
						name: "roundInterval",
						type: "uint256"
					  }
					],
					name: "params2",
					type: "tuple"
				},
				{
					components: [
					  {
						name: "receiveAddress",
						type: "address"
					  },
					  {
						name: "totalClaimCount",
						type: "uint256"
					  },
					  {
						name: "firstClaimPercent",
						type: "uint256"
					  },
					  {
						name: "firstClaimTime",
						type: "uint256"
					  },
					  {
						name: "secondClaimTime",
						type: "uint256"
					  },
					  {
						name: "roundIntervalTime",
						type: "uint256"
					  },
					  {
						name: "fee",
						type: "uint24"
					  }
					],
					name: "params3",
					type: "tuple"
				  }
			  ]
		})

		const _setTier = Web3EthAbi.encodeFunctionSignature(
			"setTier(address,uint256,uint256,uint256,uint256)"
		)

		const _setTierPercents = Web3EthAbi.encodeFunctionSignature(
			"setTierPercents(address,uint256,uint256,uint256,uint256)"
		)

		const _setAllAmount = Web3EthAbi.encodeFunctionSignature(
			"setAllAmount(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256)"
		)

		const _set1RoundTime = Web3EthAbi.encodeFunctionSignature(
			"set1RoundTime(address,uint256,uint256,uint256,uint256)"
		)

		const _set2RoundTime = Web3EthAbi.encodeFunctionSignature(
			"set2RoundTime(address,uint256,uint256,uint256)"
		)

		const _setClaimTime = Web3EthAbi.encodeFunctionSignature(
			"setClaimTime(address,uint256,uint256,uint256,uint256,uint256)"
		)

		const _isL2ProjectManager = Web3EthAbi.encodeFunctionSignature(
			"isL2ProjectManager()"
		)

		const _isVaultAdmin = Web3EthAbi.encodeFunctionSignature(
			"isVaultAdmin(address,address)"
		)

		const _isL2Token = Web3EthAbi.encodeFunctionSignature(
			"isL2Token(address)"
		)

		await (await L2PublicSaleVaultProxy.setSelectorImplementations2(
            [
				_setL2ProjectManager,_setBurnBridge,_initialize,_setAddress,_setMaxMinPercent,
				_setSTOSstandard,_setDelayTime,_setVaultAdmin,_vaultInitialize4,
				_setTier,_setTierPercents,_setAllAmount,_set1RoundTime,_set2RoundTime,_setClaimTime,
				_isL2ProjectManager,_isVaultAdmin,_isL2Token
			],
            PublicSaleSettingAddr
        )).wait();
		console.log("setSelectorImplementations2 finish")
	}

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
