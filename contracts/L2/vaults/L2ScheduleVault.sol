// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./L2CustomVaultBase.sol";
import "./L2ScheduleVaultStorage.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";
import "../../libraries/LibProject.sol";

/**
 * @title L2ScheduleVault
 * @dev Vaults that Vault Admins claim according to a schedule
 */
contract L2ScheduleVault is L2CustomVaultBase, L2ScheduleVaultStorage {
    using SafeERC20 for IERC20;

    event InitializedL2ScheduleVault(
            address l2Token,
            string name,
            uint256 totalAllocatedAmount,
            uint256 totalClaimCount,
            uint256 firstClaimAmount,
            uint32 firstClaimTime,
            uint32 secondClaimTime,
            uint32 roundInterval
        );

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */


    /* ========== only L2ProjectManager ========== */

    function initialize(
        address l2Token,
        string memory vaultName,
        LibProject.InitalParameterScheduleVault memory params
    )
        external onlyInitializerOrVaultAdmin(l2Token)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));
        require(vaultInfo[l2Token][nameKey].firstClaimTime == 0, "already initialized");
        require(params.firstClaimTime > block.number, "first claim time passed");
        require(params.totalAllocatedAmount != 0 && params.totalClaimCount != 0 && params.roundIntervalTime != 0, "wrong value");
        if (params.totalClaimCount > 1) require(params.secondClaimTime > params.firstClaimTime, "wrong the second claim time");
        require(params.totalAllocatedAmount > params.firstClaimAmount, "wrong the first claim amount");

        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), params.totalAllocatedAmount);

        LibScheduleVault.VaultInfo storage info = vaultInfo[l2Token][nameKey];
        info.totalAllocatedAmount = params.totalAllocatedAmount;
        info.totalClaimCount = params.totalClaimCount;
        info.totalClaimedAmount = 0;
        info.firstClaimAmount = params.firstClaimAmount;
        info.firstClaimTime = params.firstClaimTime;
        info.secondClaimTime = params.secondClaimTime;
        info.roundInterval = params.roundIntervalTime;
        info.latestClaimedRound = 0;

        emit InitializedL2ScheduleVault(l2Token, vaultName, params.totalAllocatedAmount, params.totalClaimCount, params.firstClaimAmount, params.firstClaimTime, params.secondClaimTime, params.roundIntervalTime);
    }

    /* ========== Anyone can vault admin of token ========== */

    function claim(address l2Token, string calldata vaultName)
        external nonZeroAddress(l2Token) onlyVaultAdminOfToken(l2Token)
    {
        uint256 amount = availableClaimAmount(l2Token, vaultName);
        require(amount <= IERC20(l2Token).balanceOf(address(this)), 'balance is insufficient');
        IERC20(l2Token).safeTransfer(msg.sender, amount);

        // emit Claimed(l2Token, msg.sender, amount);
    }


    /* ========== VIEW ========== */


    function getCurrentRound(address l2Token, string calldata vaultName) public view returns (uint256 round){
        bytes32 nameKey = keccak256(bytes(vaultName));
        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        if(info.firstClaimTime != 0 && info.firstClaimTime <= block.timestamp && block.timestamp < info.secondClaimTime) {
            round = 1;
        } else if(info.secondClaimTime <= block.timestamp) {
            round = (block.timestamp - uint256(info.secondClaimTime)) / uint256(info.roundInterval) + 2;
        }
        if (round > info.totalClaimCount) round = info.totalClaimCount;
    }

    function availableClaimAmount(address l2Token, string calldata vaultName) public view returns (uint256 amount){
        bytes32 nameKey = keccak256(bytes(vaultName));
        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        uint256 curRound = getCurrentRound(l2Token, vaultName);

        if(info.latestClaimedRound < curRound) {
            if (curRound == 1) {
                amount = info.firstClaimAmount - info.totalClaimedAmount;
            } else if (curRound < info.totalClaimCount) {
                amount = (info.firstClaimAmount + ((info.totalAllocatedAmount - info.firstClaimAmount)/(info.totalClaimCount-1) * (curRound -1))) - info.totalClaimedAmount;
            } else {
                amount = info.totalAllocatedAmount - info.totalClaimedAmount;
            }
        }
    }

    /* === ======= internal ========== */

}