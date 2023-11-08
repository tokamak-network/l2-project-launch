// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/Proxy2.sol";
import "./L1StosToL2Storage.sol";

contract L1StosToL2Proxy is Proxy2, L1StosToL2Storage
{
    event ManagershipTransferred(address indexed previousManager, address indexed newManager);

    constructor(address manager_) {
        _manager = manager_;
    }

    function setMaxLockCountPerRegister(uint256 maxLockCountPerRegister_) external onlyManager {
        require(maxLockCountPerRegister != maxLockCountPerRegister_, "same");
        maxLockCountPerRegister = maxLockCountPerRegister_;
    }


    function setLockTos(address lockTosAddress) external onlyManager {
        require(lockTos != lockTosAddress, "same");
        lockTos = lockTosAddress;
    }

    function setL2Register(address l2Register_) external onlyManager {
        require(l2Register != l2Register_, "same");
        l2Register = l2Register_;
    }

    function setAddressManager(address addressManagerAddress) external onlyManager {
        require(addressManager != addressManagerAddress, "same");
        addressManager = addressManagerAddress;
    }

    function renounceManagership() external onlyManager {
        emit ManagershipTransferred(_manager, address(0));
        _manager = address(0);
    }

    function transferManagership(address newManager) external onlyManager {
        require(newManager != address(0), "new manager is the zero address");
        emit ManagershipTransferred(_manager, newManager);
        _manager = newManager;
    }

}
