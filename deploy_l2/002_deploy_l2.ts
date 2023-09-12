import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { L2TokenFactory } from '../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../typechain-types/contracts/L2/L2ProjectManager.sol'
import { L2ProjectManagerProxy } from '../typechain-types/contracts/L2/L2ProjectManagerProxy'

/**
 * first
 deploying "L2TokenFactory" (tx: 0xdcc507115302e2f4b20864b60354d9b1ffeb5b4e89caf05ec817cf4acc81f749)...: deployed at 0xBB8e650d9BB5c44E54539851636DEFEF37585E67 with 2025434 gas
 deploying "L2ProjectManager" (tx: 0x41bccb121bdcd6f290fddff923c2b61eff2095b0fef438f1271d2143124abb4d)...: deployed at 0x62851a5a70bf13dF298982b86f62fa7A6B91db1e with 1370667 gas
*/

const deployL2: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL2 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL2 hre.network.name', hre.network.name)

    const { deployer, create2Deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

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


    //==== L2TokenFactory setL2ProjectManager   =================================
    const l2TokenFactory = (await hre.ethers.getContractAt(
        l2TokenFactoryDeployment.abi,
        l2TokenFactoryDeployment.address
    )) as L2TokenFactory;

    let l2ProjectManagerInTokenFactory = await l2TokenFactory.l2ProjectManager()
    if (l2ProjectManagerInTokenFactory != l2ProjectManager.address) {
        await (await l2TokenFactory.connect(deploySigner).setL2ProjectManager(l2ProjectManager.address)).wait()
    }

    //==== L2ProjectManager setL2TokenFactory =================================
    let l2TokenFactoryInL2ProjectManager = await l2ProjectManager.l2TokenFactory()
    if (l2TokenFactoryInL2ProjectManager != l2ProjectManager.address) {
        await (await l2ProjectManager.connect(deploySigner).setL2TokenFactory(l2TokenFactory.address)).wait()
    }

    //==== L2ProjectManager setL1ProjectManager =================================



    //==== L2ProjectManager setL2CrossDomainMessenger =================================


    //==== L2ProjectManager setTokamakVaults =================================

    //==== initialLiquidityVault  =================================

    //==== schedule Vault  =================================

    //==== nonSchedule Vault  =================================

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