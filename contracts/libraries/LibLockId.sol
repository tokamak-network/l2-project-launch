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
        uint256 withdrawlTime;
    }

    // SyncInfo
    struct SyncInfo {
        int256 slope;
        int256 bias;
        uint32 timestamp; // point 정보에 있는 인덱스에 해당하는 timestamp
        uint32 syncTime; // 동기화 시점
    }

    struct SyncPacket {
        uint256 lockId;
        SyncInfo packet;
    }

    struct UnlimitedAmount {
        uint32 timestamp;
        uint256 amount;
    }

}