// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../libraries/LibLockId.sol";

contract L1StosToL2Storage  {
    uint256 public maxLockCountPerRegister;
    address public _manager;
    address public addressManager;
    address public lockTos;
    address public l2Register;
    uint32 minGasLimitRegister;

    // account-lockId-sync된 정보 (히스토리의 인덱스 번호, time)
    mapping(uint256 => LibLockId.SyncInfo) public syncInfoOfLockId;
    bool internal _lock;

    modifier onlyManager() {
        require(_manager == msg.sender, "not manager");
        _;
    }

    modifier ifFree {
        require(_lock != true, "in use");
        _lock = true;
        _;
        _lock = false;
    }
}
