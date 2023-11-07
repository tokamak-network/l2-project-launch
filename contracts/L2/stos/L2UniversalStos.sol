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

    event SetAddresses(address _l2StakeV2, address _lockIdNftForRegister);

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    function setAddresses(
        address _l2StakeV2,
        address _lockIdNftForRegister
    ) external onlyOwner nonZeroAddress(_l2StakeV2) nonZeroAddress(_lockIdNftForRegister)
    {
        require(l2StakeV2 != _l2StakeV2 || lockIdNftForRegister != _lockIdNftForRegister, "same");
        l2StakeV2 = _l2StakeV2;
        lockIdNftForRegister = _lockIdNftForRegister;
        emit SetAddresses(_l2StakeV2, _lockIdNftForRegister);
    }


    function balanceOf(address account) external view returns (uint256 amount) {

        amount = IL2StakeV2(l2StakeV2).balanceOfLock(account)
            + ILockIdNftForRegister(lockIdNftForRegister).balanceOfLock(account);

    }

    function balanceOfAt(address account, uint256 timestamp) external view returns (uint256 amount) {
        amount = IL2StakeV2(l2StakeV2).balanceOfLockAt(account, timestamp)
            + ILockIdNftForRegister(lockIdNftForRegister).balanceOfLockAt(account, uint32(timestamp));

    }

    function totalSupply() external view returns (uint256 amount) {
        amount = IL2StakeV2(l2StakeV2).totalSupplyStos()
            + ILockIdNftForRegister(lockIdNftForRegister).totalSupplyLocks();

    }

    function totalSupplyAt(uint256 timestamp) external view returns (uint256 amount) {
        amount = IL2StakeV2(l2StakeV2).totalSupplyStosAt(timestamp)
            + ILockIdNftForRegister(lockIdNftForRegister).totalSupplyLocksAt(uint32(timestamp));

    }

}
