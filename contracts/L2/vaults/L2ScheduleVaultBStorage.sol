// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibScheduleVaultB } from "../../libraries/LibScheduleVaultB.sol";
/**
 * @title L2ScheduleVaultBStorage
 * @dev Vaults that Vault Admins claim according to a schedule
 */
contract L2ScheduleVaultBStorage {

    // l2token - keccak256 (vault name) - VaultInfo
    mapping(address => mapping(bytes32 => LibScheduleVaultB.VaultInfo)) public vaultInfo;


}