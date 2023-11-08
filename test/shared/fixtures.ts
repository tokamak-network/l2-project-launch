import hre from 'hardhat'
import { ethers } from 'hardhat'
import {  Wallet, Signer } from 'ethers'

import Web3EthAbi from 'web3-eth-abi';
import {
  L2ProjectLaunchFixture, L1Fixture, TONFixture, LockIdFixture,
  SetL2ProjectLaunchFixture
  } from './fixtureInterfaces'
import { keccak256 } from 'ethers/lib/utils'

import { LibProject } from '../../typechain-types/contracts/libraries/LibProject.sol'
import { L1toL2Message } from '../../typechain-types/contracts/L1/L1toL2Message.sol'

import { L1ERC20A_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../../typechain-types/contracts/L1/L1ProjectManager.sol'
import { L1ProjectManagerProxy } from '../../typechain-types/contracts/L1/L1ProjectManagerProxy'

import { L2TokenFactory } from '../../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../../typechain-types/contracts/L2/L2ProjectManager.sol'
import { L2ProjectManagerProxy } from '../../typechain-types/contracts/L2/L2ProjectManagerProxy'


import { Lib_AddressManager } from '../../typechain-types/contracts/test/Lib_AddressManager'
import { MockL1Messenger } from '../../typechain-types/contracts/test/MockL1Messenger.sol'
import { MockL2Messenger } from '../../typechain-types/contracts/test/MockL2Messenger'
import { MockL1Bridge } from '../../typechain-types/contracts/test/MockL1Bridge.sol'
import { MockL2Bridge } from '../../typechain-types/contracts/test/MockL2Bridge'
import { LockTOS } from '../../typechain-types/contracts/test/LockTOS'
import { TOS } from '../../typechain-types/contracts/test/TOS'
import { Create2Deployer } from '../../typechain-types/contracts/L2/factory/Create2Deployer'
import { L2PaymasterDeposit } from '../../typechain-types/contracts/L2/L2PaymasterDeposit.sol/L2PaymasterDeposit'
import { LockIdNFT } from '../../typechain-types/contracts/stos/LockIdNFT'

import { L1StosToL2 } from '../../typechain-types/contracts/L1/L1StosToL2.sol/L1StosToL2'
import { L1StosToL2Proxy } from '../../typechain-types/contracts/L1/L1StosToL2Proxy'

import { L1StosInL2 } from '../../typechain-types/contracts/L2/L1StosInL2.sol/L1StosInL2'
import { L1StosInL2Proxy } from '../../typechain-types/contracts/L2/L1StosInL2Proxy'


import { LockIdNftForRegister } from '../../typechain-types/contracts/stos/LockIdNftForRegister'
import { LockIdNftForRegisterProxy } from '../../typechain-types/contracts/stos/LockIdNftForRegisterProxy'
import { LockIdNftTransferable } from '../../typechain-types/contracts/stos/LockIdNftTransferable'
import { LockTOSv2 } from '../../typechain-types/contracts/stos/LockTOSv2'

//L2InitialLiquidityVault
import { L2InitialLiquidityVault } from '../../typechain-types/contracts/L2/vaults/L2InitialLiquidityVault.sol'
import { L2InitialLiquidityVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2InitialLiquidityVaultProxy'
// L2ScheduleVault ( team, marketing )
import { L2ScheduleVault } from '../../typechain-types/contracts/L2/vaults/L2ScheduleVault'
import { L2ScheduleVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2ScheduleVaultProxy'
// L2NonScheduleVault (dao)
import { L2NonScheduleVault } from '../../typechain-types/contracts/L2/vaults/L2NonScheduleVault'
import { L2CustomVaultBaseProxy } from '../../typechain-types/contracts/L2/vaults/L2CustomVaultBaseProxy'

// LpReward
// TonAirdrop
// TosAirDrop

import l1ProjectManagerJson from "../../artifacts/contracts/L1/L1ProjectManager.sol/L1ProjectManager.json";
import l2ProjectManagerJson from "../../artifacts/contracts/L2/L2ProjectManager.sol/L2ProjectManager.json";
import initialLiquidityVaultJson from "../../artifacts/contracts/L2/vaults/L2InitialLiquidityVault.sol/L2InitialLiquidityVault.json";
import daoVaultJson from "../../artifacts/contracts/L2/vaults/L2NonScheduleVault.sol/L2NonScheduleVault.json";
import L2ScheduleVaultJson from "../../artifacts/contracts/L2/vaults/L2ScheduleVault.sol/L2ScheduleVault.json";
import L2NonScheduleVaultJson from "../../artifacts/contracts/L2/vaults/L2NonScheduleVault.sol/L2NonScheduleVault.json";
import L1StosToL2Json from "../../artifacts/contracts/L1/L1StosToL2.sol/L1StosToL2.json";
import L1StosInL2Json from "../../artifacts/contracts/L2/L1StosInL2.sol/L1StosInL2.json";
import LockIdNftForRegisterJson from "../../artifacts/contracts/stos/LockIdNftForRegister.sol/LockIdNftForRegister.json";


const tosInfo = {
  name: "TONStarter",
  symbol: "TOS",
  version: "1.0"
}

const lockTosInitializeIfo = {
  epochUnit: ethers.BigNumber.from("604800"),
  maxTime: ethers.BigNumber.from("94348800")
}

const lockIdNFTInfo = {
  name: "STOS NFT",
  symbol: "STOS",
  version: "1.0",
  epochUnit: 60*60*24*7,
  maxTime : 60*60*24*365*3
}

// // titan
// export const l2UniswapInfo = {
//   uniswapV3Factory: '0x8C2351935011CfEccA4Ea08403F127FB782754AC',
//   npm: '0x324d7015E30e7C231e4aC155546b8AbfEAB00977',
//   ton: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2',
//   tos: '0xD08a2917653d4E460893203471f0000826fb4034',
// }

// titan goerli
export const l2UniswapInfo = {
  uniswapV3Factory: '0x8C2351935011CfEccA4Ea08403F127FB782754AC',
  npm: '0x324d7015E30e7C231e4aC155546b8AbfEAB00977',
  ton: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
  tos: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
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

  return  {
    deployer: deployer,
    addr1: addr1,
    addr2: addr2,
    tos: tos,
    lockTOS: lockTOS
  }
}


export const l2ProjectLaunchFixtures = async function (): Promise<L2ProjectLaunchFixture> {

    const [deployer, addr1, addr2, sequencer1] = await ethers.getSigners();
    const { paymasterAddress, l1AddressManagerAddress } = await hre.getNamedAccounts();

    // const create2Signer = await hre.ethers.getSigner(accountForCreate2Deployer);

    //
    // const Create2Deployer_ = await ethers.getContractFactory('Create2Deployer');
    // const factory = (await Create2Deployer_.connect(create2Signer).deploy()) as Create2Deployer
    // console.log("factory", factory.address);

    //==== LibProject =================================
    const LibProject_ = await ethers.getContractFactory('LibProject');
    const libProject = (await LibProject_.connect(deployer).deploy()) as LibProject

    //==== L1toL2Message =================================
    const L1toL2MessageTest_ = await ethers.getContractFactory("L1toL2Message", {
        libraries: { LibProject: libProject.address }
    });
    const l1toL2Message = (await L1toL2MessageTest_.connect(deployer).deploy()) as L1toL2Message;


    //==== L2PaymasterDeposit =================================
    const L2PaymasterDeposit_ = await ethers.getContractFactory("L2PaymasterDeposit");
    const l2PaymasterDeposit =  (await L2PaymasterDeposit_.connect(deployer).deploy(
      paymasterAddress
    )) as L2PaymasterDeposit;

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
    await addressManager.connect(deployer).setAddress("OVM_Sequencer", sequencer1.address);

    //---
    const MockL1Messenger = await ethers.getContractFactory('MockL1Messenger')
    const l1Messenger = (await MockL1Messenger.connect(deployer).deploy()) as MockL1Messenger
    const MockL2Messenger = await ethers.getContractFactory('MockL2Messenger')
    const l2Messenger = (await MockL2Messenger.connect(deployer).deploy()) as MockL2Messenger
    const MockL1Bridge = await ethers.getContractFactory('MockL1Bridge')
    const l1Bridge = (await MockL1Bridge.connect(deployer).deploy()) as MockL1Bridge
    const MockL2Bridge = await ethers.getContractFactory('MockL2Bridge')
    const l2Bridge = (await MockL2Bridge.connect(deployer).deploy()) as MockL2Bridge

    await l1Bridge.connect(deployer).setAddress(l1Messenger.address, l2Bridge.address);

    // await addressManager.connect(deployer).setAddress("OVM_L1CrossDomainMessenger", l1Messenger.address);
    await addressManager.connect(deployer).setAddress("Proxy__OVM_L1CrossDomainMessenger", l1Messenger.address);
    await addressManager.connect(deployer).setAddress("Proxy__OVM_L1StandardBridge", l1Bridge.address);


    //----- set L2ProjectManager


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
      // factoryDeployer: create2Signer,
      addressManager: addressManager,
      l1Messenger: l1Messenger,
      l2Messenger: l2Messenger,
      l1Bridge: l1Bridge,
      l2Bridge: l2Bridge,
      // factory: factory,
      l1toL2Message : l1toL2Message,
      paymasterAddress: paymasterAddress,
      l2PaymasterDeposit: l2PaymasterDeposit
  }
}

export const l2ProjectLaunchFixtures2 = async function (): Promise<SetL2ProjectLaunchFixture> {

  const [deployer, addr1, addr2, sequencer1] = await ethers.getSigners();
  const { paymasterAddress, l1AddressManagerAddress, tosAddress, tosAdminAddress } = await hre.getNamedAccounts();

  //==== LibProject =================================
  const LibProject_ = await ethers.getContractFactory('LibProject');
  const libProject = (await LibProject_.connect(deployer).deploy()) as LibProject


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

  //==== L1ProjectManagerProxy upgradeTo =================================

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
  const l2ProjectManagerImpl = (await l2ProjectManagerDeployment.connect(deployer).deploy()) as L2ProjectManager;

  //==== L2ProjectManagerProxy =================================

  const L2ProjectManagerProxyDeployment = await ethers.getContractFactory("L2ProjectManagerProxy")
  const l2ProjectManagerProxy = (await L2ProjectManagerProxyDeployment.connect(deployer).deploy()) as L2ProjectManagerProxy;

  let impl2 = await l2ProjectManagerProxy.implementation()
  if (impl2 != l2ProjectManagerImpl.address) {
    await (await l2ProjectManagerProxy.connect(deployer).upgradeTo(l2ProjectManagerImpl.address)).wait()
  }
  const l2ProjectManager = await ethers.getContractAt(l2ProjectManagerJson.abi, l2ProjectManagerProxy.address, deployer) as L2ProjectManager;
  console.log('l2ProjectManager', l2ProjectManager.address)
  //---- L2
  const Lib_AddressManager = await ethers.getContractFactory('Lib_AddressManager')
  const addressManager = (await Lib_AddressManager.connect(deployer).deploy()) as Lib_AddressManager
  await addressManager.connect(deployer).setAddress("OVM_Sequencer", sequencer1.address);

  //---
  const MockL1Messenger = await ethers.getContractFactory('MockL1Messenger')
  const l1Messenger = (await MockL1Messenger.connect(deployer).deploy()) as MockL1Messenger
  const MockL2Messenger = await ethers.getContractFactory('MockL2Messenger')
  const l2Messenger = (await MockL2Messenger.connect(deployer).deploy()) as MockL2Messenger
  const MockL1Bridge = await ethers.getContractFactory('MockL1Bridge')
  const l1Bridge = (await MockL1Bridge.connect(deployer).deploy()) as MockL1Bridge
  const MockL2Bridge = await ethers.getContractFactory('MockL2Bridge')
  const l2Bridge = (await MockL2Bridge.connect(deployer).deploy()) as MockL2Bridge

  await l1Bridge.connect(deployer).setAddress(l1Messenger.address, l2Bridge.address);

  // await addressManager.connect(deployer).setAddress("OVM_L1CrossDomainMessenger", l1Messenger.address);
  await (await addressManager.connect(deployer).setAddress("Proxy__OVM_L1CrossDomainMessenger", l1Messenger.address)).wait()
  await (await addressManager.connect(deployer).setAddress("Proxy__OVM_L1StandardBridge", l1Bridge.address)).wait()
  await (await l1Messenger.connect(deployer).setL2messenger(l2Messenger.address)).wait()

  //=================================
  //===== set Vaults

  //==== L2InitialLiquidityVault =================================
  const initialLiquidityVaultDeployment = await ethers.getContractFactory("L2InitialLiquidityVault")
  const initialLiquidityVaultImpl = (await initialLiquidityVaultDeployment.connect(deployer).deploy()) as L2InitialLiquidityVault;

  //==== L2InitialLiquidityVaultProxy =================================
  const L2InitialLiquidityVaultProxyDeployment = await ethers.getContractFactory("L2InitialLiquidityVaultProxy")
  const initialLiquidityVaultProxy = (await L2InitialLiquidityVaultProxyDeployment.connect(deployer).deploy()) as L2InitialLiquidityVaultProxy;

  impl = await initialLiquidityVaultProxy.implementation()
  if (impl != initialLiquidityVaultImpl.address) {
    await (await initialLiquidityVaultProxy.connect(deployer).upgradeTo(initialLiquidityVaultImpl.address)).wait()
  }

  const initialLiquidityVault = await ethers.getContractAt(
    initialLiquidityVaultJson.abi, initialLiquidityVaultProxy.address, deployer) as L2InitialLiquidityVault;

  //=================================
  //==== customScheduleVault =================================
  const customScheduleVaultDeployment = await ethers.getContractFactory("L2ScheduleVault")
  const customScheduleVaultImpl = (await customScheduleVaultDeployment.connect(deployer).deploy()) as L2ScheduleVault;

  //==== customScheduleVaultProxy =================================
  const customScheduleVaultProxyDeployment = await ethers.getContractFactory("L2CustomVaultBaseProxy")
  const scheduleVaultProxy = (await customScheduleVaultProxyDeployment.connect(deployer).deploy()) as L2ScheduleVaultProxy;

  impl = await scheduleVaultProxy.implementation()
  if (impl != customScheduleVaultImpl.address) {
    await (await scheduleVaultProxy.connect(deployer).upgradeTo(customScheduleVaultImpl.address)).wait()
  }

  const scheduleVault = await ethers.getContractAt(
    L2ScheduleVaultJson.abi, scheduleVaultProxy.address, deployer) as L2ScheduleVault;

  //==== nonCustomScheduleVault  =================================
  const nonCustomScheduleVaultDeployment = await ethers.getContractFactory("L2NonScheduleVault")
  const nonCustomScheduleVaultImpl = (await nonCustomScheduleVaultDeployment.connect(deployer).deploy()) as L2NonScheduleVault;

  //==== nonCustomScheduleVaultProxy =================================
  const nonCustomScheduleVaultProxyDeployment = await ethers.getContractFactory("L2CustomVaultBaseProxy")
  const nonScheduleVaultProxy = (await nonCustomScheduleVaultProxyDeployment.connect(deployer).deploy()) as L2CustomVaultBaseProxy;

  impl = await nonScheduleVaultProxy.implementation()
  if (impl != nonCustomScheduleVaultImpl.address) {
    await (await nonScheduleVaultProxy.connect(deployer).upgradeTo(nonCustomScheduleVaultImpl.address)).wait()
  }

  const nonScheduleVault = await ethers.getContractAt(
    L2NonScheduleVaultJson.abi, nonScheduleVaultProxy.address, deployer) as L2NonScheduleVault;

  //==== daoVault =================================
  const daoVaultDeployment = await ethers.getContractFactory("L2NonScheduleVault")
  const daoVaultImpl = (await daoVaultDeployment.connect(deployer).deploy()) as L2NonScheduleVault;

  //==== daoVaultProxy =================================
  const daoVaultProxyDeployment = await ethers.getContractFactory("L2CustomVaultBaseProxy")
  const daoVaultProxy = (await daoVaultProxyDeployment.connect(deployer).deploy()) as L2CustomVaultBaseProxy;

  impl = await daoVaultProxy.implementation()
  if (impl != daoVaultImpl.address) {
    await (await daoVaultProxy.connect(deployer).upgradeTo(daoVaultImpl.address)).wait()
  }

  const daoVault = await ethers.getContractAt(
    daoVaultJson.abi, daoVaultProxy.address, deployer) as L2NonScheduleVault;

  //=================================
  //==== marketingVault =================================
  const marketingVaultDeployment = await ethers.getContractFactory("L2ScheduleVault")
  const marketingVaultImpl = (await marketingVaultDeployment.connect(deployer).deploy()) as L2ScheduleVault;

  //==== marketingVaultProxy =================================
  const marketingVaultProxyDeployment = await ethers.getContractFactory("L2ScheduleVaultProxy")
  const marketingVaultProxy = (await marketingVaultProxyDeployment.connect(deployer).deploy()) as L2ScheduleVaultProxy;

  impl = await marketingVaultProxy.implementation()
  if (impl != marketingVaultImpl.address) {
    await (await marketingVaultProxy.connect(deployer).upgradeTo(marketingVaultImpl.address)).wait()
  }

  const marketingVault = await ethers.getContractAt(
    L2ScheduleVaultJson.abi, marketingVaultProxy.address, deployer) as L2ScheduleVault;

  //=================================
  //==== teamVault =================================
  const teamVaultDeployment = await ethers.getContractFactory("L2ScheduleVault")
  const teamVaultImpl = (await teamVaultDeployment.connect(deployer).deploy()) as L2ScheduleVault;

  //==== teamVaultProxy =================================
  const teamVaultProxyDeployment = await ethers.getContractFactory("L2ScheduleVaultProxy")
  const teamVaultProxy = (await teamVaultProxyDeployment.connect(deployer).deploy()) as L2ScheduleVaultProxy;

  impl = await teamVaultProxy.implementation()
  if (impl != teamVaultImpl.address) {
    await (await teamVaultProxy.connect(deployer).upgradeTo(teamVaultImpl.address)).wait()
  }

  const teamVault = await ethers.getContractAt(
    L2ScheduleVaultJson.abi, teamVaultProxy.address, deployer) as L2ScheduleVault;

  //==SET Vault===============================
  await (await initialLiquidityVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await daoVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await marketingVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await teamVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await scheduleVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await nonScheduleVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()

  // for test
  // await (await l2TokenFactory.connect(deployer).setL2Bridge(l2Bridge.address)).wait()

  await (await l2TokenFactory.connect(deployer).setL1Bridge(l1Bridge.address)).wait()
  await (await l2Bridge.connect(deployer).setAddress(
    l2Messenger.address, l1Bridge.address)).wait()

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
      l2ProjectManagerProxy: l2ProjectManagerProxy,
      deployer: deployer,
      addr1: addr1,
      addr2: addr2,
      addressManager: addressManager,
      l1Messenger: l1Messenger,
      l2Messenger: l2Messenger,
      l1Bridge: l1Bridge,
      l2Bridge: l2Bridge,
      // publicSaleVault:
      initialLiquidityVault: initialLiquidityVault,
      initialLiquidityVaultProxy: initialLiquidityVaultProxy,
      daoVault: daoVault,
      daoVaultProxy: daoVaultProxy,
      marketingVault : marketingVault,
      marketingVaultProxy : marketingVaultProxy,
      teamVault: teamVault,
      teamVaultProxy : teamVaultProxy,
      scheduleVault: scheduleVault,
      scheduleVaultProxy: scheduleVaultProxy,
      nonScheduleVault: nonScheduleVault,
      nonScheduleVaultProxy: nonScheduleVaultProxy,
      tosAddress: tosAddress,
      tosAdminAddress: tosAdminAddress
  }
}

export const tonFixture = async function (): Promise<TONFixture> {
  const { tonAddress, tonAdminAddress, l2TonAddress } = await hre.getNamedAccounts();
  const tonAdmin =  await hre.ethers.getSigner(tonAdminAddress);
  return  {
    tonAddress: tonAddress,
    tonAdminAddress: tonAdminAddress,
    l2TonAddress: l2TonAddress,
    tonAdmin: tonAdmin
  }
}

export const lockIdFixture = async function (): Promise<LockIdFixture> {
  const [deployer, addr1, addr2, sequencer1] = await ethers.getSigners();
  const { tonAddress, tonAdminAddress } = await hre.getNamedAccounts();
  const tonAdmin =  await hre.ethers.getSigner(tonAdminAddress);

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

  // console.log('lockTOS', lockTOS.address)
  await (await tos.connect(deployer).mint(addr1.address, ethers.utils.parseEther("100000000"))).wait();
  await (await tos.connect(deployer).mint(addr2.address, ethers.utils.parseEther("100000000"))).wait();

  //--
  const LockTOSv2_ = await ethers.getContractFactory('LockTOSv2');
  const lockTOSv2 = (await LockTOSv2_.connect(deployer).deploy(
    lockIdNFTInfo.name,
    lockIdNFTInfo.symbol
  )) as LockTOSv2

  await (await lockTOSv2.connect(deployer).initialize(
    tos.address,
    lockTosInitializeIfo.epochUnit,
    lockTosInitializeIfo.maxTime
  )).wait()

  // console.log('lockTOSv2', lockTOSv2.address)


  const LockIdNFT_ = await ethers.getContractFactory('LockIdNFT');
  const lockIdNFT = (await LockIdNFT_.connect(deployer).deploy(
    lockIdNFTInfo.name,
    lockIdNFTInfo.symbol,
    deployer.address,
    lockIdNFTInfo.epochUnit,
    lockIdNFTInfo.maxTime,
    tos.address
  )) as LockIdNFT


  const LockIdNftTransferable_ = await ethers.getContractFactory('LockIdNftTransferable');
  const lockIdNftTransferable = (await LockIdNftTransferable_.connect(deployer).deploy(
    lockIdNFTInfo.name,
    lockIdNFTInfo.symbol,
    deployer.address,
    lockIdNFTInfo.epochUnit,
    lockIdNFTInfo.maxTime,
    tos.address
  )) as LockIdNftTransferable


  //==== LibProject =================================
  const LibProject_ = await ethers.getContractFactory('LibProject');
  const libProject = (await LibProject_.connect(deployer).deploy()) as LibProject

  //---- for L2 message
  const Lib_AddressManager = await ethers.getContractFactory('Lib_AddressManager')
  const addressManager = (await Lib_AddressManager.connect(deployer).deploy()) as Lib_AddressManager
  await addressManager.connect(deployer).setAddress("OVM_Sequencer", sequencer1.address);

  //---
  const MockL1Messenger = await ethers.getContractFactory('MockL1Messenger')
  const l1Messenger = (await MockL1Messenger.connect(deployer).deploy()) as MockL1Messenger
  const MockL2Messenger = await ethers.getContractFactory('MockL2Messenger')
  const l2Messenger = (await MockL2Messenger.connect(deployer).deploy()) as MockL2Messenger

  await addressManager.connect(deployer).setAddress("Proxy__OVM_L1CrossDomainMessenger", l1Messenger.address);
  await (await l1Messenger.connect(deployer).setL2messenger(l2Messenger.address)).wait()

  //---- for L1 stos -> L2 register
  //---- L1StosToL2
  const L1StosToL2_ = await ethers.getContractFactory('L1StosToL2', {
    signer: deployer, libraries: { LibProject: libProject.address }
  })
  const L1StosToL2Proxy_ = await ethers.getContractFactory('L1StosToL2Proxy', {
    signer: deployer
  })

  const l1StosToL2Logic = (await L1StosToL2_.connect(deployer).deploy()) as L1StosToL2
  const l1StosToL2Proxy = (await L1StosToL2Proxy_.connect(deployer).deploy()) as L1StosToL2Proxy

  let impl_l1StosToL2Proxy = await l1StosToL2Proxy.implementation()
  if(impl_l1StosToL2Proxy != l1StosToL2Logic.address) {
    await (await l1StosToL2Proxy.connect(deployer).upgradeTo(l1StosToL2Logic.address)).wait()
  }

  const l1StosToL2 = (await ethers.getContractAt(L1StosToL2Json.abi, l1StosToL2Proxy.address, deployer)) as L1StosToL2

  let lockTosAddr = await l1StosToL2Proxy.lockTos()
  if(lockTosAddr != lockTOS.address) {
    await (await l1StosToL2.connect(deployer).initialize(
      deployer.address,
      lockTOS.address,
      addressManager.address,
      ethers.BigNumber.from("100"),
      200000
    )).wait()
  }

  //---- L1StosInL2
  const L1StosInL2_ = await ethers.getContractFactory('L1StosInL2')
  const L1StosInL2Proxy_ = await ethers.getContractFactory('L1StosInL2Proxy', {
    signer: deployer
  })

  const l1StosInL2Logic = (await L1StosInL2_.connect(deployer).deploy()) as L1StosInL2
  const l1StosInL2Proxy = (await L1StosInL2Proxy_.connect(deployer).deploy()) as L1StosInL2Proxy

  let impl_l1StosInL2Proxy = await l1StosInL2Proxy.implementation()

  if(impl_l1StosInL2Proxy != l1StosInL2Logic.address) {

    await (await l1StosInL2Proxy.connect(deployer).upgradeTo(l1StosInL2Logic.address)).wait()
  }

  const l1StosInL2 = (await ethers.getContractAt(L1StosInL2Json.abi, l1StosInL2Proxy.address, deployer)) as L1StosInL2

  let l2CrossDomainMessenger_l1StosInL2Proxy = await l1StosInL2Proxy.l2CrossDomainMessenger()
  if(l2CrossDomainMessenger_l1StosInL2Proxy != l2Messenger.address) {
    await (await l1StosInL2.connect(deployer).initialize (deployer.address, l2Messenger.address)).wait()
  }

  //---- LockIdNftForRegister
  const lockIdNFTInfoL1 = {
    name: "L1 STOS",
    symbol: "STOS",
    version: "1.0",
    epochUnit: 60*60*24*7,
    maxTime : 60*60*24*365*3
  }
  const LockIdNftForRegister_ = await ethers.getContractFactory('LockIdNftForRegister')
  const LockIdNftForRegisterProxy_ = await ethers.getContractFactory('LockIdNftForRegisterProxy', {
    signer: deployer
  })

  const lockIdNftForRegisterLogic = (await LockIdNftForRegister_.connect(deployer).deploy()) as LockIdNftForRegister
  const lockIdNftForRegisterProxy = (await LockIdNftForRegisterProxy_.connect(deployer).deploy()) as LockIdNftForRegisterProxy

  let impl_lockIdNftForRegisterProxy = await lockIdNftForRegisterProxy.implementation()

  if(impl_lockIdNftForRegisterProxy != lockIdNftForRegisterLogic.address) {
    await (await lockIdNftForRegisterProxy.connect(deployer).upgradeTo(lockIdNftForRegisterLogic.address)).wait()
  }

  const lockIdNftForRegister = (await ethers.getContractAt(LockIdNftForRegisterJson.abi, lockIdNftForRegisterProxy.address, deployer)) as LockIdNftForRegister

  let epochUnit = await lockIdNftForRegister.epochUnit()
  if (epochUnit != ethers.BigNumber.from(""+lockIdNFTInfoL1.epochUnit)) {
    await (await lockIdNftForRegister.connect(deployer).initialize(
      lockIdNFTInfoL1.name,
      lockIdNFTInfoL1.symbol,
      l1StosInL2.address,
      lockIdNFTInfoL1.epochUnit,
      lockIdNFTInfoL1.maxTime
    )).wait()
  }


  await (await l1StosInL2.connect(deployer).setLockIdNft(lockIdNftForRegister.address)).wait()
  await (await l1StosInL2.connect(deployer).setL1Register(l1StosToL2.address)).wait()


  await (await l1StosToL2.connect(deployer).setL2Register(l1StosInL2.address)).wait()


  // console.log('l1StosToL2 ', l1StosToL2.address)
  // console.log('l1StosInL2 ', l1StosInL2.address)
  // console.log('lockIdNftForRegister ', lockIdNftForRegister.address)
  return  {
    deployer: deployer,
    addr1: addr1,
    addr2: addr2,
    tos: tos,
    lockTOS: lockTOS,
    tonAddress: tonAddress,
    tonAdminAddress: tonAdminAddress,
    tonAdmin: tonAdmin,
    lockIdNFT: lockIdNFT,
    l1StosToL2: l1StosToL2,
    l1StosInL2: l1StosInL2,
    lockIdNftRegisterInL2: lockIdNftForRegister,
    addressManager: addressManager,
    l1Messenger: l1Messenger,
    lockIdNftTransferable: lockIdNftTransferable,
    lockTOSv2: lockTOSv2
  }
}
