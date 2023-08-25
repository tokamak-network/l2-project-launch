
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import {  Wallet, Signer } from 'ethers'

import { LibProject } from '../../typechain-types/contracts/libraries/LibProject.sol'
import { L1toL2Message } from '../../typechain-types/contracts/L1/L1toL2Message.sol'

import { L1ERC20A_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../../typechain-types/contracts/L1/L1ProjectManager.sol'

import { L2TokenFactory } from '../../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../../typechain-types/contracts/L2//L2ProjectManager'
import { L1ProjectManagerProxy } from '../../typechain-types/contracts/L1/L1ProjectManagerProxy'

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

import { L1StosToL2 } from '../../typechain-types/contracts/L1/L1StosToL2.sol'
import { L1StosInL2 } from '../../typechain-types/contracts/L2/L1StosInL2.sol'
import { LockIdNftForRegister } from '../../typechain-types/contracts/stos/LockIdNftForRegister'

interface L2ProjectLaunchFixture  {
    libProject: LibProject,
    l1ERC20A_TokenFactory: L1ERC20A_TokenFactory,
    l1ERC20B_TokenFactory: L1ERC20B_TokenFactory,
    l1ERC20C_TokenFactory: L1ERC20C_TokenFactory,
    l1ERC20D_TokenFactory: L1ERC20D_TokenFactory,
    l1ProjectManager: L1ProjectManager,
    l1ProjectManagerProxy: L1ProjectManagerProxy,
    l2TokenFactory: L2TokenFactory,
    l2ProjectManager: L2ProjectManager,
    deployer: Signer,
    addr1: Signer,
    addr2: Signer,
    // factoryDeployer: Signer,
    addressManager: Lib_AddressManager,
    l1Messenger: MockL1Messenger,
    l2Messenger: MockL2Messenger,
    l1Bridge: MockL1Bridge,
    l2Bridge: MockL2Bridge,
    // factory: Create2Deployer,
    // l1toL2MessageTest: L1toL2MessageTest
    l1toL2Message: L1toL2Message,
    paymasterAddress: string,
    l2PaymasterDeposit: L2PaymasterDeposit
}

interface ProjectInfo {
    projectOwner: string,
    tokenOwner: string,
    l1Token: string,
    l2Token: string,
    addressManager: string,
    initialTotalSupply: BigNumber,
    tokenType: number,
    l2Type: number,
    projectName: string,
}

interface L1Fixture {
    deployer: Signer,
    addr1: Signer,
    addr2: Signer,
    tos: TOS,
    lockTOS: LockTOS
}

interface Point {
    slope: BigNumber,
    bias: BigNumber,
    timestamp: BigNumber
}

interface SyncInfo {
    slope: BigNumber,
    bias: BigNumber,
    timestamp: BigNumber,
    syncTime: BigNumber
}

interface LockedBalance {
    start: BigNumber,
    end: BigNumber,
    amount: BigNumber,
    withdrawn: boolean
}

interface LockedBalanceInfo {
    id: BigNumber,
    start: BigNumber,
    end: BigNumber,
    amount: BigNumber,
    balance: BigNumber
}

interface TONFixture {
    tonAddress: string,
    tonAdminAddress: string,
    l2TonAddress: string,
    tonAdmin: Signer
}

interface LockIdFixture {
    deployer: Signer,
    addr1: Signer,
    addr2: Signer,
    tos: TOS,
    lockTOS: LockTOS,
    tonAddress: string,
    tonAdminAddress: string,
    tonAdmin: Signer,
    lockIdNFT: LockIdNFT,
    l1StosToL2: L1StosToL2,
    l1StosInL2: L1StosInL2,
    lockIdNftRegisterInL2: LockIdNftForRegister,
    addressManager: Lib_AddressManager,
    l1Messenger: MockL1Messenger
}

interface NftTokenInfo {
    name: string,
    symbol: string,
}

interface SnapshotBalance {
    timestamp: number,
    balance: BigNumber
}

export {
    L2ProjectLaunchFixture,
    ProjectInfo,
    L1Fixture,
    Point,
    LockedBalance,
    LockedBalanceInfo,
    TONFixture,
    LockIdFixture,
    NftTokenInfo,
    SyncInfo,
    SnapshotBalance
}
