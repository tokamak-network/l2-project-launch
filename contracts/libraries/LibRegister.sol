// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibRegister
 */
library LibRegister {

    struct  TonBalance {
        uint256 balance;
        uint256 refactoredCount;
        uint256 remain;
    }

    struct  TonBalanceOfLayer {
        address coinage;
        TonBalance staked;
    }


    // SyncInfo
    struct TonSyncInfo {
        TonBalanceOfLayer layer;
        uint32 timestamp; // point 정보에 있는 인덱스에 해당하는 timestamp
        uint32 syncTime; // 동기화 시점
    }
}