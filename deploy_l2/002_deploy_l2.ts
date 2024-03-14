import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import Web3EthAbi from "web3-eth-abi"
import { L2TokenFactory } from '../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../typechain-types/contracts/L2/L2ProjectManager.sol'
import { L2ProjectManagerProxy } from '../typechain-types/contracts/L2/L2ProjectManagerProxy'
import { L2InitialLiquidityVaultProxy } from '../typechain-types/contracts/L2/vaults/L2InitialLiquidityVaultProxy'
import { L2InitialLiquidityVault } from '../typechain-types/contracts/L2/vaults/L2InitialLiquidityVault.sol'
import { L2NonScheduleVault } from '../typechain-types/contracts/L2/vaults/L2NonScheduleVault'
import { L2ScheduleVault } from '../typechain-types/contracts/L2/vaults/L2ScheduleVault'
import { L2ScheduleVaultProxy } from '../typechain-types/contracts/L2/vaults/L2ScheduleVaultProxy'
import { L2CustomVaultBaseProxy } from '../typechain-types/contracts/L2/vaults/L2CustomVaultBaseProxy'
import { L1StosInL2Proxy } from '../typechain-types/contracts/L2/L1StosInL2Proxy'
import { L1StosInL2 } from '../typechain-types/contracts/L2/L1StosInL2.sol'
import { LockIdNftForRegisterProxy } from '../typechain-types/contracts/stos/LockIdNftForRegisterProxy'
import { LockIdNftForRegister } from '../typechain-types/contracts/stos/LockIdNftForRegister'
import { L2UniversalStosProxy } from '../typechain-types/contracts/L2/stos/L2UniversalStosProxy'
import { L2UniversalStos } from '../typechain-types/contracts/L2/stos/L2UniversalStos.sol'

import { L2DividendPoolForStosProxy } from '../typechain-types/contracts/L2/airdrop/L2DividendPoolForStosProxy'
import { L2DividendPoolForStos } from '../typechain-types/contracts/L2/airdrop/L2DividendPoolForStos.sol'
import { L2AirdropStosVaultProxy } from '../typechain-types/contracts/L2/vaults/L2AirdropStosVaultProxy'
import { L2AirdropStosVault } from '../typechain-types/contracts/L2/vaults/L2AirdropStosVault.sol'
import { L2AirdropTonVaultProxy } from '../typechain-types/contracts/L2/vaults/L2AirdropTonVaultProxy'
import { L2AirdropTonVault } from '../typechain-types/contracts/L2/vaults/L2AirdropTonVault.sol'

import { L2LpRewardVaultProxy } from '../typechain-types/contracts/L2/vaults/L2LpRewardVaultProxy'
import { L2LpRewardVault } from '../typechain-types/contracts/L2/vaults/L2LpRewardVault.sol'

import { LibPublicSaleVault } from '../typechain-types/contracts/libraries/LibPublicSaleVault.sol'
import { L2PublicSaleVaultProxy } from '../typechain-types/contracts/L2/vaults/L2PublicSaleVaultProxy'
import { L2PublicSaleVault } from '../typechain-types/contracts/L2/vaults/L2PublicSaleVault.sol'
import { L2PublicSaleProxy } from '../typechain-types/contracts/L2/vaults/L2PublicSaleProxy.sol'

import { L2VestingFundVaultProxy } from  "../typechain-types/contracts/L2/vaults/L2VestingFundVaultProxy"
import { L2VestingFundVault } from  "../typechain-types/contracts/L2/vaults/L2VestingFundVault.sol"

import { L1BurnVaultProxy } from  "../typechain-types/contracts/L1/L1BurnVaultProxy"
import { L1BurnVault } from  "../typechain-types/contracts/L1/L1BurnVault.sol"


let  L1ProjectManagerProxy = "0x980b2342624eDDbd7764633a3e7C7aC7C4c3ce96"
let  L1StosToL2_Address = "0x04666D3507F7be8B79e9304477284296C01DEC56"
let  l2StakeV2_Address = null

let L1BurnVaultProxy_Address = "0x2b9992dE82FAc2406c4008eB09E3BD6F2F5b8327"

/**
  2024.03.14 sepolia
 */
const deployL2: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL2 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL2 hre.network.name', hre.network.name)

    const { deployer, create2Deployer, l1BridgeAddress, l1MessengerAddress, l2MessengerAddress,
         uniswapFactory, npm, tosAddress, tonAddress,
         quoter, uniswapRouter
      } = await hre.getNamedAccounts();
    const { deploy, get } = hre.deployments;

    const deploySigner = await hre.ethers.getSigner(deployer);
    const create2Signer = await hre.ethers.getSigner(create2Deployer);

    //==== L2TokenFactory =================================
    const l2TokenFactoryDeployment = await deploy("L2TokenFactory", {
        from: deployer,
        args: [],
        log: true,
    });

    //==== L2ProjectManagerImpl =================================

    const l2ProjectManagerDeployment = await deploy("L2ProjectManager", {
        from: deployer,
        args: [],
        log: true
    });

    //==== L2ProjectManagerProxy =================================
    const L2ProjectManagerProxyDeployment = await deploy("L2ProjectManagerProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2ProjectManagerProxy = (await hre.ethers.getContractAt(
        L2ProjectManagerProxyDeployment.abi,
        L2ProjectManagerProxyDeployment.address
    )) as L2ProjectManagerProxy;

    //==== L2ProjectManagerProxy upgradeTo =================================
    let impl = await l2ProjectManagerProxy.implementation()
    // console.log('impl', impl)
    if (impl != l2ProjectManagerDeployment.address) {
        await (await l2ProjectManagerProxy.connect(deploySigner).upgradeTo(l2ProjectManagerDeployment.address)).wait()
    }

    //==== L2ProjectManager =================================
    const l2ProjectManager = (await hre.ethers.getContractAt(
        l2ProjectManagerDeployment.abi,
        L2ProjectManagerProxyDeployment.address
    )) as L2ProjectManager;
    // console.log('l2ProjectManager', l2ProjectManager.address)

    //=================================
    //==== L2TokenFactory
    //---- setL2ProjectManager
    const l2TokenFactory = (await hre.ethers.getContractAt(
        l2TokenFactoryDeployment.abi,
        l2TokenFactoryDeployment.address
    )) as L2TokenFactory;
    // console.log('l2TokenFactory', l2TokenFactory.address)

    let l2ProjectManagerInTokenFactory = await l2TokenFactory.l2ProjectManager()
    if (l2ProjectManagerInTokenFactory != l2ProjectManager.address) {
        await (await l2TokenFactory.connect(deploySigner).setL2ProjectManager(l2ProjectManager.address)).wait()
    }
    // console.log('l2ProjectManagerInTokenFactory', l2ProjectManagerInTokenFactory)

    //---- setL1Bridge =================================
    let l1Bridge = await l2TokenFactory.l1Bridge()
    if (l1BridgeAddress != null && l1Bridge != l1BridgeAddress) {
        await (await l2TokenFactory.connect(deploySigner).setL1Bridge(l1BridgeAddress)).wait()
    }
    // console.log('l1Bridge', l1Bridge)

    //=================================
    //==== L2ProjectManager
    //---- setL2TokenFactory
    let l2TokenFactoryInL2ProjectManager = await l2ProjectManager.l2TokenFactory()
    if (l2TokenFactoryInL2ProjectManager != l2TokenFactory.address) {
        await (await l2ProjectManager.connect(deploySigner).setL2TokenFactory(l2TokenFactory.address)).wait()
    }
    // console.log('setL2TokenFactory')

    //---- setL1ProjectManager
    let l1ProjectManagerAddress = L1ProjectManagerProxy;

    let l1ProjectManagerInL2ProjectManager = await l2ProjectManager.l1ProjectManager()
    if (l1ProjectManagerAddress != null && l1ProjectManagerAddress != "0x0000000000000000000000000000000000000000" &&
        l1ProjectManagerInL2ProjectManager != l1ProjectManagerAddress) {
        await (await l2ProjectManager.connect(deploySigner).setL1ProjectManager(l1ProjectManagerAddress)).wait()
    }
    // console.log('setL1ProjectManager')

    //---- setL2CrossDomainMessenger
    let l2CrossDomainMessenger = await l2ProjectManager.l2CrossDomainMessenger()
    // console.log('l2CrossDomainMessenger',l2CrossDomainMessenger)
    // console.log('l2MessengerAddress',l2MessengerAddress)

    if (l2CrossDomainMessenger != l2MessengerAddress) {
        await (await l2ProjectManager.connect(deploySigner).setL2CrossDomainMessenger(l2MessengerAddress)).wait()
    }
    // console.log('setL2CrossDomainMessenger')

    //=================================
    //==== initialLiquidityVault

    const L2InitialLiquidityVaultDeployment = await deploy("L2InitialLiquidityVault", {
        from: deployer,
        args: [],
        log: true
    });
    const L2InitialLiquidityVaultProxyDeployment = await deploy("L2InitialLiquidityVaultProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2InitialLiquidityVaultProxy = (await hre.ethers.getContractAt(
        L2InitialLiquidityVaultProxyDeployment.abi,
        L2InitialLiquidityVaultProxyDeployment.address
    )) as L2InitialLiquidityVaultProxy;

    impl = await l2InitialLiquidityVaultProxy.implementation()
    if (impl != L2InitialLiquidityVaultDeployment.address) {
        await (await l2InitialLiquidityVaultProxy.connect(deploySigner).upgradeTo(L2InitialLiquidityVaultDeployment.address)).wait()
    }
    // console.log('initialLiquidityVault upgradeTo')

    const l2InitialLiquidity  = (await hre.ethers.getContractAt(
        L2InitialLiquidityVaultDeployment.abi,
        L2InitialLiquidityVaultProxyDeployment.address
    )) as L2InitialLiquidityVault;

    let uniswapV3FactoryAddress = await l2InitialLiquidity.uniswapV3Factory()
    if (uniswapV3FactoryAddress != uniswapFactory) {
        await (await l2InitialLiquidity.connect(deploySigner).setUniswapInfo(
            uniswapFactory,
            npm,
            tonAddress,
            tosAddress
            )).wait()
    }
    // console.log('initialLiquidityVault setUniswapInfo')


    let l2ProjectManage1 = await l2InitialLiquidity.l2ProjectManager()
    if (l2ProjectManage1 != l2ProjectManager.address) {
        await (await l2InitialLiquidity.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }
    // console.log('initialLiquidityVault setL2ProjectManager')
    //=================================
    //==== LpRewardVault
    const L2LpRewardVaultDeployment = await deploy("L2LpRewardVault", {
        from: deployer,
        args: [],
        log: true
    });
    const L2LpRewardVaultProxyDeployment = await deploy("L2LpRewardVaultProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2LpRewardVaultProxy = (await hre.ethers.getContractAt(
        L2LpRewardVaultProxyDeployment.abi,
        L2LpRewardVaultProxyDeployment.address
    )) as L2LpRewardVaultProxy;


    impl = await l2LpRewardVaultProxy.implementation()
    if (impl != L2LpRewardVaultDeployment.address) {
        await (await l2LpRewardVaultProxy.connect(deploySigner).upgradeTo(L2LpRewardVaultDeployment.address)).wait()
    }

    const l2LpRewardVault = (await hre.ethers.getContractAt(
        L2LpRewardVaultDeployment.abi,
        L2LpRewardVaultProxyDeployment.address
    )) as L2LpRewardVault;

    let l2ProjectManage_l2LpRewardVault = await l2LpRewardVault.l2ProjectManager()
    if (l2ProjectManage_l2LpRewardVault != l2ProjectManager.address) {
        await (await l2LpRewardVault.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }

    const init_code_hash = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'
    let pool_init_code_hash = await l2LpRewardVault.pool_init_code_hash()
    if (pool_init_code_hash != init_code_hash) {
        await (await l2LpRewardVault.connect(deploySigner).setPoolInitCodeHash(
            init_code_hash
            )).wait()
    }

    let uniswapV3Factory_l2LpRewardVault = await l2LpRewardVault.uniswapV3Factory()
    if (uniswapV3Factory_l2LpRewardVault != uniswapFactory) {
        await (await l2LpRewardVault.connect(deploySigner).setUniswapV3Factory(
            uniswapFactory
            )).wait()
    }

    // let recipient_l2LpRewardVault = await l2LpRewardVault.recipient()
    // if (recipient_l2LpRewardVault != a(0)) {
    //     await (await l2LpRewardVault.connect(deploySigner).setL2ProjectManager(
    //         l2ProjectManager.address
    //         )).wait()
    // }

    //=================================
    //==== schedule Vault
    const L2ScheduleVaultDeployment = await deploy("L2ScheduleVault", {
        from: deployer,
        args: [],
        log: true
    });
    const L2ScheduleVaultProxyDeployment = await deploy("L2ScheduleVaultProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2ScheduleVaultProxy = (await hre.ethers.getContractAt(
        L2ScheduleVaultProxyDeployment.abi,
        L2ScheduleVaultProxyDeployment.address
    )) as L2ScheduleVaultProxy;

    impl = await l2ScheduleVaultProxy.implementation()
    if (impl != L2ScheduleVaultDeployment.address) {
        await (await l2ScheduleVaultProxy.connect(deploySigner).upgradeTo(L2ScheduleVaultDeployment.address)).wait()
    }

    const l2ScheduleVault = (await hre.ethers.getContractAt(
        L2ScheduleVaultDeployment.abi,
        L2ScheduleVaultProxyDeployment.address
    )) as L2ScheduleVault;

    let l2ProjectManage2 = await l2ScheduleVault.l2ProjectManager()
    if (l2ProjectManage2 != l2ProjectManager.address) {
        await (await l2ScheduleVault.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }

    //=================================
    //==== nonSchedule Vault
    const L2NonScheduleVaultDeployment = await deploy("L2NonScheduleVault", {
        from: deployer,
        args: [],
        log: true
    });
    const L2NonScheduleVaultProxyDeployment = await deploy("L2CustomVaultBaseProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2NonScheduleVaultProxy = (await hre.ethers.getContractAt(
        L2NonScheduleVaultProxyDeployment.abi,
        L2NonScheduleVaultProxyDeployment.address
    )) as L2CustomVaultBaseProxy;

    impl = await l2NonScheduleVaultProxy.implementation()

    if (impl != L2NonScheduleVaultDeployment.address) {
        await (await l2NonScheduleVaultProxy.connect(deploySigner).upgradeTo(L2NonScheduleVaultDeployment.address)).wait()
    }
    const l2NonScheduleVault = (await hre.ethers.getContractAt(
        L2NonScheduleVaultDeployment.abi,
        L2NonScheduleVaultProxyDeployment.address
    )) as L2NonScheduleVault;

    let l2ProjectManage3 = await l2NonScheduleVault.l2ProjectManager()
    if (l2ProjectManage3 != l2ProjectManager.address) {
        await (await l2NonScheduleVault.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }

    //==== L2AirdropStosVault =================================
    const L2AirdropStosVaultDeployment = await deploy("L2AirdropStosVault", {
        from: deployer,
        args: [],
        log: true
    });

    //==== L2AirdropStosVaultProxy =================================
    const L2AirdropStosVaultProxyDeployment = await deploy("L2AirdropStosVaultProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2AirdropStosVaultProxy = (await hre.ethers.getContractAt(
        L2AirdropStosVaultProxyDeployment.abi,
        L2AirdropStosVaultProxyDeployment.address
    )) as L2AirdropStosVaultProxy;


    //==== L2AirdropStosVaultProxy upgradeTo =================================
    let impl6 = await l2AirdropStosVaultProxy.implementation()
    if (impl6 != L2AirdropStosVaultDeployment.address) {
        await (await l2AirdropStosVaultProxy.connect(deploySigner).upgradeTo(L2AirdropStosVaultDeployment.address)).wait()
    }

    const l2AirdropStosVault = (await hre.ethers.getContractAt(
        L2AirdropStosVaultDeployment.abi,
        L2AirdropStosVaultProxyDeployment.address
    )) as L2AirdropStosVault;


    let l2ProjectManage4 = await l2AirdropStosVault.l2ProjectManager()
    if (l2ProjectManage4 != l2ProjectManager.address) {
        await (await l2AirdropStosVault.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }

    //==== L2AirdropTonVault =================================
    const L2AirdropTonVaultDeployment = await deploy("L2AirdropTonVault", {
        from: deployer,
        args: [],
        log: true
    });

    //==== L2AirdropTonVaultProxy =================================
    const L2AirdropTonVaultProxyDeployment = await deploy("L2AirdropTonVaultProxy", {
        from: deployer,
        args: [],
        log: true
    });
    // console.log('L2AirdropTonVaultProxy', L2AirdropTonVaultProxyDeployment.address)

    const l2AirdropTonVaultProxy = (await hre.ethers.getContractAt(
        L2AirdropTonVaultProxyDeployment.abi,
        L2AirdropTonVaultProxyDeployment.address
    )) as L2AirdropTonVaultProxy;

    //==== l2AirdropTonVaultProxy upgradeTo =================================
    let impl7 = await l2AirdropTonVaultProxy.implementation()
    if (impl7 != L2AirdropTonVaultDeployment.address) {
        await (await l2AirdropTonVaultProxy.connect(deploySigner).upgradeTo(L2AirdropTonVaultDeployment.address)).wait()
    }

    const l2AirdropTonVault = (await hre.ethers.getContractAt(
        L2AirdropTonVaultDeployment.abi,
        L2AirdropTonVaultProxyDeployment.address
    )) as L2AirdropTonVault;


    let l2ProjectManage5 = await l2AirdropTonVault.l2ProjectManager()
    if (l2ProjectManage5 != l2ProjectManager.address) {
        await (await l2AirdropTonVault.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }

    //==== LibPublicSaleVault =================================
    const LibPublicSaleVaultDeployment = await deploy("LibPublicSaleVault", {
        from: deployer,
        contract: "contracts/libraries/LibPublicSaleVault.sol:LibPublicSaleVault",
        log: true
    })
    //==== L2PublicSaleVaultProxy =================================
    const L2PublicSaleVaultProxyDep = await deploy("L2PublicSaleVaultProxy", {
        from: deployer,
        args: [],
        log: true,
    });
    const l2PublicSaleVaultProxy = (await hre.ethers.getContractAt(
        L2PublicSaleVaultProxyDep.abi,
        L2PublicSaleVaultProxyDep.address
    )) as L2PublicSaleVaultProxy;

	//==== L2PublicSaleVault =================================
	const L2PublicSaleVaultDeployment = await deploy("L2PublicSaleVault", {
		from: deployer,
		args: [],
		log: true,
		libraries: { LibPublicSaleVault: LibPublicSaleVaultDeployment.address }
	});

	//==== L2PublicSaleVault upgradeTo  =================================
	let impl8 = await l2PublicSaleVaultProxy.implementation()
    if (impl8 != L2PublicSaleVaultDeployment.address) {
        await (await l2PublicSaleVaultProxy.connect(deploySigner).upgradeTo(L2PublicSaleVaultDeployment.address)).wait()
    }


    //==== L2PublicSaleProxy  =================================
    const L2PublicSaleProxyDeployment = await deploy("L2PublicSaleProxy", {
        from: deployer,
        args: [],
        log: true
    });


	//==== L2PublicSaleProxy implementation2 =================================
	let logic1 = await l2PublicSaleVaultProxy.implementation2(1)
    if (logic1 != L2PublicSaleProxyDeployment.address){
        await (await l2PublicSaleVaultProxy.connect(deploySigner).setImplementation2(
            L2PublicSaleProxyDeployment.address, 1, true
        )).wait()
    }

	const _setL2ProjectManager = Web3EthAbi.encodeFunctionSignature(
		"setL2ProjectManager(address)"
	)
	let _setL2ProjectManager1 = await l2PublicSaleVaultProxy.getSelectorImplementation2(_setL2ProjectManager)
	if (_setL2ProjectManager1 != L2PublicSaleProxyDeployment.address){

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

		await (await l2PublicSaleVaultProxy.connect(deploySigner).setSelectorImplementations2(
            [
				_setL2ProjectManager,_setBurnBridge,_initialize,_setAddress,_setMaxMinPercent,
				_setSTOSstandard,_setDelayTime,_setVaultAdmin,_vaultInitialize4,
				_setTier,_setTierPercents,_setAllAmount,_set1RoundTime,_set2RoundTime,_setClaimTime,
				_isL2ProjectManager,_isVaultAdmin,_isL2Token
			],
            L2PublicSaleProxyDeployment.address
        )).wait();
	}

	const l2PublicSaleProxy = (await hre.ethers.getContractAt(
        L2PublicSaleProxyDeployment.abi,
        l2PublicSaleVaultProxy.address
    )) as L2PublicSaleProxy;

    let l2ProjectManager_l2PublicSaleVaultProxy = await l2PublicSaleVaultProxy.l2ProjectManager()

    if (l2ProjectManager_l2PublicSaleVaultProxy != l2ProjectManager.address) {
        await (await l2PublicSaleProxy.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }

    let minPer = await l2PublicSaleVaultProxy.minPer()
    if (minPer == 0) {
        await (await l2PublicSaleProxy.connect(deploySigner).setMaxMinPercent(5,10)).wait()
    }

    // L2VestingFundVaultProxy
    const L2VestingFundVaultProxyDep = await deploy("L2VestingFundVaultProxy", {
        from: deployer,
        args: [],
        log: true,
    });
    const l2VestingFundVaultProxy = (await hre.ethers.getContractAt(
        L2VestingFundVaultProxyDep.abi,
        L2VestingFundVaultProxyDep.address
    )) as L2VestingFundVaultProxy;

    //==== L2VestingFundVault  =================================
    const L2VestingFundVaultDeployment = await deploy("L2VestingFundVault", {
        from: deployer,
        args: [],
        log: true
    });

    //==== L2VestingFundVaultProxy upgradeTo  =================================
    let impl9 = await l2VestingFundVaultProxy.implementation()
    if (impl9 != L2VestingFundVaultDeployment.address) {
         await (await l2VestingFundVaultProxy.connect(deploySigner).upgradeTo(L2VestingFundVaultDeployment.address)).wait()
    }

    let uniswapV3Factory_l2VestingFundVaultProxy = await l2VestingFundVaultProxy.uniswapV3Factory()
    if(uniswapV3Factory_l2VestingFundVaultProxy != uniswapFactory) {
        await (await l2VestingFundVaultProxy.connect(deploySigner).setBaseInfoProxy(
            tonAddress,
            tosAddress,
            l2ProjectManager.address,
            l2PublicSaleVaultProxy.address,
            uniswapFactory
            )).wait()
    }

    let l1BurnVault_l2PublicSaleProxy = await l2PublicSaleProxy.l1burnVault()
    if (L1BurnVaultProxy_Address != null && L1BurnVaultProxy_Address != "0x0000000000000000000000000000000000000000"
        && l1BurnVault_l2PublicSaleProxy != L1BurnVaultProxy_Address) {
        await (await l2PublicSaleProxy.connect(deploySigner).setBurnBridge(
            l1BridgeAddress,
            L1BurnVaultProxy_Address
        )).wait()
    }

    //---- setTokamakVaults
    /*
    address publicSale,
        address initialLiquidity,
        address liquidityReward,
        address tonAirdrop,
        address tosAirdrop,
        address _scheduleVault,
        address _nonScheduleVault
        */

    let publicSaleVault = await l2ProjectManager.publicSaleVault()
    let initialLiquidityVault = await l2ProjectManager.initialLiquidityVault()
    let lpRewardVault = await l2ProjectManager.liquidityRewardVault()
    let scheduleVault = await l2ProjectManager.scheduleVault()
    let nonScheduleVault = await l2ProjectManager.initialLiquidityVault()
    let tosAirdropVault = await l2ProjectManager.tosAirdropVault()
    let tonAirdropVault = await l2ProjectManager.tonAirdropVault()

    if (publicSaleVault != l2PublicSaleVaultProxy.address ||
        initialLiquidityVault != l2InitialLiquidityVaultProxy.address ||
        lpRewardVault != l2LpRewardVaultProxy.address ||
        scheduleVault != l2ScheduleVaultProxy.address ||
        nonScheduleVault != l2NonScheduleVaultProxy.address ||
        tosAirdropVault != l2AirdropStosVaultProxy.address ||
        tonAirdropVault != L2AirdropTonVaultProxyDeployment.address
        ) {
        await (await l2ProjectManager.connect(deploySigner).setTokamakVaults(
            l2PublicSaleVaultProxy.address,
            l2InitialLiquidityVaultProxy.address,
            l2LpRewardVaultProxy.address,
            L2AirdropTonVaultProxyDeployment.address,
            l2AirdropStosVaultProxy.address,
            l2ScheduleVaultProxy.address,
            l2NonScheduleVaultProxy.address
        )).wait()
    }

    //==== L1StosInL2 =================================
    const L1StosInL2Deployment = await deploy("L1StosInL2", {
        from: deployer,
        args: [],
        log: true
    });

    //==== L1StosInL2Proxy =================================
    const L1StosInL2ProxyProxyDeployment = await deploy("L1StosInL2Proxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l1StosInL2Proxy = (await hre.ethers.getContractAt(
        L1StosInL2ProxyProxyDeployment.abi,
        L1StosInL2ProxyProxyDeployment.address
    )) as L1StosInL2Proxy;

    //==== L1StosInL2Proxy upgradeTo =================================
    let impl2 = await l1StosInL2Proxy.implementation()
    if (impl2 != L1StosInL2Deployment.address) {
        await (await l1StosInL2Proxy.connect(deploySigner).upgradeTo(L1StosInL2Deployment.address)).wait()
    }

    impl2 = await l1StosInL2Proxy.implementation()

    const l1StosInL2 = (await hre.ethers.getContractAt(
        L1StosInL2Deployment.abi,
        l1StosInL2Proxy.address
    )) as L1StosInL2;

    let l2CrossDomainMessenger_l1StosInL2Proxy = await l1StosInL2Proxy.l2CrossDomainMessenger()

    if (l2CrossDomainMessenger_l1StosInL2Proxy != l2MessengerAddress) {
        await (await l1StosInL2.connect(deploySigner)["initialize(address,address)"](
            deployer, l2MessengerAddress)).wait()
    }
    l2CrossDomainMessenger_l1StosInL2Proxy = await l1StosInL2Proxy.l2CrossDomainMessenger()

    //---- LockIdNftForRegister
    const lockIdNFTInfoL1 = {
        name: "L1 STOS",
        symbol: "STOS",
        version: "1.0",
        epochUnit: 60*60*24*7,
        maxTime : 60*60*24*365*3
    }

    //==== LockIdNftForRegister =================================
    const LockIdNftForRegisterDeployment = await deploy("LockIdNftForRegister", {
        from: deployer,
        args: [],
        log: true
    });

    //==== LockIdNftForRegisterProxy =================================
    const LockIdNftForRegisterProxyDeployment = await deploy("LockIdNftForRegisterProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const lockIdNftForRegisterProxy = (await hre.ethers.getContractAt(
        LockIdNftForRegisterProxyDeployment.abi,
        LockIdNftForRegisterProxyDeployment.address
    )) as LockIdNftForRegisterProxy;


    //==== L1StosInL2Proxy upgradeTo =================================
    let impl3 = await lockIdNftForRegisterProxy.implementation()
    if (impl3 != LockIdNftForRegisterDeployment.address) {
        await (await lockIdNftForRegisterProxy.connect(deploySigner).upgradeTo(LockIdNftForRegisterDeployment.address)).wait()
    }
    const lockIdNftForRegister = (await hre.ethers.getContractAt(
        LockIdNftForRegisterDeployment.abi,
        lockIdNftForRegisterProxy.address
    )) as LockIdNftForRegister;

    // let epochUnit = await lockIdNftForRegister.epochUnit()
    let manager  = await lockIdNftForRegisterProxy._manager()

    if (l1StosInL2Proxy.address != manager) {
        await (await lockIdNftForRegister.connect(deploySigner).initialize(
            lockIdNFTInfoL1.name,
            lockIdNFTInfoL1.symbol,
            l1StosInL2Proxy.address,
            lockIdNFTInfoL1.epochUnit,
            lockIdNFTInfoL1.maxTime
        )).wait()
    }

    let lockIdNftForRegister_l1StosInL2 = await l1StosInL2.lockIdNftForRegister()

    if (lockIdNftForRegister_l1StosInL2 != lockIdNftForRegister.address) {
        await (await l1StosInL2.connect(deploySigner).setLockIdNft(lockIdNftForRegister.address)).wait()
    }

    // set L1 register (L1StosToL2)
    let l1Register_l1StosInL2 = await l1StosInL2.l1Register()

    if (L1StosToL2_Address != null && L1StosToL2_Address != "0x0000000000000000000000000000000000000000"
         && l1Register_l1StosInL2 != L1StosToL2_Address) {
        await (await l1StosInL2.connect(deploySigner).setL1Register(L1StosToL2_Address)).wait()
    }

    //==== L2UniversalStos =================================
    const L2UniversalStosDeployment = await deploy("L2UniversalStos", {
        from: deployer,
        args: [],
        log: true
    });

    //==== L2UniversalStosProxy =================================
    const L2UniversalStosProxyDeployment = await deploy("L2UniversalStosProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2UniversalStosProxy = (await hre.ethers.getContractAt(
        L2UniversalStosProxyDeployment.abi,
        L2UniversalStosProxyDeployment.address
    )) as L2UniversalStosProxy;


    //==== L2UniversalStosProxy upgradeTo =================================
    let impl4 = await l2UniversalStosProxy.implementation()
    if (impl4 != L2UniversalStosDeployment.address) {
        await (await l2UniversalStosProxy.connect(deploySigner).upgradeTo(L2UniversalStosDeployment.address)).wait()
    }
    const l2UniversalStos = (await hre.ethers.getContractAt(
        L2UniversalStosDeployment.abi,
        L2UniversalStosProxyDeployment.address
    )) as L2UniversalStos;

    let l2StakeV2_l2UniversalStos  = await l2UniversalStos.l2StakeV2()
    if (l2StakeV2_Address != null && l2StakeV2_Address != "0x0000000000000000000000000000000000000000"
        && l2StakeV2_l2UniversalStos != l2StakeV2_Address) {
        await (await l2UniversalStos.connect(deploySigner).setL2Stakev2(
            l2StakeV2_Address
        )).wait()
    }

    let lockIdNftForRegister_l2UniversalStos  = await l2UniversalStos.lockIdNftForRegister()
    if (lockIdNftForRegister_l2UniversalStos != lockIdNftForRegisterProxy.address) {
        await (await l2UniversalStos.connect(deploySigner).setLockIdNftForRegister(
            lockIdNftForRegisterProxy.address
        )).wait()
    }

    //==== L2DividendPoolForStos =================================
    const L2DividendPoolForStosDeployment = await deploy("L2DividendPoolForStos", {
        from: deployer,
        args: [],
        log: true
    });

    //==== L2DividendPoolForStosProxy =================================
    const L2DividendPoolForStosProxyDeployment = await deploy("L2DividendPoolForStosProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l2DividendPoolForStosProxy = (await hre.ethers.getContractAt(
        L2DividendPoolForStosProxyDeployment.abi,
        L2DividendPoolForStosProxyDeployment.address
    )) as L2DividendPoolForStosProxy;


    //==== L2DividendPoolForStosProxy upgradeTo =================================
    let impl5 = await l2DividendPoolForStosProxy.implementation()
    if (impl5 != L2DividendPoolForStosDeployment.address) {
        await (await l2DividendPoolForStosProxy.connect(deploySigner).upgradeTo(L2DividendPoolForStosDeployment.address)).wait()
    }

    const l2DividendPoolForStos = (await hre.ethers.getContractAt(
        L2DividendPoolForStosDeployment.abi,
        L2DividendPoolForStosProxyDeployment.address
    )) as L2DividendPoolForStos;


    let universalStos_l2DividendPoolForStos  = await l2DividendPoolForStos.universalStos()
    if (universalStos_l2DividendPoolForStos != L2UniversalStosProxyDeployment.address) {
        await (await l2DividendPoolForStos.connect(deploySigner).initialize(
            L2UniversalStosProxyDeployment.address,
            lockIdNFTInfoL1.epochUnit
        )).wait()
    }


    let dividendPool_l2AirdropStosVault  = await l2AirdropStosVault.dividendPool()
    if (dividendPool_l2AirdropStosVault != L2DividendPoolForStosProxyDeployment.address) {
        await (await l2AirdropStosVault.connect(deploySigner).setDividendPool(
            L2DividendPoolForStosProxyDeployment.address,
        )).wait()
    }

	let delayTime = 600
	let standardTier1 = hre.ethers.utils.parseUnits("100", 18)
	let standardTier2 = hre.ethers.utils.parseUnits("200", 18)
	let standardTier3 = hre.ethers.utils.parseUnits("1000", 18)
	let standardTier4 = hre.ethers.utils.parseUnits("4000", 18)

    let quoter_l2PublicSaleProxy = await l2PublicSaleProxy.quoter()
    let lockTOS_l2PublicSaleProxy = await l2PublicSaleProxy.lockTOS()
    if(quoter_l2PublicSaleProxy != quoter ||
        lockTOS_l2PublicSaleProxy != L2UniversalStosProxyDeployment.address) {
		await (await l2PublicSaleProxy.connect(deploySigner).initialize(
			[
				quoter,
				l2VestingFundVaultProxy.address,
				l2InitialLiquidityVaultProxy.address,
				uniswapRouter,
				L2UniversalStosProxyDeployment.address,
				tosAddress,
				tonAddress
			],
			5,
			10,
			standardTier1,
			standardTier2,
			standardTier3,
			standardTier4,
			delayTime
		)).wait()
    }

    // ==== verify =================================
    if (hre.network.name != "hardhat") {
        await hre.run("etherscan-verify", {
            network: hre.network.name
        });
    }

};

export default deployL2;
deployL2.tags = [
    'ProjectLaunch_L2_deploy'
];
