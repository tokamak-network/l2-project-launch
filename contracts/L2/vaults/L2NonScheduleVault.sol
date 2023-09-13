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
            address claimer,
            uint256 totalAllocatedAmount
        );

    event ClaimedInVault(address l2Token, string name, address to, uint256 amount);
    event ChangedClaimer(address l2Token, string name, address newClaimer);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    /* ========== only L2ProjectManager ========== */
    function initialize (
        address l2Token,
        string memory vaultName,
        address claimer,
        uint256 _totalAllocatedAmount
    )
        external
        onlyL2ProjectManagerOrVaultAdmin(l2Token)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));
        require(_totalAllocatedAmount != 0 && claimer != address(0), "zero value");

        LibNonScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        require(info.totalAllocatedAmount == 0, "already initialized");
        vaultInfo[l2Token][nameKey].totalAllocatedAmount = _totalAllocatedAmount;
        vaultInfo[l2Token][nameKey].claimer = claimer;
        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), _totalAllocatedAmount);

        emit InitializedL2NonScheduleVault(l2Token, vaultName, claimer, _totalAllocatedAmount);
    }

    function changeClaimer(
        address l2Token,
        string memory vaultName,
        address _newClaimer
    ) external onlyL2ProjectManagerOrVaultAdmin(l2Token) nonZeroAddress(l2Token) nonZeroAddress(_newClaimer)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));
        LibNonScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        require(info.totalAllocatedAmount != 0, "not initialized");

        require(info.claimer != _newClaimer, "same");
        vaultInfo[l2Token][nameKey].claimer = _newClaimer;
        emit ChangedClaimer(l2Token, vaultName, _newClaimer);
    }

    /* ========== Anyone can vault admin of token ========== */
    function claim(address l2Token, string memory vaultName, uint256 amount)
        external onlyVaultAdminOfToken(l2Token)  nonZeroAddress(l2Token)  nonZero(amount)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));

        LibNonScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];

        require(info.claimer != address(0), "no claimer");
        require(amount <= (info.totalAllocatedAmount - info.totalClaimedAmount)
            && amount <= IERC20(l2Token).balanceOf(address(this)), "insufficient balance");

        vaultInfo[l2Token][nameKey].totalClaimedAmount += amount;

        IERC20(l2Token).safeTransfer(info.claimer, amount);
        emit ClaimedInVault(l2Token, vaultName, info.claimer, amount);
    }

    /* ========== VIEW ========== */

    function viewVaultInfo(address l2Token, string memory vaultName) external view returns (LibNonScheduleVault.VaultInfo  memory){

        return vaultInfo[l2Token][keccak256(bytes(vaultName))];

    }
    /* === ======= internal ========== */

}