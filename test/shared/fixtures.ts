import hre from 'hardhat'
import { ethers } from 'hardhat'
import {  Wallet, Signer } from 'ethers'

import Web3EthAbi from 'web3-eth-abi';
import {
  L2ProjectLaunchFixture, L1Fixture, TONFixture, LockIdFixture,
  SetL2ProjectLaunchFixture, StosFixture
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
import { MockL2TokenFactory } from '../../typechain-types/contracts/test/MockL2TokenFactory.sol'

import { L2ProjectManager } from '../../typechain-types/contracts/L2/L2ProjectManager.sol'
import { L2ProjectManagerProxy } from '../../typechain-types/contracts/L2/L2ProjectManagerProxy'


import { Lib_AddressManager } from '../../typechain-types/contracts/test/Lib_AddressManager'
import { MockL1Messenger } from '../../typechain-types/contracts/test/MockL1Messenger.sol'
import { MockL2Messenger } from '../../typechain-types/contracts/test/MockL2Messenger'
import { MockL1Bridge } from '../../typechain-types/contracts/test/MockL1Bridge.sol'
import { MockL2Bridge } from '../../typechain-types/contracts/test/MockL2Bridge'
import { LockTOS } from '../../typechain-types/contracts/test/LockTOS'
import { TOS } from '../../typechain-types/contracts/test/TOS'
import { TON } from '../../typechain-types/contracts/test/TON.sol'
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

// L2LpRewardVault
import { L2LpRewardVault } from '../../typechain-types/contracts/L2/vaults/L2LpRewardVault.sol'
import { L2LpRewardVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2LpRewardVaultProxy'

// L2ScheduleVault ( team, marketing )
import { L2ScheduleVault } from '../../typechain-types/contracts/L2/vaults/L2ScheduleVault'
import { L2ScheduleVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2ScheduleVaultProxy'
// L2NonScheduleVault (dao)
import { L2NonScheduleVault } from '../../typechain-types/contracts/L2/vaults/L2NonScheduleVault'
import { L2CustomVaultBaseProxy } from '../../typechain-types/contracts/L2/vaults/L2CustomVaultBaseProxy'

// LpReward
// TonAirdrop
// TosAirDrop
import { L2AirdropStosVault } from '../../typechain-types/contracts/L2/vaults/L2AirdropStosVault.sol'
import { L2AirdropStosVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2AirdropStosVaultProxy'
import { L2DividendPoolForStos } from '../../typechain-types/contracts/L2/airdrop/L2DividendPoolForStos.sol'
import { L2DividendPoolForStosProxy } from '../../typechain-types/contracts/L2/airdrop/L2DividendPoolForStosProxy'
import { L2UniversalStos } from '../../typechain-types/contracts/L2/stos/L2UniversalStos.sol'
import { L2UniversalStosProxy } from '../../typechain-types/contracts/L2/stos/L2UniversalStosProxy'

import { L2AirdropTonVault } from '../../typechain-types/contracts/L2/vaults/L2AirdropTonVault.sol'
import { L2AirdropTonVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2AirdropTonVaultProxy'

import { LibPublicSaleVault } from '../../typechain-types/contracts/libraries/LibPublicSaleVault.sol'
import { L2PublicSaleVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2PublicSaleVaultProxy'
import { L2PublicSaleVault } from '../../typechain-types/contracts/L2/vaults/L2PublicSaleVault.sol'
import { L2PublicSaleProxy } from '../../typechain-types/contracts/L2/vaults/L2PublicSaleProxy.sol'

import { L2VestingFundVaultProxy } from  "../../typechain-types/contracts/L2/vaults/L2VestingFundVaultProxy"
import { L2VestingFundVault } from  "../../typechain-types/contracts/L2/vaults/L2VestingFundVault.sol"

import { L1BurnVaultProxy } from  "../../typechain-types/contracts/L1/L1BurnVaultProxy"
import { L1BurnVault } from  "../../typechain-types/contracts/L1/L1BurnVault.sol"


import l1BurnVaultJson from "../../artifacts/contracts/L1/L1BurnVault.sol/L1BurnVault.json";

import l2VestingFundJson from "../../artifacts/contracts/L2/vaults/L2VestingFundVault.sol/L2VestingFundVault.json";

import l2PublicSaleJson from "../../artifacts/contracts/L2/vaults/L2PublicSaleVault.sol/L2PublicSaleVault.json";
import l2PublicSaleProxyJson from "../../artifacts/contracts/L2/vaults/L2PublicSaleProxy.sol/L2PublicSaleProxy.json";

import l1ProjectManagerJson from "../../artifacts/contracts/L1/L1ProjectManager.sol/L1ProjectManager.json";
import l2ProjectManagerJson from "../../artifacts/contracts/L2/L2ProjectManager.sol/L2ProjectManager.json";
import initialLiquidityVaultJson from "../../artifacts/contracts/L2/vaults/L2InitialLiquidityVault.sol/L2InitialLiquidityVault.json";
import daoVaultJson from "../../artifacts/contracts/L2/vaults/L2NonScheduleVault.sol/L2NonScheduleVault.json";
import L2ScheduleVaultJson from "../../artifacts/contracts/L2/vaults/L2ScheduleVault.sol/L2ScheduleVault.json";
import L2NonScheduleVaultJson from "../../artifacts/contracts/L2/vaults/L2NonScheduleVault.sol/L2NonScheduleVault.json";
import L1StosToL2Json from "../../artifacts/contracts/L1/L1StosToL2.sol/L1StosToL2.json";
import L1StosInL2Json from "../../artifacts/contracts/L2/L1StosInL2.sol/L1StosInL2.json";
import LockIdNftForRegisterJson from "../../artifacts/contracts/stos/LockIdNftForRegister.sol/LockIdNftForRegister.json";
import L2AirdropStosVaultJson from "../../artifacts/contracts/L2/vaults/L2AirdropStosVault.sol/L2AirdropStosVault.json";
import L2DividendPoolForStosJson from "../../artifacts/contracts/L2/airdrop/L2DividendPoolForStos.sol/L2DividendPoolForStos.json";
import L2UniversalStosJson from "../../artifacts/contracts/L2/stos/L2UniversalStos.sol/L2UniversalStos.json";
import L2LpRewardVaultJson from "../../artifacts/contracts/L2/vaults/L2LpRewardVault.sol/L2LpRewardVault.json";
import L2AirdropTonVaultJson from "../../artifacts/contracts/L2/vaults/L2AirdropTonVault.sol/L2AirdropTonVault.json";


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

// // titan goerli
// export const l2UniswapInfo = {
//   uniswapV3Factory: '0x37B8d7714419ba5B50379b799a0B2a582274F5Eb',
//   npm: '0x8631308cDa88E98fc9DD109F537F9dEf84539370',
//   ton: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
//   tos: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
//   quoter: '0xfD0c2ACFE71af67BC150cCd13dF3BEd6A3c22875',
//   uniswapRouter: '0xf28cfA043766e4Fe9e390D66e0cd07991290fdD8'
// }


//  goerli
export const l2UniswapInfo = {
  uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  npm: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  ton: '0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00',
  tos: '0x67f3be272b1913602b191b3a68f7c238a2d81bb9',
  quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  uniswapRouter: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'
}


export const l1Fixtures = async function (): Promise<L1Fixture> {
  const [deployer, addr1, addr2, sequencer1, create2Deployer] = await ethers.getSigners();

  const LockTOS_ = await ethers.getContractFactory('LockTOS');
  const lockTOS = (await LockTOS_.connect(deployer).deploy()) as LockTOS

  const TOS_ = await ethers.getContractFactory('TOS');
  const tos = (await TOS_.connect(deployer).deploy(
    tosInfo.name, tosInfo.symbol, tosInfo.version
  )) as TOS

  // await (await lockTOS.connect(deployer).initialize(
  //   tos.address,
  //   lockTosInitializeIfo.epochUnit,
  //   lockTosInitializeIfo.maxTime
  // )).wait()

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
    const { paymasterAddress, l1AddressManagerAddress, tosAddress, tosAdminAddress } = await hre.getNamedAccounts();

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

    //==== L2PublicSaleVault =================================
    const l2PublicSaleProxy = await ethers.getContractFactory('L2PublicSaleVaultProxy')
    const l2PublicProxy = (await l2PublicSaleProxy.connect(deployer).deploy()) as L2PublicSaleVaultProxy

    const libL2PublicSale = await ethers.getContractFactory('LibPublicSaleVault')
    const libL2Public = (await libL2PublicSale.connect(deployer).deploy()) as LibPublicSaleVault

    const l2PublicSaleLogic = await ethers.getContractFactory('L2PublicSaleVault', {
      signer: deployer, libraries: { LibPublicSaleVault: libL2Public.address }
    })
    // const l2PublicLogic = (await l2PublicSaleLogic.connect(deployer).deploy()) as L2PublicSaleVault
    let l2PublicProxyLogic = (await l2PublicSaleLogic.connect(deployer).deploy()) as L2PublicSaleVault

    // await (await l2PublicProxy.connect(deployer).upgradeTo(l2PublicLogic.address)).wait()
    // const l2PublicProxyLogic = await ethers.getContractAt(l2PublicSaleJson.abi, l2PublicProxy.address, deployer) as L2PublicSaleVault;

    const l2PublicVaultProxyContract = await ethers.getContractFactory('L2PublicSaleProxy')
    let l2PublicVaultProxy = (await l2PublicVaultProxyContract.connect(deployer).deploy()) as L2PublicSaleProxy 

    await (await l2PublicProxy.connect(deployer).upgradeTo(l2PublicProxyLogic.address)).wait()

    l2PublicProxyLogic = await ethers.getContractAt(l2PublicSaleJson.abi, l2PublicProxy.address, deployer) as L2PublicSaleVault 

    //==== L2InitialLiquidityVault =================================
    
    const L2InitialLiquidityVaultProxy = await ethers.getContractFactory('L2InitialLiquidityVaultProxy')
    const l2liquidityProxy = (await L2InitialLiquidityVaultProxy.connect(deployer).deploy()) as L2InitialLiquidityVaultProxy

    const L2InitialLiquidityVault = await ethers.getContractFactory('L2InitialLiquidityVault')
    const l2liquidity = (await L2InitialLiquidityVault.connect(deployer).deploy()) as L2InitialLiquidityVault

    //==== L2VestingFundVault =================================

    const L2VestingFundVaultProxy = await ethers.getContractFactory('L2VestingFundVaultProxy')
    const l2vestingFundProxy = (await L2VestingFundVaultProxy.connect(deployer).deploy()) as L2VestingFundVaultProxy

    const L2VestingFundVault = await ethers.getContractFactory('L2VestingFundVault')
    const l2vestingFund = (await L2VestingFundVault.connect(deployer).deploy()) as L2VestingFundVault

    await (await l2vestingFundProxy.connect(deployer).upgradeTo(l2vestingFund.address)).wait()
    const l2VestingFundLogic = await ethers.getContractAt(l2VestingFundJson.abi, l2vestingFundProxy.address, deployer) as L2VestingFundVault


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
      addr3: addr3,
      addr4: addr4,
      addr5: addr5,
      // factoryDeployer: create2Signer,
      addressManager: addressManager,
      l1Messenger: l1Messenger,
      l2Messenger: l2Messenger,
      l1Bridge: l1Bridge,
      l2Bridge: l2Bridge,
      l2PublicProxy: l2PublicProxy,
      libL2Public: libL2Public,
      l2PublicProxyLogic: l2PublicProxyLogic,
      l2PublicVaultProxy: l2PublicVaultProxy,
      l2ProjectManagerAddr: L2projectManagerAddr,
      l2VaultAdmin: L2vaultAdmin,
      l2LiquidityProxy: l2liquidityProxy,
      l2Liquidity: l2liquidity,
      vestingFundAddr: vestingFundAddr,
      l2VestingFundProxy: l2vestingFundProxy,
      l2VestingFund: l2VestingFundLogic,
      // factory: factory,
      l1toL2Message : l1toL2Message,
      paymasterAddress: paymasterAddress,
      l2PaymasterDeposit: l2PaymasterDeposit
  }
}

export const l2ProjectLaunchFixtures2 = async function (mockL2FactoryFlag: boolean): Promise<SetL2ProjectLaunchFixture> {

  const [deployer, addr1, addr2, sequencer1] = await ethers.getSigners();
  const {l2TonAddress, l2TosAddress, tonAddress, uniswapFactory, tosAddress, tosAdminAddress } = await hre.getNamedAccounts();
  const init_code_hash = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'

  //==== LibProject =================================
  // console.log("2")
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
  let l2TokenFactoryDeployment ;
  let l2TokenFactory;

  if (mockL2FactoryFlag) {
    l2TokenFactoryDeployment = await ethers.getContractFactory("MockL2TokenFactory");
    l2TokenFactory = (await l2TokenFactoryDeployment.connect(deployer).deploy()) as MockL2TokenFactory;
  } else {
    l2TokenFactoryDeployment = await ethers.getContractFactory("L2TokenFactory");
    l2TokenFactory = (await l2TokenFactoryDeployment.connect(deployer).deploy()) as MockL2TokenFactory;
  }

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
  // console.log('l2ProjectManager', l2ProjectManager.address)
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
  // console.log(' set Vaults'  )

  //==== L2PublicSaleVault =================================

  const LibPublicSaleVaultDep = await ethers.getContractFactory('LibPublicSaleVault')
  const libPublicSaleVault = (await LibPublicSaleVaultDep.connect(deployer).deploy()) as LibPublicSaleVault

  const L2PublicSaleVaultProxyDep = await ethers.getContractFactory('L2PublicSaleVaultProxy')
  const l2PublicSaleVaultProxy = (await L2PublicSaleVaultProxyDep.connect(deployer).deploy()) as L2PublicSaleVaultProxy

  const L2PublicSaleVaultDep = await ethers.getContractFactory('L2PublicSaleVault', {
    signer: deployer, libraries: { LibPublicSaleVault: libPublicSaleVault.address }
  })
  const l2PublicSaleVaultLogic2 = (await L2PublicSaleVaultDep.connect(deployer).deploy()) as L2PublicSaleVault

  const L2PublicSaleProxyDep = await ethers.getContractFactory('L2PublicSaleProxy')
  let l2PublicSaleProxyLogic = (await L2PublicSaleProxyDep.connect(deployer).deploy()) as L2PublicSaleProxy

  await (await l2PublicSaleVaultProxy.connect(deployer).upgradeTo(l2PublicSaleProxyLogic.address)).wait()
  const l2PublicSaleProxy = await ethers.getContractAt(l2PublicSaleProxyJson.abi, l2PublicSaleVaultProxy.address, deployer) as L2PublicSaleProxy

  // await (await l2PublicSaleProxy.connect(deployer).upgradeTo(l2PublicSaleVaultLogic2.address)).wait()
  // const l2PublicSaleVault = await ethers.getContractAt(l2PublicSaleJson.abi, l2PublicSaleVaultProxy.address, deployer) as L2PublicSaleVault

  //==== L2VestingFundVault =================================

  const L2VestingFundVaultProxyDep = await ethers.getContractFactory('L2VestingFundVaultProxy')
  const l2VestingFundVaultProxy = (await L2VestingFundVaultProxyDep.connect(deployer).deploy()) as L2VestingFundVaultProxy

  const L2VestingFundVaultDep = await ethers.getContractFactory('L2VestingFundVault')
  const l2VestingFundVaultLogic = (await L2VestingFundVaultDep.connect(deployer).deploy()) as L2VestingFundVault

  await (await l2VestingFundVaultProxy.connect(deployer).upgradeTo(l2VestingFundVaultLogic.address)).wait()
  const l2VestingFundVault = await ethers.getContractAt(l2VestingFundJson.abi, l2VestingFundVaultProxy.address, deployer) as L2VestingFundVault

  //==== L1BurnVaultProxy =================================

  const L1BurnVaultProxyDep = await ethers.getContractFactory('L1BurnVaultProxy')
  const l1BurnVaultProxy = (await L1BurnVaultProxyDep.connect(deployer).deploy()) as L1BurnVaultProxy

  const L1BurnVaultDep = await ethers.getContractFactory('L1BurnVault')
  const l1BurnVaultLogic = (await L1BurnVaultDep.connect(deployer).deploy()) as L1BurnVault

  await (await l1BurnVaultProxy.connect(deployer).upgradeTo(l1BurnVaultLogic.address)).wait()
  const l1BurnVault = await ethers.getContractAt(l1BurnVaultJson.abi, l1BurnVaultProxy.address, deployer) as L1BurnVault

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


  //==== L2LpRewardVault =================================
  const l2LpRewardVaultDeployment = await ethers.getContractFactory("L2LpRewardVault")
  const l2LpRewardVaultImpl = (await l2LpRewardVaultDeployment.connect(deployer).deploy()) as L2LpRewardVault;

  //==== L2LpRewardVaultProxy =================================
  const L2LpRewardVaultProxyDeployment = await ethers.getContractFactory("L2LpRewardVaultProxy")
  const l2LpRewardVaultProxy = (await L2LpRewardVaultProxyDeployment.connect(deployer).deploy()) as L2LpRewardVaultProxy;

  impl = await l2LpRewardVaultProxy.implementation()
  if (impl != l2LpRewardVaultImpl.address) {
    await (await l2LpRewardVaultProxy.connect(deployer).upgradeTo(l2LpRewardVaultImpl.address)).wait()
  }

  const l2LpRewardVault = await ethers.getContractAt(
    L2LpRewardVaultJson.abi, l2LpRewardVaultProxy.address, deployer) as L2LpRewardVault;

  await (await l2LpRewardVault.connect(deployer).setPoolInitCodeHash(init_code_hash)).wait()
  await (await l2LpRewardVault.connect(deployer).setUniswapV3Factory(uniswapFactory)).wait()

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

  //==== L2AirdropStosVault =========================
  const airdropStosVaultDeployment = await ethers.getContractFactory("L2AirdropStosVault")
  const airdropStosVaultImpl = (await airdropStosVaultDeployment.connect(deployer).deploy()) as L2AirdropStosVault;

  //==== L2AirdropStosVaultProxy =================================
  const airdropStosVaultProxyDeployment = await ethers.getContractFactory("L2AirdropStosVaultProxy")
  const airdropStosVaultProxy = (await airdropStosVaultProxyDeployment.connect(deployer).deploy()) as L2AirdropStosVaultProxy;

  impl = await airdropStosVaultProxy.implementation()
  if (impl != airdropStosVaultImpl.address) {
    await (await airdropStosVaultProxy.connect(deployer).upgradeTo(airdropStosVaultImpl.address)).wait()
  }

  const airdropStosVault = await ethers.getContractAt(
    L2AirdropStosVaultJson.abi, airdropStosVaultProxy.address, deployer) as L2AirdropStosVault;


  //==== L2AirdropStosVault =========================
  const airdropTonVaultDeployment = await ethers.getContractFactory("L2AirdropTonVault")
  const airdropTonVaultImpl = (await airdropTonVaultDeployment.connect(deployer).deploy()) as L2AirdropTonVault;

  //==== L2AirdropTonVaultProxy =================================
  const airdropTonVaultProxyDeployment = await ethers.getContractFactory("L2AirdropTonVaultProxy")
  const airdropTonVaultProxy = (await airdropStosVaultProxyDeployment.connect(deployer).deploy()) as L2AirdropTonVaultProxy;

  impl = await airdropTonVaultProxy.implementation()
  if (impl != airdropTonVaultImpl.address) {
    await (await airdropTonVaultProxy.connect(deployer).upgradeTo(airdropTonVaultImpl.address)).wait()
  }

  const airdropTonVault = await ethers.getContractAt(
    L2AirdropTonVaultJson.abi, airdropTonVaultProxy.address, deployer) as L2AirdropTonVault;


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
  await (await l2PublicSaleProxy.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await initialLiquidityVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await l2LpRewardVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await daoVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await marketingVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await teamVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await scheduleVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await nonScheduleVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await airdropStosVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()
  await (await airdropTonVault.connect(deployer).setL2ProjectManager(l2ProjectManager.address)).wait()

  await (await l2VestingFundVaultProxy.connect(deployer).setBaseInfoProxy(
    tonAddress,
    tosAddress,
    l2ProjectManager.address,
    l2PublicSaleProxy.address,
    l2UniswapInfo.uniswapV3Factory
    )).wait()

  await (await l2PublicSaleProxy.connect(deployer).setMaxMinPercent(5,10)).wait()


  //==== L2UniversalStos =========================
  const l2UniversalStosDeployment = await ethers.getContractFactory("L2UniversalStos")
  const l2UniversalStosImpl = (await l2UniversalStosDeployment.connect(deployer).deploy()) as L2UniversalStos;

  //==== L2UniversalStosProxy =================================
  const l2UniversalStosProxyDeployment = await ethers.getContractFactory("L2UniversalStosProxy")
  const l2UniversalStosProxy = (await l2UniversalStosProxyDeployment.connect(deployer).deploy()) as L2UniversalStosProxy;

  impl = await l2UniversalStosProxy.implementation()
  if (impl != l2UniversalStosImpl.address) {
    await (await l2UniversalStosProxy.connect(deployer).upgradeTo(l2UniversalStosImpl.address)).wait()
  }

  const l2UniversalStos = await ethers.getContractAt(
    L2UniversalStosJson.abi, l2UniversalStosProxy.address, deployer) as L2UniversalStos;

  // let l2StakeV2_l2UniversalStosProxy = await l2UniversalStos.l2StakeV2()
  // if (l2StakeV2_l2UniversalStosProxy != l2DividendPoolForStosProxy.address) {
  //   await (await airdropStosVault.connect(deployer).setDividendPool(l2DividendPoolForStosProxy.address)).wait()
  // }
  // let lockIdNftForRegister_l2UniversalStosProxy = await l2UniversalStos.lockIdNftForRegister()
  // if (lockIdNftForRegister_l2UniversalStosProxy != ethers.constants.AddressZero &&
  //     lockIdNftForRegister_l2UniversalStosProxy != lockIdNftForRegister.address) {
  //   await (await l2UniversalStos.connect(deployer).setLockIdNftForRegister(lockIdNftForRegister.address)).wait()
  // }


  //==== L2DividendPoolForStos =========================
  const l2DividendPoolForStosDeployment = await ethers.getContractFactory("L2DividendPoolForStos")
  const l2DividendPoolForStosImpl = (await l2DividendPoolForStosDeployment.connect(deployer).deploy()) as L2DividendPoolForStos;

  //==== L2DividendPoolForStosProxy =================================
  const l2DividendPoolForStosProxyDeployment = await ethers.getContractFactory("L2DividendPoolForStosProxy")
  const l2DividendPoolForStosProxy = (await l2DividendPoolForStosProxyDeployment.connect(deployer).deploy()) as L2DividendPoolForStosProxy;

  impl = await l2DividendPoolForStosProxy.implementation()
  if (impl != l2DividendPoolForStosImpl.address) {
    await (await l2DividendPoolForStosProxy.connect(deployer).upgradeTo(l2DividendPoolForStosImpl.address)).wait()
  }
  const l2DividendPoolForStos = await ethers.getContractAt(
    L2DividendPoolForStosJson.abi, l2DividendPoolForStosProxy.address, deployer) as L2DividendPoolForStos;

  let dividendPool_airdropStosVaultProxy = await airdropStosVault.dividendPool()
  if (dividendPool_airdropStosVaultProxy != l2DividendPoolForStosProxy.address) {
    await (await airdropStosVault.connect(deployer).setDividendPool(l2DividendPoolForStosProxy.address)).wait()
  }

  let universalStos_l2DividendPoolForStos = await l2DividendPoolForStos.universalStos()
  if (universalStos_l2DividendPoolForStos != l2UniversalStosProxy.address) {
    await (await l2DividendPoolForStos.connect(deployer).initialize(
      l2UniversalStosProxy.address,
      lockTosInitializeIfo.epochUnit
    )).wait()
  }

  //==== For Test , set setDividendPool of L2AirdropTonVault =========================
  //  아직 L2DividendPoolForTon 개발이 되지 않아서, stos용으로 테스트를 한다 .
  let dividendPool_airdropTonVaultProxy = await airdropTonVault.dividendPool()
  if (dividendPool_airdropTonVaultProxy != l2DividendPoolForStosProxy.address) {
    await (await airdropTonVault.connect(deployer).setDividendPool(l2DividendPoolForStosProxy.address)).wait()
  }

  //======================
  // for test (npx hardhat test test/2.L1ProjectManager.spec.ts로 테스트할때는 토큰도 L2StandardERC20 로 맏들수없는데.. )
  if (mockL2FactoryFlag) {
    await (await l2TokenFactory.connect(deployer).setL2Bridge(l2Bridge.address)).wait()
  }

  await (await l2TokenFactory.connect(deployer).setL1Bridge(l1Bridge.address)).wait()
  await (await l2Bridge.connect(deployer).setAddress(
    l2Messenger.address, l1Bridge.address)).wait()


  await (await l2PublicSaleProxy.connect(deployer).setAddress(
    [
      l2UniswapInfo.quoter,
      l2VestingFundVaultProxy.address,
      initialLiquidityVault.address,
      l2UniswapInfo.uniswapRouter,
      l2DividendPoolForStosProxy.address,
      tosAddress,
      tonAddress
    ] )).wait()

  await (await l2PublicSaleProxy.connect(deployer).setBurnBridge(
    l1Bridge.address,
    l1BurnVault.address
  )).wait()

  // console.log("1")
  await (await l1ProjectManager.connect(deployer).setL2PublicSaleValue(
    5,
    10,
    100
  )).wait()

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
      l2LpRewardVault: l2LpRewardVault,
      l2LpRewardVaultProxy: l2LpRewardVaultProxy,
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
      airdropStosVault: airdropStosVault,
      airdropStosVaultProxy: airdropStosVaultProxy,
      l2DividendPoolForStos: l2DividendPoolForStos,
      l2DividendPoolForStosProxy: l2DividendPoolForStosProxy,
      l2UniversalStos: l2UniversalStos,
      l2UniversalStosProxy: l2UniversalStosProxy,
      airdropTonVault: airdropTonVault,
      airdropTonVaultProxy: airdropTonVaultProxy,
      tosAddress: tosAddress,
      tosAdminAddress: tosAdminAddress,
      tonAddress: tonAddress,
      l2PublicSaleProxy: l2PublicSaleProxy,
      l2VestingFundVault: l2VestingFundVault,
      l1BurnVault: l1BurnVault,
      l2TonAddress: l2TonAddress,
      l2TosAddress: l2TosAddress
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

export const stosFixture = async function (): Promise<StosFixture> {
  const [deployer, addr1, addr2, sequencer1] = await ethers.getSigners();
  const { tonAddress, tonAdminAddress, lockTOSAddress, tosAddress,
    l1MessengerAddress, l1BridgeAddress, l1AddressManagerAddress, addressManager
  } = await hre.getNamedAccounts();
  const tonAdmin =  await hre.ethers.getSigner(tonAdminAddress);
  const L1StosInL2_Address = "0xa12431D37095CA8e3C04Eb1a4e7cE235718F10bF"

  let lockTOSAbi = require("../../artifacts/contracts/test/LockTOS.sol/LockTOS.json");
  let TOSAbi = require("../../artifacts/contracts/test/LockTOS.sol/LockTOS.json");

  const lockTOS = (await ethers.getContractAt(lockTOSAbi.abi, lockTOSAddress, deployer)) as LockTOS
  const tos = (await ethers.getContractAt(TOSAbi.abi, tosAddress, deployer)) as TOS

  // console.log('lockTOS', lockTOS.address)
  // console.log('tos', tos.address)

  //==== LibProject =================================
  const LibProject_ = await ethers.getContractFactory('LibProject');
  const libProject = (await LibProject_.connect(deployer).deploy()) as LibProject

  // console.log('libProject', libProject.address)
  //---- for L2 message
  // const Lib_AddressManager = await ethers.getContractFactory('Lib_AddressManager')
  // const addressManager = (await Lib_AddressManager.connect(deployer).deploy()) as Lib_AddressManager
  // await addressManager.connect(deployer).setAddress("OVM_Sequencer", sequencer1.address);

  //---
  // const MockL1Messenger = await ethers.getContractFactory('MockL1Messenger')
  // const l1Messenger = (await MockL1Messenger.connect(deployer).deploy()) as MockL1Messenger
  // const MockL2Messenger = await ethers.getContractFactory('MockL2Messenger')
  // const l2Messenger = (await MockL2Messenger.connect(deployer).deploy()) as MockL2Messenger

  // await addressManager.connect(deployer).setAddress("Proxy__OVM_L1CrossDomainMessenger", l1Messenger.address);
  // await (await l1Messenger.connect(deployer).setL2messenger(l2Messenger.address)).wait()

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

  // console.log('l1StosToL2Logic', l1StosToL2Logic.address)
  // console.log('l1StosToL2Proxy', l1StosToL2Proxy.address)

  let impl_l1StosToL2Proxy = await l1StosToL2Proxy.implementation()
  // console.log('impl_l1StosToL2Proxy', impl_l1StosToL2Proxy)


  if(impl_l1StosToL2Proxy != l1StosToL2Logic.address) {
    await (await l1StosToL2Proxy.connect(deployer).upgradeTo(l1StosToL2Logic.address)).wait()
  }

  const l1StosToL2 = (await ethers.getContractAt(L1StosToL2Json.abi, l1StosToL2Proxy.address, deployer)) as L1StosToL2
  // console.log('l1StosToL2', l1StosToL2.address)

  let lockTosAddr = await l1StosToL2Proxy.lockTos()
  if(lockTosAddr != lockTOS.address) {
    await (await l1StosToL2.connect(deployer).initialize(
      deployer.address,
      lockTOS.address,
      addressManager,
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
  if(l2CrossDomainMessenger_l1StosInL2Proxy != l1MessengerAddress) {
    await (await l1StosInL2.connect(deployer).initialize (deployer.address, l1MessengerAddress)).wait()
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

  await (await l1StosToL2.connect(deployer).setL2Register(L1StosInL2_Address)).wait()

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
    l1StosToL2: l1StosToL2,
    l1StosInL2: l1StosInL2,
    lockIdNftRegisterInL2: lockIdNftForRegister
  }
}
