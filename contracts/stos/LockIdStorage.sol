// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../libraries/LibLockId.sol";

contract LockIdStorage {

    uint256 public constant MULTIPLIER = 1e18;

    address public tos;
    uint256 public epochUnit;
    uint256 public maxTime;
    //
    uint256 public maxTokenId;

    // 락 기본 정보
    mapping(uint256 => LibLockId.LockedInfo) public lockIdInfos;

    // id - point , 특정아이디의 포인트를 모두 저장
    mapping(uint256 => LibLockId.Point[]) public pointHistoryByLockId;

    // 시간대순으로 모든 stos를 관리하는 정보
    // 시간대의 타임 (매주목요일0시) -> 해당 시간대의 포인트 배열
    mapping(uint256 => LibLockId.Point[]) public pointHistoryByWeek;

    // 무제한 락업 시간대의 타임 (매주목요일0시) - UnlimitedAmount
    mapping(uint256 => LibLockId.UnlimitedAmount[]) public unlimitedHistoryByWeek;

    // 업데이트가 있는 주(타임)에 대한 인덱싱
    uint256[] public indexOfTimeset;
    mapping(uint256 => bool) public indexCheckOfTimeset;

    // 무제한 락업 account - UnlimitedAmount
    mapping(address => LibLockId.UnlimitedAmount[]) public unlimitedAmountByAccount;

    // 무제한 락업에 대한 업데이트가 있는 주(타임)에 대한 인덱싱
    uint256[] public indexOfTimesetForUnlimited;
    mapping(uint256 => bool) public indexCheckOfTimesetForUnlimited;

    // 락 기간 정보
    uint256[] public lockPeriod;
    mapping(uint256 => bool) public existedLockPeriod;

    // lockPeriod- 락 종료시간(end time) - 줄어드는 누적 slope
    mapping(uint256 => mapping(uint256 => int256)) public slopeByLockEndTime;
    mapping(uint256 => uint256[]) public indexOfTimesetForLockEnd;
    mapping(uint256 => mapping(uint256 => bool)) public indexCheckOfTimesetForLockEnd;
}
