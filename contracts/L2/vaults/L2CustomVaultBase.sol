// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import { L2CustomVaultBaseStorage } from "./L2CustomVaultBaseStorage.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";

import "hardhat/console.sol";

/**
 * @title L2CustomVaultBase
 * @dev
 */
contract L2CustomVaultBase is ProxyStorage, AccessibleCommon, L2CustomVaultBaseStorage {
     using SafeERC20 for IERC20;

    /* ========== DEPENDENCIES ========== */

    // event AllocatedTokenAndAdminInVault(address l2Token, address newAdmin, uint256 amount);

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    function setL2ProjectManager(address _l2ProjectManager)
        external nonZeroAddress(_l2ProjectManager) onlyOwner
    {
        require(l2ProjectManager != _l2ProjectManager, "same");
        l2ProjectManager = _l2ProjectManager;
    }

    function setInitializer(address _initializer)
        external nonZeroAddress(_initializer) onlyOwner
    {
        require(initializer != _initializer, "same");
        initializer = _initializer;

         emit SetInitializer(_initializer);
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

    // function allocateTokenAndAdmin(address l2Token, address _newAdmin, uint256 amount)
    //     external  onlyL2ProjectManager
    //     nonZeroAddress(l2Token)  nonZeroAddress(_newAdmin) nonZero(amount)
    // {
    //     require(vaultAdminOfToken[l2Token] != _newAdmin, "same admin");
    //     require(amount <= IERC20(l2Token).balanceOf(l2ProjectManager), "balance is insufficient.");

    //     vaultAdminOfToken[l2Token] = _newAdmin;
    //     IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), amount);
    //     emit AllocatedTokenAndAdminInVault(l2Token, _newAdmin, amount);
    // }

    /* ========== only VaultAdmin Of Token ========== */

    /* ========== Anyone can vault admin of token ========== */



    /* ========== VIEW ========== */

    function isVaultAdmin(address l2Token, address account) public view returns (bool) {
        return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    }

    /* === ======= internal ========== */

}