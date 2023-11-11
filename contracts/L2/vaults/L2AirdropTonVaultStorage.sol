// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibScheduleVault } from "../../libraries/LibScheduleVault.sol";

/**
 * @title L2AirdropTonVaultStorage
 * @dev
 */
contract L2AirdropTonVaultStorage {

    // l2token - VaultInfo
    mapping(address => LibScheduleVault.VaultInfo) public vaultInfo;
    address public dividendPool;
    address public ext;
}