import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { L1ERC20A_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../typechain-types/contracts/L1/L1ProjectManager.sol'
/**
 *
    deploying "LibProject" (tx: 0xbcf0fd407193a242c0400c4b9ba7b9b83c931aa8d625151bf801ccaa2aba9770)...: deployed at 0x9713c208F4F31609c9A014eB1f8CDf7090C5BcA1 with 179764 gas
    deploying "L1ERC20A_TokenFactory" (tx: 0x1132551c423d61b939bfb1525b7f8c64acd22acb18b74c120169794671d4b52f)...: deployed at 0x8a664F47338419AA45859aE763dc4EEe61886b21 with 2109120 gas
    deploying "L1ERC20B_TokenFactory" (tx: 0x7a46e779ea97eb90afa743cd384cbc490cfdcc1a700a2210394add3458b616a2)...: deployed at 0xaDcAf57aD40241E082ce07978c605d8cDfAcC710 with 2567747 gas
    deploying "L1ERC20C_TokenFactory" (tx: 0x7209c8291f6f4b520d2b73d929c7588f5f060a048a8ca4090d916215319844be)...: deployed at 0xAB51c5c5186eC67DB82Cc11601f4a04F46848E45 with 2908209 gas
    deploying "L1ERC20D_TokenFactory" (tx: 0x19d6c9b195f5794daede18d961f1ea471622a5aa21bbcdbad216e7349ef1c8a1)...: deployed at 0xDbCD784fFd874215D9ee2ac311Dda0F0B4a5509f with 2969460 gas
    deploying "L1ProjectManager" (tx: 0x9a32162229f00ed3f26e84d7f5590ed4a826dcdc19cc5280cdcf5d243e953564)...: deployed at 0xfb0e8707Df36B41E8D443cE7D353B9F9Db1eFA2f with 2447296 gas
 */
const deployL1: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL1 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL1 hre.network.name', hre.network.name)

    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    const deploySigner = await hre.ethers.getSigner(deployer);

    //==== LibProject =================================
    const LibProjectDeployment = await deploy("LibProject", {
        from: deployer,
        contract: "contracts/libraries/constants/LibProject.sol:LibProject",
        log: true
    })

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

    // const l1ERC20A_TokenFactory = (await hre.ethers.getContractAt(
    //     l1ERC20A_TokenFactoryDeployment.abi,
    //     l1ERC20A_TokenFactoryDeployment.address
    // )) as L1ERC20A_TokenFactory;

    // const l1ERC20B_TokenFactory = (await hre.ethers.getContractAt(
    //     l1ERC20A_TokenFactoryDeployment.abi,
    //     l1ERC20A_TokenFactoryDeployment.address
    // )) as L1ERC20B_TokenFactory;

    // const l1ERC20C_TokenFactory = (await hre.ethers.getContractAt(
    //     l1ERC20A_TokenFactoryDeployment.abi,
    //     l1ERC20A_TokenFactoryDeployment.address
    // )) as L1ERC20C_TokenFactory;

    // const l1ERC20D_TokenFactory = (await hre.ethers.getContractAt(
    //     l1ERC20A_TokenFactoryDeployment.abi,
    //     l1ERC20A_TokenFactoryDeployment.address
    // )) as L1ERC20D_TokenFactory;

    //==== L1ProjectManager =================================

    const L1ProjectManagerDeployment = await deploy("L1ProjectManager", {
        from: deployer,
        args: [],
        log: true,
        libraries: {
            LibProject: LibProjectDeployment.address
        }
    });

    // const l1ProjectManager = (await hre.ethers.getContractAt(
    //     L1ProjectManagerDeployment.abi,
    //     L1ProjectManagerDeployment.address
    // )) as L1ProjectManager;

    //==== initialize L1ProjectManager =================================

    // await l1ProjectManager.connect(deployer).setL1TokenFactories(
    //     [0,1,2,3],
    //     [
    //         l1ERC20A_TokenFactoryDeployment.address,
    //         l1ERC20B_TokenFactoryDeployment.address,
    //         l1ERC20C_TokenFactoryDeployment.address,
    //         l1ERC20D_TokenFactoryDeployment.address,
    //     ]
    // )

    //==== verify =================================

    if (hre.network.name != "hardhat") {
        await hre.run("etherscan-verify", {
            network: hre.network.name
        });
    }
};

export default deployL1;
deployL1.tags = [
    'ProjectLaunch_L1_deploy'
];