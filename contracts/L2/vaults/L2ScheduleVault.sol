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
            LibProject.InitalParameterScheduleVault parmas
        );
    event ClaimedInVault(address l2Token, string name, address to, uint256 amount);
    event ChangedClaimer(address l2Token, string name, address newClaimer);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */


    /* ========== only L2ProjectManager ========== */

    function initialize(
        address l2Token,
        string memory vaultName,
        LibProject.InitalParameterScheduleVault memory params
    )
        external onlyL2ProjectManagerOrVaultAdmin(l2Token)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));
        require(params.firstClaimTime > uint32(block.timestamp), "first claim time passed");
        require(params.totalAllocatedAmount != 0 && params.totalClaimCount != 0 && params.roundIntervalTime != 0, "wrong value");
        if (params.totalClaimCount > 1) require(params.secondClaimTime > params.firstClaimTime, "wrong the second claim time");
        require(params.totalAllocatedAmount > params.firstClaimAmount, "wrong the first claim amount");

        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
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
        vaultInfo[l2Token][nameKey] = data;

        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), params.totalAllocatedAmount);

        emit InitializedL2ScheduleVault(l2Token, vaultName, params);

    }

    function changeClaimer(
        address l2Token,
        string memory vaultName,
        address _newClaimer
    ) external onlyL2ProjectManagerOrVaultAdmin(l2Token) nonZeroAddress(l2Token) nonZeroAddress(_newClaimer)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));
        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        require(info.totalAllocatedAmount != 0, "not initialized");

        require(info.claimer != _newClaimer, "same");
        vaultInfo[l2Token][nameKey].claimer = _newClaimer;

        emit ChangedClaimer(l2Token, vaultName, _newClaimer);
    }

    /* ========== Anyone can vault admin of token ========== */

    function claim(address l2Token, string calldata vaultName)
        external nonZeroAddress(l2Token)
    {
        bytes32 nameKey = keccak256(bytes(vaultName));
        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        require(info.claimer != address(0), "no claimer");

        uint256 amount = _availableClaimAmount(l2Token, nameKey);
        require(amount != 0, "no claimable amount");
        require(amount <= IERC20(l2Token).balanceOf(address(this)), 'insufficient balance');

        vaultInfo[l2Token][nameKey].totalClaimedAmount += amount;

        IERC20(l2Token).safeTransfer(info.claimer, amount);

        emit ClaimedInVault(l2Token, vaultName, info.claimer, amount);
    }


    /* ========== VIEW ========== */

    function viewVaultInfo(address l2Token, string memory vaultName) external view returns (LibScheduleVault.VaultInfo  memory){

        return vaultInfo[l2Token][keccak256(bytes(vaultName))];

    }

    function getCurrentRound(address l2Token, string calldata vaultName) public view returns (uint256 round){

        return _getCurrentRound(l2Token, keccak256(bytes(vaultName)));
    }

    function availableClaimAmount(address l2Token, string calldata vaultName) public view returns (uint256 amount){

        return _availableClaimAmount(l2Token, keccak256(bytes(vaultName)));
    }

    /* === ======= internal ========== */

    function _getCurrentRound(address l2Token, bytes32 nameKey) internal view returns (uint256 round){
        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        if(info.firstClaimTime != 0 && info.firstClaimTime <= block.timestamp && block.timestamp < info.secondClaimTime) {
            round = 1;
        } else if(info.secondClaimTime <= block.timestamp) {
            round = (block.timestamp - uint256(info.secondClaimTime)) / uint256(info.roundInterval) + 2;
        }
        if (round > info.totalClaimCount) round = info.totalClaimCount;
    }

    function _availableClaimAmount(address l2Token, bytes32 nameKey) internal view returns (uint256 amount){

        LibScheduleVault.VaultInfo memory info = vaultInfo[l2Token][nameKey];
        uint256 curRound = _getCurrentRound(l2Token, nameKey);

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