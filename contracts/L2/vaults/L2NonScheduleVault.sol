// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./L2CustomVaultBase.sol";
import "./L2NonScheduleVaultStorage.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";

/**
 * @title L2NonScheduleVault
 * @dev Vault that claims when the Vault admin wants it
 */
contract L2NonScheduleVault is L2CustomVaultBase, L2NonScheduleVaultStorage {
    using SafeERC20 for IERC20;

    event InitializedL2NonScheduleVault(
            address l2Token,
            string name,
            uint256 totalAllocatedAmount
        );

    event ClaimedInVault(address l2Token, string name, address to, uint256 amount);
    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    /* ========== only L2ProjectManager ========== */
    function initialize (
        address l2Token,
        string memory vaultName,
        uint256 _totalAllocatedAmount
    )
        external
        onlyL2ProjectManagerOrVaultAdmin(l2Token)
    {

        bytes32 nameKey = keccak256(bytes(vaultName));
        require(_totalAllocatedAmount != 0 , "zero totalAllocatedAmount");

        LibNonScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        require(info.totalAllocatedAmount == 0, "already initialized");
        vaultInfo[l2Token][nameKey].totalAllocatedAmount = _totalAllocatedAmount;

        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), _totalAllocatedAmount);

        emit InitializedL2NonScheduleVault(l2Token, vaultName, _totalAllocatedAmount);
    }

    /* ========== Anyone can vault admin of token ========== */
    function claim(address l2Token, string memory vaultName, uint256 amount)
        external onlyVaultAdminOfToken(l2Token)  nonZeroAddress(l2Token)  nonZero(amount)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));
        LibNonScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        require(amount <= (info.totalAllocatedAmount - info.totalClaimedAmount)
            && amount <= IERC20(l2Token).balanceOf(address(this)), "insufficient balance");
        vaultInfo[l2Token][nameKey].totalClaimedAmount += amount;
        IERC20(l2Token).safeTransfer(msg.sender, amount);
        emit ClaimedInVault(l2Token, vaultName, msg.sender, amount);
    }

    /* ========== VIEW ========== */

    function viewVaultInfo(address l2Token, string memory vaultName) external view returns (LibNonScheduleVault.VaultInfo  memory){

        return vaultInfo[l2Token][keccak256(bytes(vaultName))];

    }
    /* === ======= internal ========== */

}