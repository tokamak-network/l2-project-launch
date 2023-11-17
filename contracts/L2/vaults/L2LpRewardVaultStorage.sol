// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibScheduleVault } from "../../libraries/LibScheduleVault.sol";

import { LibPool } from "../../libraries/LibPool.sol";

/**
 * @title L2LpRewardVaultStorage
 * @dev
 */
contract L2LpRewardVaultStorage {
    bytes32 public pool_init_code_hash;
    address public uniswapV3Factory;
    address public recipient;

    // l2token - pool address - VaultInfo
    mapping(address => mapping(address => LibScheduleVault.VaultInfo)) public vaultInfo;

    // pool - pool info
    mapping(address => LibPool.PoolInfo) public poolInfo;

}