// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


import "../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../common/AccessibleCommon.sol";
import "./L2ProjectManagerStorage.sol";

import {IERC20} from "../interfaces/IERC20.sol";
import "../libraries/LibProject.sol";
import "../libraries/SafeERC20.sol";

import "hardhat/console.sol";

interface IL2CrossDomainMessenger {
    function xDomainMessageSender() external view returns (address);
}

interface IL2CustomVaultBase {
    function setVaultAdmin(
        address l2Token,
        address _newAdmin
    ) external;
}

interface IL2PublicSaleVault {
    function vaultInitialize(
        address l2Token,
        LibProject.InitalParameterPublicSaleVault memory vaultParams,
        LibProject.InitalParameterPublicSaleClaim memory claimParams
    ) external;
}

interface IL2InitialLiquidityVault {
    function initialize(
        address l2Token,
        LibProject.InitalParameterInitialLiquidityVault memory params
    ) external;
}

interface IL2LiquidityRewardVault {
    function initialize(
        address l2Token,
        LibProject.InitalParameterLiquidityRewardVault memory params
    ) external;
}

interface IL2ScheduleVaultB {
    function initialize(
        address l2Token,
        LibProject.InitalParameterScheduleVault memory params
    ) external;
}

interface IL2NonScheduleVaultA {
    function allocateTokenAndAdmin(
        address l2Token,
        address _newAdmin,
        uint256 amount
    ) external;
}
/**
 * @title L2ProjectManager
 * @dev
 */
contract L2ProjectManager is ProxyStorage, AccessibleCommon, L2ProjectManagerStorage {
    using SafeERC20 for IERC20;

    modifier onlyL2TokenFactory() {
        require(l2TokenFactory != address(0) && msg.sender == l2TokenFactory, "caller is not l2TokenFactory");
        _;
    }

    modifier onlyMessengerAndL1ProjectManager() {
        require(msg.sender == l2CrossDomainMessenger &&
        IL2CrossDomainMessenger(l2CrossDomainMessenger).xDomainMessageSender() == l1ProjectManager,
        "not onlyMessengerAndL1ProjectManager");
        _;
    }

    modifier nonZero(uint256 value) {
        require(value != 0, "Z1");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Z2");
        _;
    }

    modifier ifFree {
        require(free, "lock");
        free = false;
        _;
        free = true;
    }

    event CreatedL2Project(address indexed l1Token, address indexed l2Token, address projectOwner, string projectName);
    event DistributedL2Token(
        address l1Token,
        address l2Token,
        uint256 projectId,
        uint256 totalAmount,
        uint256 publicSaleTotalAllocatedAmount,
        uint256 initialVaultTotalAllocatedAmount,
        uint256 rewardTotalAllocatedAmount,
        uint256 tosAirdropTotalAllocatedAmount,
        uint256 tonAirdropTotalAllocatedAmount
        );

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */
    constructor() {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /* ========== onlyOwner ========== */

    /// @dev l1ProjectManager 주소 설정
    function setL1ProjectManager(address _l1ProjectManager)
        external nonZeroAddress(_l1ProjectManager) onlyOwner
    {
        require(l1ProjectManager != _l1ProjectManager, "same");
        l1ProjectManager = _l1ProjectManager;
    }

    /// @dev l2TokenFactory 주소 설정
    function setL2TokenFactory(address _l2TokenFactory)
        external nonZeroAddress(_l2TokenFactory) onlyOwner
    {
        require(l2TokenFactory != _l2TokenFactory, "same");
        l2TokenFactory = _l2TokenFactory;
    }

    /// @dev l2CrossDomainMessenger 주소 설정
    function setL2CrossDomainMessenger(address _l2CrossDomainMessenger)
        external nonZeroAddress(_l2CrossDomainMessenger) onlyOwner
    {
        require(l2CrossDomainMessenger != _l2CrossDomainMessenger, "same");
        l2CrossDomainMessenger = _l2CrossDomainMessenger;
    }

    function setTokamakVaults(
        address publicSale,
        address initialLiquidity,
        address liquidityReward,
        address tonAirdrop,
        address tosAirdrop,
        address _scheduleVault,
        address _nonScheduleVault
        )
        external onlyOwner
        // nonZeroAddress(publicSale)
        nonZeroAddress(initialLiquidity)
        // nonZeroAddress(liquidityReward)
        // nonZeroAddress(tosAirdrop)
        // nonZeroAddress(tonAirdrop)
        nonZeroAddress(_scheduleVault)
        nonZeroAddress(_nonScheduleVault)
    {
        require(scheduleVault == address(0), "already set");
        // require(
        //     publicSaleVault != publicSale ||
        //     initialLiquidityVault != initialLiquidity ||
        //     liquidityRewardVault != liquidityReward ||
        //     tonAirdropVault != tonAirdrop ||
        //     tosAirdropVault != tosAirdrop
        //     , "same");

        publicSaleVault = publicSale;
        initialLiquidityVault = initialLiquidity;
        liquidityReward = liquidityReward;
        tonAirdropVault = tonAirdrop;
        tosAirdropVault = tosAirdrop;
        scheduleVault = _scheduleVault;
        nonScheduleVault = _nonScheduleVault;
    }

    /* ========== only L2TokenFactory ========== */

    /// @dev 프로젝트 추가
    function createL2Project(
        address projectOwner,
        address l1Token,
        address l2Token,
        string calldata projectName
    )
        external onlyL2TokenFactory
    {
        require(bytes(projectName).length != 0, "projectName is null");
        require(projects[l2Token].l1Token == address(0), "already added");
        projects[l2Token] = LibProject.L2ProjectInfo({
            projectId: 0,
            projectOwner: projectOwner,
            l1Token : l1Token,
            l2Token : l2Token,
            projectName : projectName
        });
        tokenMaps[l1Token] = l2Token;
        emit CreatedL2Project(l1Token, l2Token, projectOwner, projectName);
    }

    /* ========== only L2CrossDomainMessengerAndL1ProjectManager ========== */

    function _approveVaults(address l2Token, address vault, uint256 amount) internal {
        if (
            vault != address(0) &&
            amount != 0 &&
            amount < IERC20(l2Token).allowance(address(this), vault)) IERC20(l2Token).approve(vault, amount);
    }

    function distributesL2Token(
        address l1Token,
        address l2Token,
        uint256 projectId,
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    )
        external onlyMessengerAndL1ProjectManager
        nonZeroAddress(l1Token)
        nonZeroAddress(l2Token)
        nonZero(projectId) nonZero(totalAmount)
    {
        LibProject.L2ProjectInfo memory info = projects[l2Token];
        require(info.l1Token == l1Token, "not matched l1Token");
        require(info.l2Token == l2Token, "not matched l2Token");

        uint256 publicTotal = tokamakVaults.publicSaleParams.vaultParams.total1roundSaleAmount
            + tokamakVaults.publicSaleParams.vaultParams.total2roundSaleAmount;

        uint256 total = publicTotal +
            tokamakVaults.initialVaultParams.totalAllocatedAmount +
            tokamakVaults.rewardParams.params.totalAllocatedAmount +
            tokamakVaults.tosAirdropParams.totalAllocatedAmount +
            tokamakVaults.tonAirdropParams.totalAllocatedAmount ;

        require(total == totalAmount, "not matched totalAmount");

        projects[l2Token].projectId = projectId;
        _approveVaults(l2Token, publicSaleVault, publicTotal);
        _approveVaults(l2Token, initialLiquidityVault, tokamakVaults.initialVaultParams.totalAllocatedAmount);
        _approveVaults(l2Token, liquidityRewardVault, tokamakVaults.rewardParams.params.totalAllocatedAmount);
        _approveVaults(l2Token, tonAirdropVault, tokamakVaults.tonAirdropParams.totalAllocatedAmount);
        _approveVaults(l2Token, tosAirdropVault, tokamakVaults.initialVaultParams.totalAllocatedAmount);

        IL2CustomVaultBase(publicSaleVault).setVaultAdmin(l2Token, info.projectOwner);
        IL2PublicSaleVault(publicSaleVault).vaultInitialize(
            l2Token,
            tokamakVaults.publicSaleParams.vaultParams,
            tokamakVaults.publicSaleParams.claimParams
        );

        // initial liquidity
        IL2CustomVaultBase(initialLiquidityVault).setVaultAdmin(l2Token, info.projectOwner);
        IL2InitialLiquidityVault(initialLiquidityVault).initialize(
            l2Token,
            tokamakVaults.initialVaultParams );

        // // liquidity reward
        // IL2CustomVaultBase(initialLiquidityVault).setVaultAdmin(l2Token, projects[l2Token].projectOwner);
        // IL2LiquidityRewardVault(liquidityRewardVault).initialize(
        //     l2Token,
        //     tokamakVaults.rewardParams);

        // ton airdrop

        // tos airdrop

        // custom schedule

        // custom nonschedule
        // IL2NonScheduleVaultA().allocateTokenAndAdmin(
        //     address l2Token,
        //     address _newAdmin,
        //     uint256 amount
        // )
        uint256 initialTotal = tokamakVaults.initialVaultParams.totalAllocatedAmount;
        uint256 rewardTotal = tokamakVaults.initialVaultParams.totalAllocatedAmount;
        uint256 tosAirdropTotal = tokamakVaults.initialVaultParams.totalAllocatedAmount;
        uint256 tonAirdropTotal = tokamakVaults.initialVaultParams.totalAllocatedAmount;

        emit DistributedL2Token(info.l1Token, info.l2Token, info.projectId, total,
            publicTotal,
            initialTotal,
            rewardTotal,
            tosAirdropTotal,
            tonAirdropTotal);

    }

    /* ========== Anyone can execute ========== */

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}