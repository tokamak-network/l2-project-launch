// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../common/AccessibleCommon.sol";
import { L1BurnVaultStorage } from "./L1BurnVaultStorage.sol";

import {IERC20} from "../interfaces/IERC20.sol";

import "hardhat/console.sol";

interface IIERC20Burnable {
    function burn(uint256 amount) external ;
}

/**
 * @title L1BurnVault
 * @dev
 */
contract L1BurnVault is ProxyStorage, AccessibleCommon, L1BurnVaultStorage {

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    function setL2ProjectManager(address _l2ProjectManager)
        external nonZeroAddress(_l2ProjectManager) onlyOwner
    {
        require(l2ProjectManager != _l2ProjectManager, "same");
        l2ProjectManager = _l2ProjectManager;
    }

    /* ========== only L2ProjectManager ========== */

    function setVaultAdmin(
        address l2Token,
        address _newAdmin
    )
        external nonZeroAddress(l2Token) nonZeroAddress(_newAdmin) onlyL2ProjectManager
    {
        require(vaultAdminOfToken[l2Token] != _newAdmin, "same");
        vaultAdminOfToken[l2Token] = _newAdmin;
        emit SetVaultAdmin(l2Token, _newAdmin);
    }

    /* ========== only VaultAdmin Of Token ========== */

    /* ========== Anyone can vault admin of token ========== */

    function tokenBurn(
        address l2Token
    )
        external
        nonZeroAddress(l2Token)
    {
        uint256 burnAmount = IERC20(l2Token).balanceOf(address(this));
        console.log("burnAmount :", burnAmount);
        IIERC20Burnable(l2Token).burn(burnAmount);
    }


    /* ========== VIEW ========== */

    function isVaultAdmin(address l2Token, address account) public view returns (bool) {
        return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    }

    /* === ======= internal ========== */

}