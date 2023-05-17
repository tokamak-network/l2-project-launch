import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { L1ERC20A_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../typechain-types/contracts/L1/L1ProjectManager'

const deployL1: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL1 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL1 hre.network.name', hre.network.name)
    if (hre.network.config.chainId != 5 ) return;

    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    const deploySigner = await hre.ethers.getSigner(deployer);

    //==== L1TokenFactory =================================
    const l1ERC20A_TokenFactoryDeployment = await deploy("L1ERC20A_TokenFactory", {
        from: deployer,
        args: [],
        log: true,
    });

    const l1ERC20B_TokenFactoryDeployment = await deploy("L1ERC20B_TokenFactory", {
        from: deployer,
        args: [],
        log: true,
    });

    const l1ERC20C_TokenFactoryDeployment = await deploy("L1ERC20C_TokenFactory", {
        from: deployer,
        args: [],
        log: true,
    });

    const l1ERC20D_TokenFactoryDeployment = await deploy("L1ERC20D_TokenFactory", {
        from: deployer,
        args: [],
        log: true,
    });

    const l1ERC20A_TokenFactory = (await hre.ethers.getContractAt(
        l1ERC20A_TokenFactoryDeployment.abi,
        l1ERC20A_TokenFactoryDeployment.address
    )) as L1ERC20A_TokenFactory;

    const l1ERC20B_TokenFactory = (await hre.ethers.getContractAt(
        l1ERC20A_TokenFactoryDeployment.abi,
        l1ERC20A_TokenFactoryDeployment.address
    )) as L1ERC20B_TokenFactory;

    const l1ERC20C_TokenFactory = (await hre.ethers.getContractAt(
        l1ERC20A_TokenFactoryDeployment.abi,
        l1ERC20A_TokenFactoryDeployment.address
    )) as L1ERC20C_TokenFactory;

    const l1ERC20D_TokenFactory = (await hre.ethers.getContractAt(
        l1ERC20A_TokenFactoryDeployment.abi,
        l1ERC20A_TokenFactoryDeployment.address
    )) as L1ERC20D_TokenFactory;

    //==== L1ProjectManager =================================

    const L1ProjectManagerDeployment = await deploy("L1ProjectManager", {
        from: deployer,
        args: [],
        log: true
    });

    const l1ProjectManager = (await hre.ethers.getContractAt(
        L1ProjectManagerDeployment.abi,
        L1ProjectManagerDeployment.address
    )) as L1ProjectManager;

    //==== initialize L1ProjectManager =================================

    //==== initialize L1ProjectManager =================================

    //==== verify =================================

    if (hre.network.name != "hardhat") {
        await hre.run("etherscan-verify", {
            network: hre.network.name
        });
    }

};

export default deployL1;