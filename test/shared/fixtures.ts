import hre from 'hardhat'
import { ethers } from 'hardhat'
import {  Wallet, Signer } from 'ethers'

import Web3EthAbi from 'web3-eth-abi';
import {
  L2ProjectLaunchFixture, L1Fixture, TONFixture, LockIdFixture
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
import { L2ProjectManager } from '../../typechain-types/contracts/L2/L2ProjectManager'

import { Lib_AddressManager } from '../../typechain-types/contracts/test/Lib_AddressManager'
import { MockL1Messenger } from '../../typechain-types/contracts/test/MockL1Messenger'
import { MockL2Messenger } from '../../typechain-types/contracts/test/MockL2Messenger'
import { MockL1Bridge } from '../../typechain-types/contracts/test/MockL1Bridge.sol'
import { MockL2Bridge } from '../../typechain-types/contracts/test/MockL2Bridge'
import { LockTOS } from '../../typechain-types/contracts/test/LockTOS'
import { TOS } from '../../typechain-types/contracts/test/TOS'
import { Create2Deployer } from '../../typechain-types/contracts/L2/factory/Create2Deployer'
import { L2PaymasterDeposit } from '../../typechain-types/contracts/L2/L2PaymasterDeposit.sol/L2PaymasterDeposit'
import { LockIdNFT } from '../../typechain-types/contracts/stos/LockIdNFT'

import { L1StosToL2 } from '../../typechain-types/contracts/L1/L1StosToL2.sol/L1StosToL2'
import { L1StosInL2 } from '../../typechain-types/contracts/L2/L1StosInL2.sol/L1StosInL2'
import { LockIdNftForRegister } from '../../typechain-types/contracts/stos/LockIdNftForRegister'
import { LockIdNftTransferable } from '../../typechain-types/contracts/stos/LockIdNftTransferable.sol'
import { LockTOSv2 } from '../../typechain-types/contracts/stos/LockTOSv2'

import l1ProjectManagerJson from "../../artifacts/contracts/L1/L1ProjectManager.sol/L1ProjectManager.json";

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
    const MockL2Bridge = await ethers.getContractFactory('MockL1Bridge')
    const l2Bridge = (await MockL2Bridge.connect(deployer).deploy()) as MockL2Bridge

    await l1Bridge.connect(deployer).setAddress(l1Messenger.address, l2Bridge.address);

    // await addressManager.connect(deployer).setAddress("OVM_L1CrossDomainMessenger", l1Messenger.address);
    await addressManager.connect(deployer).setAddress("Proxy__OVM_L1CrossDomainMessenger", l1Messenger.address);

    await addressManager.connect(deployer).setAddress("Proxy__OVM_L1StandardBridge", l1Bridge.address);


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
  const L1StosToL2_ = await ethers.getContractFactory('L1StosToL2', {
    signer: deployer, libraries: { LibProject: libProject.address }
  })

  const l1StosToL2 = (await L1StosToL2_.connect(deployer).deploy(
    deployer.address,
    lockTOS.address,
    addressManager.address,
    ethers.BigNumber.from("100"),
    200000
  )) as L1StosToL2


  const L1StosInL2_ = await ethers.getContractFactory('L1StosInL2')
  const l1StosInL2 = (await L1StosInL2_.connect(deployer).deploy(
    deployer.address,
    l2Messenger.address
  )) as L1StosInL2

  const lockIdNFTInfoL1 = {
    name: "L1 STOS",
    symbol: "STOS",
    version: "1.0",
    epochUnit: 60*60*24*7,
    maxTime : 60*60*24*365*3
  }
  const LockIdNftForRegister_ = await ethers.getContractFactory('LockIdNftForRegister')
  const lockIdNftForRegister = (await LockIdNftForRegister_.connect(deployer).deploy(
    lockIdNFTInfoL1.name,
    lockIdNFTInfoL1.symbol,
    l1StosInL2.address,
    lockIdNFTInfoL1.epochUnit,
    lockIdNFTInfoL1.maxTime
  )) as LockIdNftForRegister

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
