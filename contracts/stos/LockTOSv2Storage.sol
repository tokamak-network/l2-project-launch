// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibLockTOSv2.sol";

contract LockTOSv2Storage {
    /// @dev flag for pause proxy
    bool public pauseProxy;

    /// @dev registry
    address public stakeRegistry;
    bool public migratedL2;

    uint256 public epochUnit;
    uint256 public maxTime;

    uint256 public constant MULTIPLIER = 1e18;

    address public tos;
    uint256 public lockIdCounter;
    uint256 public cumulativeEpochUnit;
    uint256 public cumulativeTOSAmount;

    uint256 internal free = 1;

    address[] public uniqueUsers;
    LibLockTOSv2.Point[] public pointHistory;
    mapping(uint256 => LibLockTOSv2.Point[]) public lockPointHistory;
    mapping(address => mapping(uint256 => LibLockTOSv2.LockedBalance))
        public lockedBalances;

    mapping(uint256 => LibLockTOSv2.LockedBalance) public allLocks;
    mapping(address => uint256[]) public userLocks;
    mapping(uint256 => int256) public slopeChanges;
    mapping(uint256 => bool) public inUse;
}
