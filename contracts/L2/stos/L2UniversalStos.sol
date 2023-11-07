// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import "./L2UniversalStosStorage.sol";

interface IL2StakeV2 {
    function balanceOfLock(address account) external view returns (uint256);
    function balanceOfLockAt(address account, uint256 timestamp) external view returns (uint256);
    function totalSupplyStos() external view returns (uint256);
    function totalSupplyStosAt(uint256 timestamp) external view returns (uint256);
}

interface ILockIdNftForRegister {
    function balanceOfLock(address account) external view returns (uint256);
    function balanceOfLockAt(address account, uint32 timestamp) external view returns (uint256);
    function totalSupplyLocks() external view returns (uint256);
    function totalSupplyLocksAt(uint32 timestamp) external view returns (uint256);
}

contract L2UniversalStos is ProxyStorage, AccessibleCommon, L2UniversalStosStorage  {

    modifier nonZero(uint256 value) {
        require(value != 0, "Z1");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Z2");
        _;
    }

    event SetL2StakeV2(address _l2StakeV2);
    event SetLockIdNftForRegister(address _lockIdNftForRegister);

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    function setL2Stakev2(
        address _l2StakeV2
    ) external onlyOwner
    {
        require(l2StakeV2 != _l2StakeV2, "same");
        emit SetL2StakeV2(_l2StakeV2 );
    }

    function setLockIdNftForRegister(
        address _lockIdNftForRegister
    ) external onlyOwner
    {
        require(lockIdNftForRegister != _lockIdNftForRegister, "same");
        lockIdNftForRegister = _lockIdNftForRegister;
        emit SetLockIdNftForRegister(_lockIdNftForRegister);
    }

    function balanceOf(address account) external view returns (uint256 amount) {

        if (l2StakeV2 != address(0)) amount += IL2StakeV2(l2StakeV2).balanceOfLock(account);
        if (lockIdNftForRegister != address(0)) amount += ILockIdNftForRegister(lockIdNftForRegister).balanceOfLock(account);

    }

    function balanceOfAt(address account, uint256 timestamp) external view returns (uint256 amount) {
        if (l2StakeV2 != address(0)) amount += IL2StakeV2(l2StakeV2).balanceOfLockAt(account, timestamp);
        if (lockIdNftForRegister != address(0)) amount += ILockIdNftForRegister(lockIdNftForRegister).balanceOfLockAt(account, uint32(timestamp));

    }

    function totalSupply() external view returns (uint256 amount) {
        if (l2StakeV2 != address(0)) amount += IL2StakeV2(l2StakeV2).totalSupplyStos();
        if (lockIdNftForRegister != address(0)) amount += ILockIdNftForRegister(lockIdNftForRegister).totalSupplyLocks();

    }

    function totalSupplyAt(uint256 timestamp) external view returns (uint256 amount) {
        if (l2StakeV2 != address(0)) amount += IL2StakeV2(l2StakeV2).totalSupplyStosAt(timestamp);
        if (lockIdNftForRegister != address(0)) amount += ILockIdNftForRegister(lockIdNftForRegister).totalSupplyLocksAt(uint32(timestamp));

    }

}
