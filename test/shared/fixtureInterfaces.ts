
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import {  Wallet, Signer } from 'ethers'

// import { ERC20A } from '../../typechain-types/contracts/L1/tokens/ERC20A'
// import { ERC20B } from '../../typechain-types/contracts/L1/factory/ERC20B'
// import { ERC20C } from '../../typechain-types/contracts/L1/factory/ERC20C'
// import { ERC20D } from '../../typechain-types/contracts/L1/factory/ERC20D'
import { LibProject } from '../../typechain-types/contracts/libraries/constants/LibProject.sol'

import { L1ERC20A_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20A_TokenFactory'
import { L1ERC20B_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20B_TokenFactory'
import { L1ERC20C_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20C_TokenFactory'
import { L1ERC20D_TokenFactory } from '../../typechain-types/contracts/L1/factory/L1ERC20D_TokenFactory'
import { L1ProjectManager } from '../../typechain-types/contracts/L1/L1ProjectManager.sol'

import { L2TokenFactory } from '../../typechain-types/contracts/L2/factory/L2TokenFactory.sol'
import { L2ProjectManager } from '../../typechain-types/contracts/L2//L2ProjectManager'

import { Lib_AddressManager } from '../../typechain-types/contracts/test/Lib_AddressManager'
import { MockL1Messenger } from '../../typechain-types/contracts/test/MockL1Messenger'
import { MockL2Messenger } from '../../typechain-types/contracts/test/MockL2Messenger'
import { MockL1Bridge } from '../../typechain-types/contracts/test/MockL1Bridge.sol'
import { MockL2Bridge } from '../../typechain-types/contracts/test/MockL2Bridge'

interface L2ProjectLaunchFixture  {
    libProject: LibProject,
    l1ERC20A_TokenFactory: L1ERC20A_TokenFactory,
    l1ERC20B_TokenFactory: L1ERC20B_TokenFactory,
    l1ERC20C_TokenFactory: L1ERC20C_TokenFactory,
    l1ERC20D_TokenFactory: L1ERC20D_TokenFactory,
    l1ProjectManager: L1ProjectManager,
    l2TokenFactory: L2TokenFactory,
    l2ProjectManager: L2ProjectManager,
    deployer: Signer,
    addr1: Signer,
    addr2: Signer,
    addressManager: Lib_AddressManager,
    l1Messenger: MockL1Messenger,
    l2Messenger: MockL2Messenger,
    l1Bridge: MockL1Bridge,
    l2Bridge: MockL2Bridge
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
export { L2ProjectLaunchFixture, ProjectInfo }
