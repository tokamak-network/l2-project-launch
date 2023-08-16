import hre from 'hardhat'
import { ethers } from 'hardhat'
import {  Wallet, Signer } from 'ethers'

import Web3EthAbi from 'web3-eth-abi';
import { L2ProjectLaunchFixture, L1Fixture} from './fixtureInterfaces'
import { keccak256 } from 'ethers/lib/utils'

// import { LibProject } from '../../typechain-types/contracts/libraries/constants/LibProject.sol'
import { LibProject } from '../../typechain-types/contracts/libraries/LibProject.sol'
import { L1ERC20A_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../../typechain-types/contracts/L1/L1ProjectManager.sol'
import { L1ProjectManagerProxy } from '../../typechain-types/contracts/L1/L1ProjectManagerProxy'

import { L2TokenFactory } from '../../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../../typechain-types/contracts/L2/L2ProjectManager'

import { Lib_AddressManager } from '../../typechain-types/contracts/test/Lib_AddressManager'
import { MockL1Messenger } from '../../typechain-types/contracts/test/MockL1Messenger'
import { MockL2Messenger } from '../../typechain-types/contracts/test/MockL2Messenger'
import { MockL1Bridge } from '../../typechain-types/contracts/test/MockL1Bridge.sol'
import { MockL2Bridge } from '../../typechain-types/contracts/test/MockL2Bridge'
import { LockTOS } from '../../typechain-types/contracts/test/LockTOS'
import { TOS } from '../../typechain-types/contracts/test/TOS'
import { TON } from '../../typechain-types/contracts/test/TON.sol'
import { Create2Deployer } from '../../typechain-types/contracts/L2/factory/Create2Deployer'

// import { L1toL2MessageTest } from '../../typechain-types/contracts/test/L1toL2SendMessage.sol'

import l1ProjectManagerJson from "../../artifacts/contracts/L1/L1ProjectManager.sol/L1ProjectManager.json";
import l2PublicSaleJson from "../../artifacts/contracts/L2/vaults/L2PublicSaleVault.sol/L2PublicSaleVault.json";

import { LibPublicSale } from '../../typechain-types/contracts/L2/libraries/LibPublicSale.sol'
import { L2PublicSaleVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2PublicSaleVaultProxy'
import { L2PublicSaleVault } from '../../typechain-types/contracts/L2/vaults/L2PublicSaleVault.sol'

import { L2InitialLiquidityVaultProxy } from "../../typechain-types/contracts/L2/vaults/L2InitialLiquidityVaultProxy"
import { L2InitialLiquidityVault } from "../../typechain-types/contracts/L2/vaults/L2InitialLiquidityVault.sol"

const tosInfo = {
  name: "TONStarter",
  symbol: "TOS",
  version: "1.0"
}

const lockTosInitializeIfo = {
  epochUnit: ethers.BigNumber.from("604800"),
  maxTime: ethers.BigNumber.from("94348800")
}

export const l1Fixtures = async function (): Promise<L1Fixture> {
  const [deployer, addr1, addr2, sequencer1, create2Deployer] = await ethers.getSigners();

  const LockTOS_ = await ethers.getContractFactory('LockTOS');
  const lockTOS = (await LockTOS_.connect(deployer).deploy()) as LockTOS

  const TOS_ = await ethers.getContractFactory('TOS');
  const tos = (await TOS_.connect(deployer).deploy(
    tosInfo.name, tosInfo.symbol, tosInfo.version
  )) as TOS

  await (await lockTOS.connect(deployer).initialize(
    tos.address,
    lockTosInitializeIfo.epochUnit,
    lockTosInitializeIfo.maxTime
  )).wait()

  await (await tos.connect(deployer).mint(addr1.address, ethers.utils.parseEther("10000"))).wait();
  await (await tos.connect(deployer).mint(addr2.address, ethers.utils.parseEther("10000"))).wait();

  const TON_ = await ethers.getContractFactory('TON');
  const ton = (await TON_.connect(deployer).deploy()) as TON

  await (await ton.connect(deployer).mint(addr1.address, ethers.utils.parseEther("10000"))).wait();
  await (await ton.connect(deployer).mint(addr2.address, ethers.utils.parseEther("10000"))).wait();

  return  {
    deployer: deployer,
    addr1: addr1,
    addr2: addr2,
    tos: tos,
    lockTOS: lockTOS,
    ton: ton
  }
}


export const l2ProjectLaunchFixtures = async function (): Promise<L2ProjectLaunchFixture> {

    const [deployer, addr1, addr2, sequencer1, L2projectManagerAddr, L2vaultAdmin, vestingFundAddr, addr3, addr4, addr5] = await ethers.getSigners();
    // const { accountForCreate2Deployer, myDeployer } = await hre.getNamedAccounts();
    // const create2Signer = await hre.ethers.getSigner(accountForCreate2Deployer);

    //
    // const Create2Deployer_ = await ethers.getContractFactory('Create2Deployer');
    // const factory = (await Create2Deployer_.connect(create2Signer).deploy()) as Create2Deployer
    // console.log("factory", factory.address);

    //==== LibProject =================================
    const LibProject_ = await ethers.getContractFactory('LibProject');
    const libProject = (await LibProject_.connect(deployer).deploy()) as LibProject

    //==== L1toL2MessageTest =================================

    // const L1toL2MessageTestDeployment = await ethers.getContractFactory("L1toL2SendMessage", {
    //     libraries: { LibProject: libProject.address }
    // });
    // const l1toL2MessageTest = (await L1toL2MessageTestDeployment.connect(deployer).deploy()) as L1toL2MessageTest;

    //==== L1TokenFactory =================================

    const l1ERC20A_TokenFactoryDeployment = await ethers.getContractFactory("L1ERC20A_TokenFactory");
    const l1ERC20A_TokenFactory = (await l1ERC20A_TokenFactoryDeployment.connect(deployer).deploy()) as L1ERC20A_TokenFactory;

    const l1ERC20B_TokenFactoryDeployment = await ethers.getContractFactory("L1ERC20B_TokenFactory");
    const l1ERC20B_TokenFactory = (await l1ERC20B_TokenFactoryDeployment.connect(deployer).deploy()) as L1ERC20B_TokenFactory;

    const l1ERC20C_TokenFactoryDeployment = await ethers.getContractFactory("L1ERC20C_TokenFactory");
    const l1ERC20C_TokenFactory = (await l1ERC20C_TokenFactoryDeployment.connect(deployer).deploy()) as L1ERC20C_TokenFactory;

    const l1ERC20D_TokenFactoryDeployment = await ethers.getContractFactory("L1ERC20D_TokenFactory");
    const l1ERC20D_TokenFactory = (await l1ERC20D_TokenFactoryDeployment.connect(deployer).deploy()) as L1ERC20D_TokenFactory;

    //==== L1ProjectManager =================================

    const l1ProjectManagerDeployment = await ethers.getContractFactory("L1ProjectManager", {
        signer: deployer, libraries: { LibProject: libProject.address }
    })
    const l1ProjectManagerImpl = (await l1ProjectManagerDeployment.connect(deployer).deploy()) as L1ProjectManager;

    //==== L1ProjectManagerProxy =================================

    const L1ProjectManagerProxyDeployment = await ethers.getContractFactory("L1ProjectManagerProxy")
    const l1ProjectManagerProxy = (await L1ProjectManagerProxyDeployment.connect(deployer).deploy()) as L1ProjectManagerProxy;

    let impl = await l1ProjectManagerProxy.implementation()
    if (impl != l1ProjectManagerImpl.address) {
      await (await l1ProjectManagerProxy.connect(deployer).upgradeTo(l1ProjectManagerImpl.address)).wait()
    }
    const l1ProjectManager = await ethers.getContractAt(l1ProjectManagerJson.abi, l1ProjectManagerProxy.address, deployer) as L1ProjectManager;

    //==== L2TokenFactory =================================

    const l2TokenFactoryDeployment = await ethers.getContractFactory("L2TokenFactory");
    const l2TokenFactory = (await l2TokenFactoryDeployment.connect(deployer).deploy()) as L2TokenFactory;

    //==== L2ProjectManager =================================

    const l2ProjectManagerDeployment = await ethers.getContractFactory("L2ProjectManager")
    const l2ProjectManager = (await l2ProjectManagerDeployment.connect(deployer).deploy()) as L2ProjectManager;

    //---- L2
    const Lib_AddressManager = await ethers.getContractFactory('Lib_AddressManager')
    const addressManager = (await Lib_AddressManager.connect(deployer).deploy()) as Lib_AddressManager

    // await addressManager.connect(deployer).setAddress("OVM_Sequencer", sequencer1.address);

    //---
    const MockL1Messenger = await ethers.getContractFactory('MockL1Messenger')
    const l1Messenger = (await MockL1Messenger.connect(deployer).deploy()) as MockL1Messenger
    const MockL2Messenger = await ethers.getContractFactory('MockL2Messenger')
    const l2Messenger = (await MockL2Messenger.connect(deployer).deploy()) as MockL2Messenger
    const MockL1Bridge = await ethers.getContractFactory('MockL1Bridge')
    const l1Bridge = (await MockL1Bridge.connect(deployer).deploy()) as MockL1Bridge
    const MockL2Bridge = await ethers.getContractFactory('MockL1Bridge')
    const l2Bridge = (await MockL2Bridge.connect(deployer).deploy()) as MockL2Bridge

    await l1Bridge.connect(deployer).setAddress(l1Messenger.address, l2Bridge.address);

    await addressManager.connect(deployer).setAddress("OVM_L1CrossDomainMessenger", l1Messenger.address);
    await addressManager.connect(deployer).setAddress("Proxy__OVM_L1StandardBridge", l1Bridge.address);

    //==== L2PublicSaleVault =================================
    const l2PublicSaleProxy = await ethers.getContractFactory('L2PublicSaleVaultProxy')
    const l2PublicProxy = (await l2PublicSaleProxy.connect(deployer).deploy()) as L2PublicSaleVaultProxy

    const libL2PublicSale = await ethers.getContractFactory('LibPublicSale')
    const libL2Public = (await libL2PublicSale.connect(deployer).deploy()) as LibPublicSale

    const l2PublicSaleLogic = await ethers.getContractFactory('L2PublicSaleVault', {
      signer: deployer, libraries: { LibPublicSale: libL2Public.address }
    })
    const l2PublicLogic = (await l2PublicSaleLogic.connect(deployer).deploy()) as L2PublicSaleVault

    await (await l2PublicProxy.connect(deployer).upgradeTo(l2PublicLogic.address)).wait()
    const l2PublicProxyLogic = await ethers.getContractAt(l2PublicSaleJson.abi, l2PublicProxy.address, deployer) as L2PublicSaleVault;

    //==== L2InitialLiquidityVault =================================
    
    const L2InitialLiquidityVaultProxy = await ethers.getContractFactory('L2InitialLiquidityVaultProxy')
    const l2liquidityProxy = (await L2InitialLiquidityVaultProxy.connect(deployer).deploy()) as L2InitialLiquidityVaultProxy

    const L2InitialLiquidityVault = await ethers.getContractFactory('L2InitialLiquidityVault')
    const l2liquidity = (await L2InitialLiquidityVault.connect(deployer).deploy()) as L2InitialLiquidityVault

    return  {
      libProject: libProject,
      l1ERC20A_TokenFactory: l1ERC20A_TokenFactory,
      l1ERC20B_TokenFactory: l1ERC20B_TokenFactory,
      l1ERC20C_TokenFactory: l1ERC20C_TokenFactory,
      l1ERC20D_TokenFactory: l1ERC20D_TokenFactory,
      l1ProjectManager: l1ProjectManager,
      l1ProjectManagerProxy: l1ProjectManagerProxy,
      l2TokenFactory: l2TokenFactory,
      l2ProjectManager: l2ProjectManager,
      deployer: deployer,
      addr1: addr1,
      addr2: addr2,
      addr3: addr3,
      addr4: addr4,
      addr5: addr5,
      // factoryDeployer: create2Signer,
      addressManager: addressManager,
      l1Messenger: l1Messenger,
      l2Messenger: l2Messenger,
      l1Bridge: l1Bridge,
      l2Bridge: l2Bridge,
      // factory: factory,
      // l1toL2MessageTest : l1toL2MessageTest
      l2PublicProxy: l2PublicProxy,
      libL2Public: libL2Public,
      l2PublicProxyLogic: l2PublicProxyLogic,
      l2ProjectManagerAddr: L2projectManagerAddr,
      l2VaultAdmin: L2vaultAdmin,
      l2LiquidityProxy: l2liquidityProxy,
      l2Liquidity: l2liquidity,
      vestingFundAddr: vestingFundAddr
  }
}

