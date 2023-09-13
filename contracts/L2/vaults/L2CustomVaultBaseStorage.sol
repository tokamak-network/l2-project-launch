// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
/**
 * @title L2CustomVaultBaseStorage
 * @dev
 */
contract L2CustomVaultBaseStorage {

    bool internal free = true;
    address public l2ProjectManager;

    // l2token - tokenOwner
    mapping(address => address) public vaultAdminOfToken;

    event SetVaultAdmin(address l2Token, address newAdmin);

    modifier onlyL2ProjectManager() {
        require(l2ProjectManager != address(0) && msg.sender == l2ProjectManager, "caller is not l2ProjectManager");
        _;
    }

    modifier onlyVaultAdminOfToken(address l2token) {
        require(vaultAdminOfToken[l2token] != address(0) && msg.sender == vaultAdminOfToken[l2token], "caller is not a vaultAdmin Of l2Token");
        _;
    }

    modifier onlyL2ProjectManagerOrVaultAdmin(address l2token) {
        require(msg.sender == l2ProjectManager ||
            (vaultAdminOfToken[l2token] != address(0) && msg.sender == vaultAdminOfToken[l2token]),
            "caller is not a vaultAdmin or ProjectManager");
        _;
    }

    modifier nonZero(uint256 value) {
        require(value != 0, "Z1");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Z2");
        _;
    }

    modifier ifFree {
        require(free, "lock");
        free = false;
        _;
        free = true;
    }


}