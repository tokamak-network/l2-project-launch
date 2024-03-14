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
const L1StosInL2_Address = "0xdb24dea411856b35dFc778a533F65A110483417A"
const publicSaleInfoZero = {minPercents: 5, maxPercents: 10, delayTime: 100}

/**
  2024.03.14 sepolia
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
        l2TokenFactory: '0xA8812b612978178361F8c6C4B59a9dC0e9fe7bB1',
        l2ProjectManager: '0x20f4b34715754A7482a685E889732eD708637896',
        depositMinGasLimit: 300000,
        sendMsgMinGasLimit: 5000000 // => 1021609.2
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