import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { L1ERC20A_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../typechain-types/contracts/L1/L1ProjectManager.sol'
import { L1ProjectManagerProxy } from '../typechain-types/contracts/L1/L1ProjectManagerProxy'
import { L1StosToL2Proxy } from '../typechain-types/contracts/L1/L1StosToL2Proxy'
import { L1StosToL2 } from '../typechain-types/contracts/L1/L1StosToL2.sol'

import { L1BurnVaultProxy } from  "../typechain-types/contracts/L1/L1BurnVaultProxy"
import { L1BurnVault } from  "../typechain-types/contracts/L1/L1BurnVault.sol"

// "L1StosInL2Proxy" at 0xa12431D37095CA8e3C04Eb1a4e7cE235718F10bF
// const L1StosInL2_Address = "0xa12431D37095CA8e3C04Eb1a4e7cE235718F10bF"
const L1StosInL2_Address = null
const publicSaleInfoZero = {minPercents: 5, maxPercents: 10, delayTime: 100}

/**
 * first
    deploying "LibProject" (tx: 0xbcf0fd407193a242c0400c4b9ba7b9b83c931aa8d625151bf801ccaa2aba9770)...: deployed at 0x9713c208F4F31609c9A014eB1f8CDf7090C5BcA1 with 179764 gas
    deploying "L1ERC20A_TokenFactory" (tx: 0x1132551c423d61b939bfb1525b7f8c64acd22acb18b74c120169794671d4b52f)...: deployed at 0x8a664F47338419AA45859aE763dc4EEe61886b21 with 2109120 gas
    deploying "L1ERC20B_TokenFactory" (tx: 0x7a46e779ea97eb90afa743cd384cbc490cfdcc1a700a2210394add3458b616a2)...: deployed at 0xaDcAf57aD40241E082ce07978c605d8cDfAcC710 with 2567747 gas
    deploying "L1ERC20C_TokenFactory" (tx: 0x7209c8291f6f4b520d2b73d929c7588f5f060a048a8ca4090d916215319844be)...: deployed at 0xAB51c5c5186eC67DB82Cc11601f4a04F46848E45 with 2908209 gas
    deploying "L1ERC20D_TokenFactory" (tx: 0x19d6c9b195f5794daede18d961f1ea471622a5aa21bbcdbad216e7349ef1c8a1)...: deployed at 0xDbCD784fFd874215D9ee2ac311Dda0F0B4a5509f with 2969460 gas
    deploying "L1ProjectManager" (tx: 0x9a32162229f00ed3f26e84d7f5590ed4a826dcdc19cc5280cdcf5d243e953564)...: deployed at 0xfb0e8707Df36B41E8D443cE7D353B9F9Db1eFA2f with 2447296 gas
 */
/**
 *  2023.09.12
    deploying "LibProject" (tx: 0x7f67c49ead3cd6e55d65ddc507d9570a749387eeb1ec73170461c1ff1c06744e)...: deployed at 0xF5657e40Ec1F27F0fc04F82a1190095E366D131D with 767325 gas
    reusing "L1ERC20A_TokenFactory" at 0x8a664F47338419AA45859aE763dc4EEe61886b21
    reusing "L1ERC20B_TokenFactory" at 0xaDcAf57aD40241E082ce07978c605d8cDfAcC710
    reusing "L1ERC20C_TokenFactory" at 0xAB51c5c5186eC67DB82Cc11601f4a04F46848E45
    reusing "L1ERC20D_TokenFactory" at 0xDbCD784fFd874215D9ee2ac311Dda0F0B4a5509f
    deploying "L1ProjectManager" (tx: 0xdec74fcd5550d2707b6df3a433ab6ac002a377e17af9060d67d1094e97d71ea8)...: deployed at 0x07328373a5c5c3017bE1Db8992Dd2eBAbe21D629 with 3525081 gas
    deploying "L1ProjectManagerProxy" (tx: 0xb2669c4716af7e6d19c746239a041b0f4a37045a7e5331261c96398cbf68f9f6)...: deployed at 0x3eD0776A8E323a294cd704c02a349ca1B83554da with 1642193 gas
*/
/**
 * 2023.11.08
reusing "LibProject"  0x5d85cD9D3e2864D4a156497083eb6E4394bF8aae
reusing "L1ERC20A_TokenFactory" at 0x8a664F47338419AA45859aE763dc4EEe61886b21
reusing "L1ERC20B_TokenFactory" at 0xaDcAf57aD40241E082ce07978c605d8cDfAcC710
reusing "L1ERC20C_TokenFactory" at 0xAB51c5c5186eC67DB82Cc11601f4a04F46848E45
reusing "L1ERC20D_TokenFactory" at 0xDbCD784fFd874215D9ee2ac311Dda0F0B4a5509f
reusing "L1ProjectManager" at 0xc0C1162126d01979b0DBc07c1A10c22f9a1e7678
reusing "L1ProjectManagerProxy" at 0x3eD0776A8E323a294cd704c02a349ca1B83554da
reusing "L1StosToL2" at 0xF6340b66a7790e5bd4dE29F4575a6012D4126032
reusing "L1StosToL2Proxy" at 0x25280A873ef2702fF581260a7e15F246A3c52Efb
 */
const deployL1: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('deployL1 hre.network.config.chainId', hre.network.config.chainId)
    console.log('deployL1 hre.network.name', hre.network.name)

    const { deployer, lockTOSAddress, addressManager} = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    const deploySigner = await hre.ethers.getSigner(deployer);

    //==== LibProject =================================
    const LibProjectDeployment = await deploy("LibProject", {
        from: deployer,
        contract: "contracts/libraries/LibProject.sol:LibProject",
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

    //==== L1ProjectManagerImpl =================================

    const L1ProjectManagerDeployment = await deploy("L1ProjectManager", {
        from: deployer,
        args: [],
        log: true,
        libraries: {
            LibProject: LibProjectDeployment.address
        }
    });

    //==== L1ProjectManagerProxy =================================
    const L1ProjectManagerProxyDeployment = await deploy("L1ProjectManagerProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l1ProjectManagerProxy = (await hre.ethers.getContractAt(
        L1ProjectManagerProxyDeployment.abi,
        L1ProjectManagerProxyDeployment.address
    )) as L1ProjectManagerProxy;

    //==== L1ProjectManagerProxy upgradeTo =================================
    let impl = await l1ProjectManagerProxy.implementation()
    if (impl != L1ProjectManagerDeployment.address) {
        await (await l1ProjectManagerProxy.connect(deploySigner).upgradeTo(L1ProjectManagerDeployment.address)).wait()
    }

    //==== L1ProjectManager =================================
    const l1ProjectManager = (await hre.ethers.getContractAt(
        L1ProjectManagerDeployment.abi,
        L1ProjectManagerProxyDeployment.address
    )) as L1ProjectManager;

    //==== L1ProjectManager setL1TokenFactories =================================
    let l1TokenFactory0 = await l1ProjectManager.l1TokenFactory(0)
    if (l1TokenFactory0 == hre.ethers.constants.AddressZero) {
        await l1ProjectManager.connect(deploySigner).setL1TokenFactories(
            [0,1,2,3],
            [
                l1ERC20A_TokenFactoryDeployment.address,
                l1ERC20B_TokenFactoryDeployment.address,
                l1ERC20C_TokenFactoryDeployment.address,
                l1ERC20D_TokenFactoryDeployment.address,
            ]
        )
    }

    //==== L1ProjectManager setL2Infos =================================
    let l2Info = {
        l2TokenFactory: '0x52D3b95E94863590D9A366718C2C839510b68b60',
        l2ProjectManager: '0xEaFa9b1436B9c25d40CA0e25ba142fc0C9C09b1a',
        depositMinGasLimit: 300000,
        sendMsgMinGasLimit: 2000000 // => 1021609.2
    }
    let viewl2Info = await l1ProjectManager.viewL2Info(0);

    // if (viewl2Info.l2ProjectManager != l2Info.l2ProjectManager) {
    if (viewl2Info.sendMsgMinGasLimit != l2Info.sendMsgMinGasLimit) {
        await l1ProjectManager.connect(deploySigner).setL2Infos(
            0,
            l2Info.l2TokenFactory,
            l2Info.l2ProjectManager,
            l2Info.depositMinGasLimit,
            l2Info.sendMsgMinGasLimit
        )
    }

    //==== L1StosToL2 =================================

    const L1StosToL2Deployment = await deploy("L1StosToL2", {
        from: deployer,
        args: [],
        log: true,
        libraries: {
            LibProject: LibProjectDeployment.address
        }
    });

    //==== L1StosToL2Proxy =================================
    const L1StosToL2ProxyProxyDeployment = await deploy("L1StosToL2Proxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l1StosToL2Proxy = (await hre.ethers.getContractAt(
        L1StosToL2ProxyProxyDeployment.abi,
        L1StosToL2ProxyProxyDeployment.address
    )) as L1StosToL2Proxy;

    //==== L1StosToL2Proxy upgradeTo =================================
    let impl1 = await l1StosToL2Proxy.implementation()
    if (impl1 != L1StosToL2Deployment.address) {
        await (await l1StosToL2Proxy.connect(deploySigner).upgradeTo(L1StosToL2Deployment.address)).wait()
    }

    const l1StosToL2 = (await hre.ethers.getContractAt(
        L1StosToL2Deployment.abi,
        L1StosToL2ProxyProxyDeployment.address
    )) as L1StosToL2;

    let lockTosAddr = await l1StosToL2Proxy.lockTos()
    if(lockTosAddr != lockTOSAddress) {
        await (await l1StosToL2.connect(deploySigner).initialize(
          deployer,
          lockTOSAddress,
          addressManager,
          ethers.BigNumber.from("100"),  // maxLockCountPerRegister
          1500000    // minGasLimitRegister
        )).wait()
    }

    // set L2 register (L1StosInL2)
    let l2Register_l1StosToL2 = await l1StosToL2.l2Register()
    if (L1StosInL2_Address != null && L1StosInL2_Address != '0x0000000000000000000000000000000000000000'
        && l2Register_l1StosToL2 != L1StosInL2_Address) {
        await (await l1StosToL2.connect(deploySigner).setL2Register(L1StosInL2_Address)).wait()
    }

    //==== L1BurnVault =================================
     const L1BurnVaultDeployment = await deploy("L1BurnVault", {
        from: deployer,
        args: [],
        log: true,
    });

    //==== L1BurnVaultProxy =================================
    const L1BurnVaultProxyDeployment = await deploy("L1BurnVaultProxy", {
        from: deployer,
        args: [],
        log: true
    });

    const l1BurnVaultProxy = (await hre.ethers.getContractAt(
        L1BurnVaultProxyDeployment.abi,
        L1BurnVaultProxyDeployment.address
    )) as L1BurnVaultProxy;

    //==== l1BurnVaultProxy upgradeTo =================================
    let impl2 = await l1BurnVaultProxy.implementation()
    if (impl2 != L1BurnVaultDeployment.address) {
        await (await l1BurnVaultProxy.connect(deploySigner).upgradeTo(L1BurnVaultDeployment.address)).wait()
    }
    //==== l1ProjectManager setL2PublicSaleValue =================================
    let publicInfo = await l1ProjectManager.publicInfo(0)

    if (publicInfo.minPercents != publicSaleInfoZero.minPercents) {
        await (await l1ProjectManager.connect(deploySigner).setL2PublicSaleValue(
            publicSaleInfoZero.maxPercents,
            publicSaleInfoZero.maxPercents,
            publicSaleInfoZero.delayTime)
        ).wait()
    }

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