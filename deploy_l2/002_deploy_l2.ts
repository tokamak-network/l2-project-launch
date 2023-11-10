import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

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


let  L1ProjectManagerProxy = "0x3eD0776A8E323a294cd704c02a349ca1B83554da"
let  L1StosToL2_Address = "0x25280A873ef2702fF581260a7e15F246A3c52Efb"
let  l2StakeV2_Address = null

/**
 * first
 deploying "L2TokenFactory" (tx: 0xdcc507115302e2f4b20864b60354d9b1ffeb5b4e89caf05ec817cf4acc81f749)...: deployed at 0xBB8e650d9BB5c44E54539851636DEFEF37585E67 with 2025434 gas
 deploying "L2ProjectManager" (tx: 0x41bccb121bdcd6f290fddff923c2b61eff2095b0fef438f1271d2143124abb4d)...: deployed at 0x62851a5a70bf13dF298982b86f62fa7A6B91db1e with 1370667 gas
*/

/**
 * 2023.9.18
reusing "L2TokenFactory" at 0x42773CF37d7E2757a41d14ca130cD1aC8ac5064A
reusing "L2ProjectManager" at 0x8d7fea6E3fBcC90BE1c8080aB0e819DB2A2CCb4f
reusing "L2ProjectManagerProxy" at 0x7A4710394a7f96028a517A9846b5aC3ECE6ebC62
reusing "L2InitialLiquidityVault" at 0xB8Bc738947DB3Fc42f24Be7bC6eaf2Ad85a38602
reusing "L2InitialLiquidityVaultProxy" at 0xCaa2F1Dd477703B5531f26e3CD455340dF0B9aaf
reusing "L2ScheduleVault" at 0x270758e04385c5C92cE1dDF5F466280ebd686212
reusing "L2ScheduleVaultProxy" at 0x643512d2205E15a723ee2fe9B2871a75699Db37d
reusing "L2NonScheduleVault" at 0x191864367707CaE5bA218D6779d4883Eed078Dd2
reusing "L2CustomVaultBaseProxy" at 0x0779606501F1A61557A1A201DB82EBCB5B326859
*/

/**
 * 2023.11.8
  reusing "L2TokenFactory" at 0x42773CF37d7E2757a41d14ca130cD1aC8ac5064A
reusing "L2ProjectManager" at 0xACfea3d759DeA62ae06a926b19b226E2C7cFe2a3
reusing "L2ProjectManagerProxy" at 0x7A4710394a7f96028a517A9846b5aC3ECE6ebC62
reusing "L2InitialLiquidityVault" at 0xB8Bc738947DB3Fc42f24Be7bC6eaf2Ad85a38602
reusing "L2InitialLiquidityVaultProxy" at 0xCaa2F1Dd477703B5531f26e3CD455340dF0B9aaf
reusing "L2ScheduleVault" at 0x270758e04385c5C92cE1dDF5F466280ebd686212
reusing "L2ScheduleVaultProxy" at 0x643512d2205E15a723ee2fe9B2871a75699Db37d
reusing "L2NonScheduleVault" at 0x191864367707CaE5bA218D6779d4883Eed078Dd2
reusing "L2CustomVaultBaseProxy" at 0x0779606501F1A61557A1A201DB82EBCB5B326859
reusing "L1StosInL2" at 0xd83A67290124566Aa900356F77Ca1a86574db578
reusing "L1StosInL2Proxy" at 0xa12431D37095CA8e3C04Eb1a4e7cE235718F10bF
reusing "LockIdNftForRegister" at 0xF8E19c8fE9dABC5B3C5B5A6F7eFD4BcE1d0Aff5B
reusing "LockIdNftForRegisterProxy" at 0x4b3fB26396C6740341cB36E2D3325b1163421385
 */
const deployL2: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL2 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL2 hre.network.name', hre.network.name)

    const { deployer, create2Deployer, l1BridgeAddress, l1MessengerAddress, l2MessengerAddress,
         uniswapFactory, npm, tosAddress, tonAddress
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
    if (impl != l2ProjectManagerDeployment.address) {
        await (await l2ProjectManagerProxy.connect(deploySigner).upgradeTo(l2ProjectManagerDeployment.address)).wait()
    }

    //==== L2ProjectManager =================================
    const l2ProjectManager = (await hre.ethers.getContractAt(
        l2ProjectManagerDeployment.abi,
        L2ProjectManagerProxyDeployment.address
    )) as L2ProjectManager;

    //=================================
    //==== L2TokenFactory
    //---- setL2ProjectManager
    const l2TokenFactory = (await hre.ethers.getContractAt(
        l2TokenFactoryDeployment.abi,
        l2TokenFactoryDeployment.address
    )) as L2TokenFactory;

    let l2ProjectManagerInTokenFactory = await l2TokenFactory.l2ProjectManager()
    if (l2ProjectManagerInTokenFactory != l2ProjectManager.address) {
        await (await l2TokenFactory.connect(deploySigner).setL2ProjectManager(l2ProjectManager.address)).wait()
    }

    //---- setL1Bridge =================================
    let l1Bridge = await l2TokenFactory.l1Bridge()
    if (l1Bridge != l1BridgeAddress) {
        await (await l2TokenFactory.connect(deploySigner).setL1Bridge(l1BridgeAddress)).wait()
    }

    //=================================
    //==== L2ProjectManager
    //---- setL2TokenFactory
    let l2TokenFactoryInL2ProjectManager = await l2ProjectManager.l2TokenFactory()
    if (l2TokenFactoryInL2ProjectManager != l2TokenFactory.address) {
        await (await l2ProjectManager.connect(deploySigner).setL2TokenFactory(l2TokenFactory.address)).wait()
    }

    //---- setL1ProjectManager
    let l1ProjectManagerAddress = L1ProjectManagerProxy;

    let l1ProjectManagerInL2ProjectManager = await l2ProjectManager.l1ProjectManager()
    if (l1ProjectManagerInL2ProjectManager != l1ProjectManagerAddress) {
        await (await l2ProjectManager.connect(deploySigner).setL1ProjectManager(l1ProjectManagerAddress)).wait()
    }

    //---- setL2CrossDomainMessenger
    let l2CrossDomainMessenger = await l2ProjectManager.l2CrossDomainMessenger()
    if (l2CrossDomainMessenger != l2MessengerAddress) {
        await (await l2ProjectManager.connect(deploySigner).setL2CrossDomainMessenger(l2MessengerAddress)).wait()
    }
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
    let l2ProjectManage1 = await l2InitialLiquidity.l2ProjectManager()
    if (l2ProjectManage1 != l2ProjectManager.address) {
        await (await l2InitialLiquidity.connect(deploySigner).setL2ProjectManager(
            l2ProjectManager.address
            )).wait()
    }
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
    let initialLiquidityVault = await l2ProjectManager.initialLiquidityVault()
    let scheduleVault = await l2ProjectManager.scheduleVault()
    let nonScheduleVault = await l2ProjectManager.initialLiquidityVault()


    if (initialLiquidityVault != l2InitialLiquidityVaultProxy.address ||
        scheduleVault != l2ScheduleVaultProxy.address ||
        nonScheduleVault != l2NonScheduleVaultProxy.address
        ) {
        await (await l2ProjectManager.connect(deploySigner).setTokamakVaults(
            hre.ethers.constants.AddressZero,
            l2InitialLiquidityVaultProxy.address,
            hre.ethers.constants.AddressZero,
            hre.ethers.constants.AddressZero,
            hre.ethers.constants.AddressZero,
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

    if (L1StosToL2_Address != null && l1Register_l1StosInL2 != L1StosToL2_Address) {
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
    if (l2StakeV2_Address != null && l2StakeV2_l2UniversalStos != l2StakeV2_Address) {
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


    let dividendPool_l2AirdropStosVault  = await l2AirdropStosVault.dividendPool()
    if (dividendPool_l2AirdropStosVault != L2DividendPoolForStosProxyDeployment.address) {
        await (await l2AirdropStosVault.connect(deploySigner).setDividendPool(
            L2DividendPoolForStosProxyDeployment.address,
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