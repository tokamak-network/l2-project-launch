import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { L2TokenFactory } from '../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../typechain-types/contracts/L2/L2ProjectManager'

const deployL2: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('2 deployL2 hre.network.config.chainId', hre.network.config.chainId)
    console.log('2 deployL2 hre.network.name', hre.network.name)

    if (hre.network.config.chainId != 5050 ) return;

    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    const deploySigner = await hre.ethers.getSigner(deployer);

    //==== L2TokenFactory =================================
    const l2TokenFactoryDeployment = await deploy("L2TokenFactory", {
        from: deployer,
        args: [],
        log: true,
    });

    const l2TokenFactory = (await hre.ethers.getContractAt(
        l2TokenFactoryDeployment.abi,
        l2TokenFactoryDeployment.address
    )) as L2TokenFactory;

    //==== L2ProjectManager =================================

    const l2ProjectManagerDeployment = await deploy("L2ProjectManager", {
        from: deployer,
        args: [],
        log: true
    });

    const l2ProjectManager = (await hre.ethers.getContractAt(
        l2ProjectManagerDeployment.abi,
        l2ProjectManagerDeployment.address
    )) as L2ProjectManager;


    //==== initialize L2TokenFactory =================================
    await l2TokenFactory.connect(deployer).setL2ProjectManager(l2ProjectManager.address)

    //==== initialize L2ProjectManager =================================
    await l2ProjectManager.connect(deployer).setL2TokenFactory(l2TokenFactory.address)


};

export default deployL2;