// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibNonScheduleVault } from "../../libraries/LibNonScheduleVault.sol";
/**
 * @title L2NonScheduleVaultStorage
 * @dev
 */
contract L2NonScheduleVaultStorage {

    // l2token - keccak256 (vault name) - LibNonScheduleVault.VaultInfo
    mapping(address => mapping(bytes32 => LibNonScheduleVault.VaultInfo)) public vaultInfo;


}