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

/**
 * first
 deploying "L2TokenFactory" (tx: 0xdcc507115302e2f4b20864b60354d9b1ffeb5b4e89caf05ec817cf4acc81f749)...: deployed at 0xBB8e650d9BB5c44E54539851636DEFEF37585E67 with 2025434 gas
 deploying "L2ProjectManager" (tx: 0x41bccb121bdcd6f290fddff923c2b61eff2095b0fef438f1271d2143124abb4d)...: deployed at 0x62851a5a70bf13dF298982b86f62fa7A6B91db1e with 1370667 gas
*/

/**
 *
deploying "L2TokenFactory" (tx: 0xb63c07c2aa223e2eeca0d20b88a13c9e9a2ef3c1a39d845909067ef8e7df4ecc)...: deployed at 0x42773CF37d7E2757a41d14ca130cD1aC8ac5064A with 2108047 gas
deploying "L2ProjectManager" (tx: 0xb68edecd66e28ca36532c8bda3a295a80aafd1d7437cc14793bee24571773285)...: deployed at 0xCc6848d160Dd9Cf3D58A5Aa4a5d0b2A116686A65 with 3075109 gas
deploying "L2ProjectManagerProxy" (tx: 0x4a9e3247dc6194f45c0b69bb7924e342319854d30abad8d1e7974155f5c31d33)...: deployed at 0x7A4710394a7f96028a517A9846b5aC3ECE6ebC62 with 1670893 gas
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


    console.log("-- 1. l2ProjectManager  ")
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

    console.log("-- setL2ProjectManager  ")

    //---- setL1Bridge =================================
    let l1BridgeInTokenFactory = await l2TokenFactory.l1Bridge()
    if (l1BridgeInTokenFactory != l1BridgeAddress) {
        await (await l2TokenFactory.connect(deploySigner).setL1Bridge(l1BridgeAddress)).wait()
    }

    console.log("-- setL1Bridge  ")

    //=================================
    //==== L2ProjectManager
    //---- setL2TokenFactory
    let l2TokenFactoryInL2ProjectManager = await l2ProjectManager.l2TokenFactory()
    if (l2TokenFactoryInL2ProjectManager != l2TokenFactory.address) {
        await (await l2ProjectManager.connect(deploySigner).setL2TokenFactory(l2TokenFactory.address)).wait()
    }


    console.log("-- setL2TokenFactory  ")


    //---- setL1ProjectManager
    let l1ProjectManagerAddress = get("l1ProjectManager");
    console.log("l1ProjectManagerAddress", l1ProjectManagerAddress)

    console.log('l1ProjectManagerAddress', l1ProjectManagerAddress)
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
    if (uniswapV3FactoryAddress != uniswapFactory.address) {
        await (await l2InitialLiquidity.connect(deploySigner).setUniswapInfo(
            uniswapFactory,
            npm,
            tonAddress,
            tosAddress
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