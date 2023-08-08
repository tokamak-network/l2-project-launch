// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibStos
 */
library LibStos {

    // account - l2Index
    struct StosInfo {
        uint32 syncTime;
        uint256 amount;
    }

    // l2Index
    struct L2Info {
        address l1Messanger;
        address l2TotalStos;
        string name;
    }

}