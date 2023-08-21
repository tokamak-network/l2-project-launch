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

    // l2chainId - l2Info
    mapping(uint256 => LibStos.L2Info) public l2Infos;

    // user - l2chainId - StosInfo
    mapping(address => mapping(uint256 => LibStos.StosInfo)) public userStos;


    /// chainId - [Points]: 모든 추가/수정에 대해 포인트를 저장함.
    mapping(uint256 => LibLockTOS.Point[]) public pointHistory;

    // chainId - lockId - [Points] : 락아이디는 수정할때마다 point 가 늘어남.
    mapping(uint256 => mapping(uint256 => LibLockTOS.Point[])) public lockPointHistory;


    // 특정시간 의 slop 을 저장. 기존의 slop과 변경된 slop 반영 (point)
    // chainId - time - slop
    mapping(uint256 => mapping(uint256 =>int256)) public slopeChanges;


    //-------------------

    // 모든 락아이디 정보, chainId-LockIds-lockInfo
    mapping(uint256 => mapping(uint256 => LibLockTOS.LockedBalance)) public allLocks;

    // 사용자의 모든 락 아이디 , 사용자-chainId- LockIds - 락아이디 정보
    // mapping(address => mapping(uint256 => LibLockTOS.LockedBalance)) public lockedBalances;

    // 사용자의 모든 락 아이디 , 사용자-chainId-[ LockIds ]
    mapping(address => mapping(uint256 => uint256[])) public userLocks;

    // chainId - 락아이디 개수
    mapping(uint256 => uint256) public lockIdCounter;
}