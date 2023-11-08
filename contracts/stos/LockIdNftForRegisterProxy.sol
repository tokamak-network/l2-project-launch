// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/Proxy2.sol";
import "./LockIdRegisterStorage1.sol";
import "./LockIdRegisterStorage2.sol";

contract LockIdNftForRegisterProxy is Proxy2, LockIdRegisterStorage1, LockIdRegisterStorage2
{
    event ManagershipTransferred(address indexed previousManager, address indexed newManager);

    constructor() {
        _manager = msg.sender;
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
