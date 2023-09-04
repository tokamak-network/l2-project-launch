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

    LibLockTOSv2.Point[] public pointHistory;
    mapping(uint256 => LibLockTOSv2.Point[]) public lockPointHistory;
    // mapping(address => mapping(uint256 => LibLockTOSv2.LockedBalance))
    //     public lockedBalances;
    // mapping(address => mapping(uint256 => bool)) public lockedBalances;
    mapping(address => mapping(uint256 => bool)) public userLocksCheck;

    mapping(uint256 => LibLockTOSv2.LockedBalance) public allLocks;
    mapping(address => uint256[]) public userLocks;
    mapping(uint256 => int256) public slopeChanges;
    mapping(uint256 => bool) public inUse;


    // Mapping from token ID to approved address
    mapping (uint256 => address) public _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping (address => mapping (address => bool)) public _operatorApprovals;

    // 무제한 락업 account - UnlimitedAmount
    mapping(address => LibLockTOSv2.UnlimitedAmount[]) public unlimitedAmountByAccount;

    // 무제한 락업 시간대의 타임 (매주목요일0시) - UnlimitedAmount
    mapping(uint256 => LibLockTOSv2.UnlimitedAmount[]) public unlimitedHistoryByWeek;

    // 무제한 락업에 대한 업데이트가 있는 주(타임)에 대한 인덱싱
    uint256[] public indexOfTimesetForUnlimited;
    mapping(uint256 => bool) public indexCheckOfTimesetForUnlimited;


    // address[] public uniqueUsers;
    // mapping(address => bool) public boolUniqueUsers;


    modifier nonZero(uint256 amount) {
        require(amount != 0, "zero amount");
        _;
    }
}
