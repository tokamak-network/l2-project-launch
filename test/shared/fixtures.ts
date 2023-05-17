import { ethers } from 'hardhat'
import {  Wallet, Signer } from 'ethers'

import Web3EthAbi from 'web3-eth-abi';
import { L2ProjectLaunchFixture } from './fixtureInterfaces'
import { keccak256 } from 'ethers/lib/utils'

import { L1ERC20A_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../../typechain-types/contracts/L1/L1ProjectManager'

import { L2TokenFactory } from '../../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../../typechain-types/contracts/L2/L2ProjectManager'

import { Lib_AddressManager } from '../../typechain-types/contracts/test/Lib_AddressManager'
import { MockL1Messenger } from '../../typechain-types/contracts/test/MockL1Messenger'
import { MockL2Messenger } from '../../typechain-types/contracts/test/MockL2Messenger'
import { MockL1Bridge } from '../../typechain-types/contracts/test/MockL1Bridge.sol'
import { MockL2Bridge } from '../../typechain-types/contracts/test/MockL2Bridge'


export const l2ProjectLaunchFixtures = async function (): Promise<L2ProjectLaunchFixture> {

    const [deployer, addr1, addr2, sequencer1 ] = await ethers.getSigners();

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

    const l1ProjectManagerDeployment = await ethers.getContractFactory("L1ProjectManager")
    const l1ProjectManager = (await l1ProjectManagerDeployment.connect(deployer).deploy()) as L1ProjectManager;

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

    /*
    //==== Initialize L1  =================================
    await (await l1ProjectManager.connect(deployer).setL1TokenFactory(
        [0,1,2,3],
        [ l1ERC20A_TokenFactory.address,
          l1ERC20B_TokenFactory.address,
          l1ERC20C_TokenFactory.address,
          l1ERC20D_TokenFactory.address,
        ]
    )).wait()

    await (await l1ProjectManager.connect(deployer).setL2TokenFactory(
      0, l2TokenFactory.address
    )).wait()

    //==== Initialize L2  =================================

    await (await l2TokenFactory.connect(deployer).setL2ProjectManager(
      l2ProjectManager.address
    )).wait()

    await (await l2ProjectManager.connect(deployer).setL1ProjectManager(
      l1ProjectManager.address
    )).wait()

    */

    return  {
      l1ERC20A_TokenFactory: l1ERC20A_TokenFactory,
      l1ERC20B_TokenFactory: l1ERC20B_TokenFactory,
      l1ERC20C_TokenFactory: l1ERC20C_TokenFactory,
      l1ERC20D_TokenFactory: l1ERC20D_TokenFactory,
      l1ProjectManager: l1ProjectManager,
      l2TokenFactory: l2TokenFactory,
      l2ProjectManager: l2ProjectManager,
      deployer: deployer,
      addr1: addr1,
      addr2: addr2,
      addressManager: addressManager,
      l1Messenger: l1Messenger,
      l2Messenger: l2Messenger,
      l1Bridge: l1Bridge,
      l2Bridge: l2Bridge
  }
}

