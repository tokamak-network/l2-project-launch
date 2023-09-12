// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibInitialLiquidityVault
 */
library LibInitialLiquidityVault {

    struct PoolInfo {
        address pool;
        uint256 totalAllocatedAmount;
        uint256 initialTosPrice;
        uint256 initialTokenPrice;
        uint256 lpToken;
        uint32 startTime;
        uint160 initSqrtPriceX96;
        uint24  fee;
        bool boolReadyToCreatePool;
    }
}