import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Create2Deployer } from '../typechain-types/contracts/L2/factory/Create2Deployer'

/**
 *
 *  accountForCreate2Deployer:
 *     'privatekey:// ',
 *  deployed "Create2Deployer" (tx: 0x210790892d8c64ae2bd0a3a5170f72d84bfe5f13556219b3958d0323ed5f8cc8)...: deployed at 0xCc604e58b61b4C7e976D384e8Bb21E586EBD315F with 138337 gas
 */
const deployCreate2Deployer: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL2 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL2 hre.network.name', hre.network.name)

    const { accountForCreate2Deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    //==== Create2Deployer =================================
    const create2Deployer = await deploy("Create2Deployer", {
        from: accountForCreate2Deployer,
        args: [],
        log: true,
    });
    console.log('create2Deployer', create2Deployer.address)
    //==== verify =================================

    // if (hre.network.name != "hardhat") {
    //     await hre.run("etherscan-verify", {
    //         network: hre.network.name
    //     });
    // }

};

export default deployCreate2Deployer;
deployCreate2Deployer.tags = [
    'Create2Deployer'
];