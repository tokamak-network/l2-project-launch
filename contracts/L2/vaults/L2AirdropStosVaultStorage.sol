// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibScheduleVault } from "../../libraries/LibScheduleVault.sol";

/**
 * @title L2AirdropStosVaultStorage
 * @dev
 */
contract L2AirdropStosVaultStorage {

    // l2token - VaultInfo
    mapping(address => LibScheduleVault.VaultInfo) public vaultInfo;
    address public dividendPool;
}