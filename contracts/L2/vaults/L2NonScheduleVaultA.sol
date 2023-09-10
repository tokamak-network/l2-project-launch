// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./L2CustomVaultBase.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";

/**
 * @title L2NonScheduleVaultA
 * @dev Vault that claims when the Vault admin wants it
 */
contract L2NonScheduleVaultA is L2CustomVaultBase {
    using SafeERC20 for IERC20;

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    /* ========== only L2ProjectManager ========== */


    /* ========== Anyone can vault admin of token ========== */
    function claim(address l2Token, uint256 amount)
        external onlyVaultAdminOfToken(l2Token)  nonZeroAddress(l2Token)  nonZero(amount)
    {
        require(amount <= IERC20(l2Token).balanceOf(address(this)), "balance is insufficient.");

        IERC20(l2Token).safeTransfer(msg.sender, amount);
        emit Claimed(l2Token, msg.sender, amount);
    }

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}