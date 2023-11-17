
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
import { MockL2TokenFactory } from '../../typechain-types/contracts/test/MockL2TokenFactory.sol'
import { L2ProjectManager } from '../../typechain-types/contracts/L2/L2ProjectManager.sol'
import { L1ProjectManagerProxy } from '../../typechain-types/contracts/L1/L1ProjectManagerProxy'
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

import { L1StosToL2 } from '../../typechain-types/contracts/L1/L1StosToL2.sol'
import { L1StosInL2 } from '../../typechain-types/contracts/L2/L1StosInL2.sol'
import { LockIdNftForRegister } from '../../typechain-types/contracts/stos/LockIdNftForRegister'
import { LockIdNftTransferable } from '../../typechain-types/contracts/stos/LockIdNftTransferable'
import { LockTOSv2 } from '../../typechain-types/contracts/stos/LockTOSv2'

//L2InitialLiquidityVault
import { L2InitialLiquidityVault } from '../../typechain-types/contracts/L2/vaults/L2InitialLiquidityVault.sol'
import { L2InitialLiquidityVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2InitialLiquidityVaultProxy'

import { L2LpRewardVault } from '../../typechain-types/contracts/L2/vaults/L2LpRewardVault.sol'
import { L2LpRewardVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2LpRewardVaultProxy'


// L2ScheduleVault ( team, marketing )
import { L2ScheduleVault } from '../../typechain-types/contracts/L2/vaults/L2ScheduleVault'
import { L2ScheduleVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2ScheduleVaultProxy'
// L2NonScheduleVault (dao)
import { L2NonScheduleVault } from '../../typechain-types/contracts/L2/vaults/L2NonScheduleVault'
import { L2CustomVaultBaseProxy } from '../../typechain-types/contracts/L2/vaults/L2CustomVaultBaseProxy'

import { L2AirdropStosVault } from '../../typechain-types/contracts/L2/vaults/L2AirdropStosVault.sol'
import { L2AirdropStosVaultProxy } from '../../typechain-types/contracts/L2/vaults/L2AirdropStosVaultProxy'
import { L2DividendPoolForStos } from '../../typechain-types/contracts/L2/airdrop/L2DividendPoolForStos.sol'
import { L2DividendPoolForStosProxy } from '../../typechain-types/contracts/L2/airdrop/L2DividendPoolForStosProxy'
import { L2UniversalStos } from '../../typechain-types/contracts/L2/stos/L2UniversalStos.sol'
import { L2UniversalStosProxy } from '../../typechain-types/contracts/L2/stos/L2UniversalStosProxy'

// LpReward
// TonAirdrop
// TosAirDrop



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


interface SetL2ProjectLaunchFixture  {
    libProject: LibProject,
    l1ERC20A_TokenFactory: L1ERC20A_TokenFactory,
    l1ERC20B_TokenFactory: L1ERC20B_TokenFactory,
    l1ERC20C_TokenFactory: L1ERC20C_TokenFactory,
    l1ERC20D_TokenFactory: L1ERC20D_TokenFactory,
    l1ProjectManager: L1ProjectManager,
    l1ProjectManagerProxy: L1ProjectManagerProxy,
    l2TokenFactory: MockL2TokenFactory,
    l2ProjectManager: L2ProjectManager,
    l2ProjectManagerProxy: L2ProjectManagerProxy,
    deployer: Signer,
    addr1: Signer,
    addr2: Signer,
    addressManager: Lib_AddressManager,
    l1Messenger: MockL1Messenger,
    l2Messenger: MockL2Messenger,
    l1Bridge: MockL1Bridge,
    l2Bridge: MockL2Bridge,
    // publicSaleVault:
    initialLiquidityVault: L2InitialLiquidityVault,
    initialLiquidityVaultProxy: L2InitialLiquidityVaultProxy,
    l2LpRewardVault: L2LpRewardVault,
    l2LpRewardVaultProxy: L2LpRewardVaultProxy,
    daoVault: L2NonScheduleVault,
    daoVaultProxy: L2CustomVaultBaseProxy,
    marketingVault : L2ScheduleVault,
    marketingVaultProxy : L2ScheduleVaultProxy,
    teamVault: L2ScheduleVault,
    teamVaultProxy : L2ScheduleVaultProxy,
    scheduleVault: L2ScheduleVault,
    scheduleVaultProxy: L2ScheduleVaultProxy,
    nonScheduleVault: L2NonScheduleVault,
    nonScheduleVaultProxy: L2CustomVaultBaseProxy,
    airdropStosVault: L2AirdropStosVault,
    airdropStosVaultProxy: L2AirdropStosVaultProxy,
    l2DividendPoolForStos: L2DividendPoolForStos,
    l2DividendPoolForStosProxy: L2DividendPoolForStosProxy,
    l2UniversalStos: L2UniversalStos,
    l2UniversalStosProxy: L2UniversalStosProxy,
    tosAddress: string,
    tosAdminAddress: string
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
    withdrawalTime: number
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
    l1Messenger: MockL1Messenger,
    lockIdNftTransferable: LockIdNftTransferable,
    lockTOSv2: LockTOSv2
}

interface NftTokenInfo {
    name: string,
    symbol: string,
}

interface SnapshotBalance {
    timestamp: number,
    balance: BigNumber
}

interface StosFixture {
    deployer: Signer,
    addr1: Signer,
    addr2: Signer,
    tos: TOS,
    lockTOS: LockTOS,
    tonAddress: string,
    tonAdminAddress: string,
    tonAdmin: Signer,
    l1StosToL2: L1StosToL2,
    l1StosInL2: L1StosInL2,
    lockIdNftRegisterInL2: LockIdNftForRegister
}
export {
    L2ProjectLaunchFixture,
    SetL2ProjectLaunchFixture,
    ProjectInfo,
    L1Fixture,
    Point,
    LockedBalance,
    LockedBalanceInfo,
    TONFixture,
    LockIdFixture,
    NftTokenInfo,
    SyncInfo,
    SnapshotBalance,
    StosFixture
}
