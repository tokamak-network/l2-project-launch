// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibScheduleVault } from "../../libraries/LibScheduleVault.sol";
/**
 * @title L2ScheduleVaultStorage
 * @dev Vaults that Vault Admins claim according to a schedule
 */
contract L2ScheduleVaultStorage {

    // l2token - keccak256 (vault name) - VaultInfo
    mapping(address => mapping(bytes32 => LibScheduleVault.VaultInfo)) public vaultInfo;


}