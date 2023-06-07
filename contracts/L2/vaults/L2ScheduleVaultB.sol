// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./L2CustomVaultBase.sol";
import "./L2ScheduleVaultBStorage.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";

/**
 * @title L2ScheduleVaultB
 * @dev Vaults that Vault Admins claim according to a schedule
 */
contract L2ScheduleVaultB is L2CustomVaultBase, L2ScheduleVaultBStorage {
    using SafeERC20 for IERC20;

    event InitializedL2ScheduleVaultB(
            address l2Token,
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


    /* ========== only VaultAdmin Of Token ========== */

    function initialize(
        address l2Token,
        uint256 totalAllocatedAmount,
        uint256 totalClaimCount,
        uint256 firstClaimAmount,
        uint32 firstClaimTime,
        uint32 secondClaimTime,
        uint32 roundInterval
    )
        external onlyInitializerOrVaultAdmin(l2Token)
    {
        require(vaultInfo[l2Token].firstClaimTime == 0, "already initialized");
        require(firstClaimTime > block.number, "first claim time passed");
        require(totalAllocatedAmount != 0 && totalClaimCount != 0 && roundInterval != 0, "wrong value");
        if (totalClaimCount > 1) require(secondClaimTime > firstClaimTime, "wrong the second claim time");
        require(totalAllocatedAmount > firstClaimAmount, "wrong the first claim amount");

        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), totalAllocatedAmount);

        LibScheduleVaultB.VaultInfo storage info = vaultInfo[l2Token];
        info.totalAllocatedAmount = totalAllocatedAmount;
        info.totalClaimCount = totalClaimCount;
        info.totalClaimedAmount = 0;
        info.firstClaimAmount = firstClaimAmount;
        info.firstClaimTime = firstClaimTime;
        info.secondClaimTime = secondClaimTime;
        info.roundInterval = roundInterval;
        info.latestClaimedRound = 0;

        emit InitializedL2ScheduleVaultB(l2Token, totalAllocatedAmount, totalClaimCount, firstClaimAmount, firstClaimTime, secondClaimTime, roundInterval);
    }

    /* ========== Anyone can vault admin of token ========== */

    function claim(address l2Token)
        external nonZeroAddress(l2Token) onlyVaultAdminOfToken(l2Token)
    {
        uint256 amount = availableClaimAmount(l2Token);
        require(amount <= IERC20(l2Token).balanceOf(address(this)), 'balance is insufficient');
        IERC20(l2Token).safeTransfer(msg.sender, amount);

        emit Claimed(l2Token, msg.sender, amount);
    }


    /* ========== VIEW ========== */


    function getCurrentRound(address l2Token) public view returns (uint256 round){
        LibScheduleVaultB.VaultInfo memory info = vaultInfo[l2Token];
        if(info.firstClaimTime != 0 && info.firstClaimTime <= block.timestamp && block.timestamp < info.secondClaimTime) {
            round = 1;
        } else if(info.secondClaimTime <= block.timestamp) {
            round = (block.timestamp - uint256(info.secondClaimTime)) / uint256(info.roundInterval) + 2;
        }
        if (round > info.totalClaimCount) round = info.totalClaimCount;
    }

    function availableClaimAmount(address l2Token) public view returns (uint256 amount){
        LibScheduleVaultB.VaultInfo memory info = vaultInfo[l2Token];
        uint256 curRound = getCurrentRound(l2Token);

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