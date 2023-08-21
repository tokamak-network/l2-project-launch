// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibLockId
 */
library LibLockId {

    // LockId의 포인트 정보
    struct Point {
        int256 slope;
        int256 bias;
        uint256 timestamp; // 등록(시작)시점
    }

    // LockId의 잔고
    struct LockedInfo {
        uint256 start;
        uint256 end;
        uint256 amount;
        address owner;
        bool withdrawn;
    }

    // SyncInfo
    struct SyncInfo {
        uint32 syncTime;
        uint256 blockNumber;
    }

}