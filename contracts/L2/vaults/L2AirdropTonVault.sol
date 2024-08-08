// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./L2CustomVaultBase.sol";
import "./L2AirdropTonVaultStorage.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";
import "../../libraries/LibProject.sol";

interface IDividendPool {
    function distribute(address token, uint256 amount) external;
}

/**
 * @title L2AirdropTonVault
 * @dev Vaults that anybody claim according to a schedule
 */
contract L2AirdropTonVault is L2CustomVaultBase, L2AirdropTonVaultStorage {
    using SafeERC20 for IERC20;

    event InitializedL2AirdropTonVault(
            address l2Token,
            LibProject.InitalParameterScheduleVault parmas
        );
    event ClaimedInVault(address l2Token, uint256 amount);
    event SetDividendPool(address newDividendPool);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    function setDividendPool(
        address _newDividendPool
    ) external onlyOwner nonZeroAddress(_newDividendPool)
    {
        require(dividendPool != _newDividendPool, "same");
        dividendPool = _newDividendPool;

        emit SetDividendPool(_newDividendPool);
    }

    /* ========== only L2ProjectManager ========== */

    function initialize(
        address l2Token,
        LibProject.InitalParameterScheduleVault memory params
    )
        external onlyL2ProjectManagerOrVaultAdmin(l2Token)
    {
        require(params.firstClaimTime > uint32(block.timestamp), "first claim time passed");
        require(params.totalAllocatedAmount != 0 && params.totalClaimCount != 0 && params.roundIntervalTime != 0, "wrong value");
        if (params.totalClaimCount > 1) require(params.secondClaimTime > params.firstClaimTime, "wrong the second claim time");
        require(params.totalAllocatedAmount > params.firstClaimAmount, "wrong the first claim amount");

        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token];
        require(info.totalAllocatedAmount == 0, "already initialized");

        LibScheduleVault.VaultInfo memory data = LibScheduleVault.VaultInfo({
            claimer: params.claimer,
            totalAllocatedAmount: params.totalAllocatedAmount,
            totalClaimCount: params.totalClaimCount,
            totalClaimedAmount: 0,
            firstClaimAmount: params.firstClaimAmount,
            firstClaimTime: params.firstClaimTime,
            secondClaimTime: params.secondClaimTime,
            roundInterval: params.roundIntervalTime,
            latestClaimedRound: 0
        });
        vaultInfo[l2Token] = data;

        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), params.totalAllocatedAmount);

        emit InitializedL2AirdropTonVault(l2Token, params);
    }

    /* ========== Anyone can vault admin of token ========== */

    function claim(address l2Token)
        external nonZeroAddress(l2Token)
    {
        uint256 amount = _availableClaimAmount(l2Token);
        require(amount != 0, "no claimable amount");
        require(amount <= IERC20(l2Token).balanceOf(address(this)), 'insufficient balance');
        vaultInfo[l2Token].totalClaimedAmount += amount;

        uint256 allowance = IERC20(l2Token).allowance(address(this), dividendPool);
        if (allowance < amount) IERC20(l2Token).approve(dividendPool, type(uint256).max);

        IDividendPool(dividendPool).distribute(l2Token, amount);

        emit ClaimedInVault(l2Token, amount);
    }


    /* ========== VIEW ========== */

    function viewVaultInfo(address l2Token) external view returns (LibScheduleVault.VaultInfo  memory){

        return vaultInfo[l2Token];

    }

    function getCurrentRound(address l2Token) public view returns (uint256 round){

        return _getCurrentRound(l2Token);
    }

    function availableClaimAmount(address l2Token) public view returns (uint256 amount){

        return _availableClaimAmount(l2Token);
    }

    /* === ======= internal ========== */

    function _getCurrentRound(address l2Token) internal view returns (uint256 round){
        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token];
        if(info.firstClaimTime != 0 && info.firstClaimTime <= block.timestamp && block.timestamp < info.secondClaimTime) {
            round = 1;
        } else if(info.secondClaimTime <= block.timestamp) {
            round = (block.timestamp - uint256(info.secondClaimTime)) / uint256(info.roundInterval) + 2;
        }
        if (round > info.totalClaimCount) round = info.totalClaimCount;
    }

    function _availableClaimAmount(address l2Token) internal view returns (uint256 amount){

        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token];
        uint256 curRound = _getCurrentRound(l2Token);

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
}