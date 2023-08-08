// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibStos } from "../libraries/LibStos.sol";
import { LibLockTOS } from "../libraries/LibLockTOS.sol";

/**
 * @title L1TotalStosStorage
 * @dev
 */
contract L1TotalStosStorage {

    uint256 public l2TotalCount;

    // l2Index - l2Info
    mapping(uint256 => LibStos.L2Info) public l2Infos;

    // user - l2Index - StosInfo
    mapping(address => mapping(uint256 => LibStos.StosInfo)) public userStos;


    ///
    LibLockTOS.Point[] public pointHistory;
    mapping(uint256 => LibLockTOS.Point[]) public lockPointHistory;
    mapping(address => mapping(uint256 => LibLockTOS.LockedBalance))
        public lockedBalances;
    mapping(uint256 => LibLockTOS.LockedBalance) public allLocks;
    mapping(address => uint256[]) public userLocks;
    uint256 public lockIdCounter;
}