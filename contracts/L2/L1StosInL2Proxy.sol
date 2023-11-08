// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/Proxy2.sol";
import "./L1StosInL2Storage.sol";

contract L1StosInL2Proxy is Proxy2, L1StosInL2Storage
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
