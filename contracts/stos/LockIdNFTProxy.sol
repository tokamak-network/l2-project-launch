// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/Proxy2.sol";
import "./LockIdNFTStorage.sol";
import "./LockIdStorage.sol";

contract LockIdNFTProxy is Proxy2, LockIdNFTStorage, LockIdStorage
{
    event ManagershipTransferred(address indexed previousManager, address indexed newManager);

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor (
        string memory name_, string memory symbol_, address managerAddress
        ) {

        _manager = managerAddress;
        _name = name_;
        _symbol = symbol_;

        // register the supported interfaces to conform to ERC721 via ERC165
        // _registerInterface(_INTERFACE_ID_ERC721);
        // _registerInterface(_INTERFACE_ID_ERC721_METADATA);
        // _registerInterface(_INTERFACE_ID_ERC721_ENUMERABLE);
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
