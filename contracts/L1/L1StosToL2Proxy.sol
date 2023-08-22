// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/Proxy2.sol";
import "./L1StosToL2Storage.sol";

contract L1StosToL2Proxy is Proxy2, L1StosToL2Storage
{
    event ManagershipTransferred(address indexed previousManager, address indexed newManager);

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor (
        address managerAddress, address lockTosAddress, address addressManagerAddress,
        uint256 maxLockCountPerSync_
    ) {
        _manager = managerAddress;
        lockTos = lockTosAddress;
        addressManager = addressManagerAddress;
        maxLockCountPerSync = maxLockCountPerSync_;
    }

    function setMaxLockCountPerSync(uint256 maxLockCountPerSync_) external onlyManager {
        require(maxLockCountPerSync != maxLockCountPerSync_, "same");
        maxLockCountPerSync = maxLockCountPerSync_;
    }

    function setLockTos(address lockTosAddress) external onlyManager {
        require(lockTos != lockTosAddress, "same");
        lockTos = lockTosAddress;
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
