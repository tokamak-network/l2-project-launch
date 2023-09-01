// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library LibLockTOSv2 {
    struct Point {
        int256 bias;
        int256 slope;
        uint256 timestamp;
    }

    struct LockedBalance {
        uint256 start;
        uint256 end;
        uint256 amount;
        address owner;
        bool withdrawn;
    }

    struct SlopeChange {
        int256 bias;
        int256 slope;
        uint256 changeTime;
    }

    struct LockedBalanceInfo {
        uint256 id;
        uint256 start;
        uint256 end;
        uint256 amount;
        uint256 balance;
    }
}
