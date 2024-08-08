// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibVestingFundVault
 */
library LibVestingFundVault {
    struct VaultInfo {
        uint256 totalClaimCount;        // total number of claims
        uint256 firstClaimPercents;       // first claim amount
        uint256 firstClaimTime;          // first claim time
        uint256 secondClaimTime;         // second claim time
        uint256 roundInterval;    // round interval (seconds)
    }
}