// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./L2CustomVaultBase.sol";
import "./L2LpRewardVaultStorage.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";
import "../../libraries/LibProject.sol";
import "../../libraries/LibPool.sol";

interface IUniswapV3Factory {
 function getPool(address token0, address token1, uint24 _fee) external view returns(address);
}

/**
 * @title L2LpRewardVault
 * @dev Vaults that anybody claim according to a schedule
 */
contract L2LpRewardVault is L2CustomVaultBase, L2LpRewardVaultStorage {
    using SafeERC20 for IERC20;

    event InitializedL2LpRewardVault(
            address l2Token,
            LibPool.PoolInfo paramPoolInfo,
            LibProject.InitalParameterScheduleVault parmas
        );
    event ClaimedInVault(address l2Token, address pool, address to, uint256 amount);
    event ChangedRecipient(address _recipient);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */

    function setUniswapV3Factory(address _factory) external nonZeroAddress(_factory) onlyOwner {
        require(uniswapV3Factory != _factory, "same");
        uniswapV3Factory = _factory;
    }

    function changeRecipient(address _recipient) external onlyOwner {
        require(recipient != _recipient, "same");
        recipient = _recipient;
    }

    /* ========== only L2ProjectManager ========== */

    function initialize(
        address l2Token,
        LibPool.PoolInfo memory paramPoolInfo,
        LibProject.InitalParameterScheduleVault memory params
    )
        external onlyL2ProjectManagerOrVaultAdmin(l2Token)
    {
        require(params.firstClaimTime > block.number, "first claim time passed");
        require(params.totalAllocatedAmount != 0 && params.totalClaimCount != 0 && params.roundIntervalTime != 0, "wrong value");
        if (params.totalClaimCount > 1) require(params.secondClaimTime > params.firstClaimTime, "wrong the second claim time");
        require(params.totalAllocatedAmount > params.firstClaimAmount, "wrong the first claim amount");

        address pool = getPoolAddress(paramPoolInfo.token0, paramPoolInfo.token1, paramPoolInfo.fee);

        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][pool];
        require(info.totalAllocatedAmount == 0, "already initialized");

        LibPool.PoolInfo memory pInfo = paramPoolInfo;
        if(pInfo.token0 > pInfo.token1) {
            pInfo.token0 = paramPoolInfo.token1;
            pInfo.token1 = paramPoolInfo.token0;
        }
        poolInfo[pool] = pInfo;

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
        vaultInfo[l2Token][pool] = data;

        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), params.totalAllocatedAmount);

        emit InitializedL2LpRewardVault(l2Token, paramPoolInfo, params);
    }

    /* ========== Anyone can vault admin of token ========== */

    function claim(address l2Token, address pool)
        external nonZeroAddress(l2Token) nonZeroAddress(pool)
    {
        require(recipient != address(0), "zero recipient");

        uint256 amount = _availableClaimAmount(l2Token, pool);
        require(amount != 0, "no claimable amount");
        require(amount <= IERC20(l2Token).balanceOf(address(this)), 'insufficient balance');

        vaultInfo[l2Token][pool].totalClaimedAmount += amount;

        IERC20(l2Token).safeTransfer(recipient, amount);

        emit ClaimedInVault(l2Token, pool, recipient, amount);
    }


    /* ========== VIEW ========== */

    function viewVaultInfo(address l2Token, address pool) external view returns (LibScheduleVault.VaultInfo  memory){

        return vaultInfo[l2Token][pool];

    }

    function getCurrentRound(address l2Token, address pool) public view returns (uint256 round){

        return _getCurrentRound(l2Token, pool);
    }

    function availableClaimAmount(address l2Token, address pool) public view returns (uint256 amount){

        return _availableClaimAmount(l2Token, pool);
    }

    /* === ======= internal ========== */

    function _getCurrentRound(address l2Token, address pool) internal view returns (uint256 round){
        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][pool];
        if(info.firstClaimTime != 0 && info.firstClaimTime <= block.timestamp && block.timestamp < info.secondClaimTime) {
            round = 1;
        } else if(info.secondClaimTime <= block.timestamp) {
            round = (block.timestamp - uint256(info.secondClaimTime)) / uint256(info.roundInterval) + 2;
        }
        if (round > info.totalClaimCount) round = info.totalClaimCount;
    }

    function _availableClaimAmount(address l2Token, address pool) internal view returns (uint256 amount){

        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][pool];
        uint256 curRound = _getCurrentRound(l2Token, pool);

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

    function getPoolAddress(address token0, address token1, uint24 _fee) public view returns(address) {
        return IUniswapV3Factory(uniswapV3Factory).getPool(token0, token1, _fee);
    }

}