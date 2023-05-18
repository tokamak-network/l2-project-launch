import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { L2TokenFactory } from '../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../typechain-types/contracts/L2/L2ProjectManager'

/**
 *
 deploying "L2TokenFactory" (tx: 0xdcc507115302e2f4b20864b60354d9b1ffeb5b4e89caf05ec817cf4acc81f749)...: deployed at 0xBB8e650d9BB5c44E54539851636DEFEF37585E67 with 2025434 gas
 deploying "L2ProjectManager" (tx: 0x41bccb121bdcd6f290fddff923c2b61eff2095b0fef438f1271d2143124abb4d)...: deployed at 0x62851a5a70bf13dF298982b86f62fa7A6B91db1e with 1370667 gas
*/
const deployL2: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL2 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL2 hre.network.name', hre.network.name)

    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    const deploySigner = await hre.ethers.getSigner(deployer);

    //==== L2TokenFactory =================================
    const l2TokenFactoryDeployment = await deploy("L2TokenFactory", {
        from: deployer,
        args: [],
        log: true,
    });

    // const l2TokenFactory = (await hre.ethers.getContractAt(
    //     l2TokenFactoryDeployment.abi,
    //     l2TokenFactoryDeployment.address
    // )) as L2TokenFactory;

    //==== L2ProjectManager =================================

    const l2ProjectManagerDeployment = await deploy("L2ProjectManager", {
        from: deployer,
        args: [],
        log: true
    });

    // const l2ProjectManager = (await hre.ethers.getContractAt(
    //     l2ProjectManagerDeployment.abi,
    //     l2ProjectManagerDeployment.address
    // )) as L2ProjectManager;


    // //==== initialize L2TokenFactory =================================
    // await l2TokenFactory.connect(deployer).setL2ProjectManager(l2ProjectManager.address)

    // //==== initialize L2ProjectManager =================================
    // await l2ProjectManager.connect(deployer).setL2TokenFactory(l2TokenFactory.address)
    //==== verify =================================

    // if (hre.network.name != "hardhat") {
    //     await hre.run("etherscan-verify", {
    //         network: hre.network.name
    //     });
    // }

};

export default deployL2;
deployL2.tags = [
    'ProjectLaunch_L2_deploy'
];