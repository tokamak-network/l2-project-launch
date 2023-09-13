// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibNonScheduleVault
 */
library LibNonScheduleVault {

    struct VaultInfo {
        address claimer;
        uint256 totalAllocatedAmount;   // Token allocation amount
        uint256 totalClaimedAmount;     // Total amount claimed
    }
}