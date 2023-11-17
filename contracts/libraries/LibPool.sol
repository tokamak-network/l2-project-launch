// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


/**
 * @title LibProject
 */
library LibPool {

    struct PoolInfo {
        address token0;
        address token1;
        uint24 fee;
    }
}