// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibScheduleVault
 */
library LibScheduleVault {

    struct VaultInfo {
        uint256 totalAllocatedAmount;   // Token allocation amount
        uint256 totalClaimCount;        // total number of claims
        uint256 totalClaimedAmount;     // Total amount claimed
        uint256 firstClaimAmount;       // first claim amount
        uint32 firstClaimTime;          // first claim time
        uint32 secondClaimTime;         // second claim time
        uint32 roundInterval;    // round interval (seconds)
        uint32 latestClaimedRound;      // the latest claimed round
    }
}