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

    function isVaultAdmin(address l2Token, address account) external view returns (bool);
    function l2ProjectManager() external view returns (address);
}

interface IL2PublicSaleVault {
    function vaultInitialize(
        address l2Token,
        LibProject.InitalParameterPublicSaleVault memory vaultParams,
        LibProject.InitalParameterPublicSaleClaim memory claimParams,
        LibProject.InitalParameterVestingFundVault memory vestingParams
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
        LibPool.PoolInfo memory poolParams,
        LibProject.InitalParameterScheduleVault memory params
    ) external;
    function claim(address l2Token, address pool) external  ;
    function getPoolAddress(address token0, address token1, uint24 _fee) external view returns(address) ;
    function availableClaimAmount(address l2Token, address pool) external view returns (uint256 amount);

}

interface IL2ScheduleVault {
    function initialize(
        address l2Token,
        string memory vaultName,
        LibProject.InitalParameterScheduleVault memory params
    ) external;

    function claim(address l2Token, string calldata vaultName) external ;
    function availableClaimAmount(address l2Token, string calldata vaultName) external view returns (uint256 amount);

}

interface IL2NonScheduleVault {
    function initialize(
        address l2Token,
        string memory vaultName,
        address claimer,
        uint256 totalAllocatedAmount
    ) external;
}

interface IL2AirdropVault {
    function initialize(
        address l2Token,
        LibProject.InitalParameterScheduleVault memory params
    ) external;

    function availableClaimAmount(address l2Token) external view returns (uint256 amount);
     function claim(address l2Token) external ;
}


interface IVault {
    function setVaultAdmin(
        address l2Token,
        address _newAdmin
    )
        external;
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
        uint256 totalAmount
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

    function setL2Addresses(
        address _l2TokenFactory,
        address _l2CrossDomainMessenger,
        address _l2Wton,
        address _l2tos,
        uint24 _poolFee
        )
        external
        nonZeroAddress(_l2TokenFactory)
        nonZeroAddress(_l2CrossDomainMessenger)
        nonZeroAddress(_l2Wton)
        nonZeroAddress(_l2tos)
        onlyOwner
    {
        l2TokenFactory = _l2TokenFactory;
        l2CrossDomainMessenger = _l2CrossDomainMessenger;
        wton = _l2Wton;
        tos = _l2tos;
        poolFee = _poolFee;
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
        nonZeroAddress(publicSale)
        nonZeroAddress(initialLiquidity)
        nonZeroAddress(liquidityReward)
        nonZeroAddress(tosAirdrop)
        nonZeroAddress(tonAirdrop)
        nonZeroAddress(_scheduleVault)
        nonZeroAddress(_nonScheduleVault)
    {
        // require(scheduleVault == address(0), "already set");
        // require(
        //     publicSaleVault != publicSale ||
        //     initialLiquidityVault != initialLiquidity ||
        //     liquidityRewardVault != liquidityReward ||
        //     tonAirdropVault != tonAirdrop ||
        //     tosAirdropVault != tosAirdrop
        //     , "same");

        publicSaleVault = publicSale;
        initialLiquidityVault = initialLiquidity;
        liquidityRewardVault = liquidityReward;
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

        // uint256 allowance = IERC20(l2Token).allowance(address(this), vault);

        if (vault != address(0) && amount != 0 &&   IERC20(l2Token).allowance(address(this), vault) < amount) {

            IERC20(l2Token).approve(vault, amount);
        }
    }

    function distributesL2TokenOwner(
        address l1Token,
        address l2Token,
        uint256 projectId,
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    )
        external
        nonZeroAddress(l1Token)
        nonZeroAddress(l2Token)
        nonZero(projectId) nonZero(totalAmount)
    {
        require(projects[l2Token].projectOwner == msg.sender, "not projectOwner");

        _distributesL2Token(
            l1Token, l2Token, projectId, totalAmount,
            tokamakVaults, customScheduleVaults, customNonScheduleVaults
        );
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
        _distributesL2Token(
            l1Token, l2Token, projectId, totalAmount,
            tokamakVaults, customScheduleVaults, customNonScheduleVaults
        );
    }

    function claimAll(
        address l2Token,
        string[] memory scheduleVaultNames
    )
        external nonZeroAddress(l2Token)
    {
        address poolTosL2Token = IL2LiquidityRewardVault(liquidityRewardVault).getPoolAddress(tos, l2Token, poolFee);
        address poolWtonTos = IL2LiquidityRewardVault(liquidityRewardVault).getPoolAddress(wton, tos, poolFee);

        // tos-l2token rewardProjectTosPoolParams
        if (poolTosL2Token != address(0) && IL2LiquidityRewardVault(liquidityRewardVault).availableClaimAmount(l2Token, poolTosL2Token) != 0 ){
            IL2LiquidityRewardVault(liquidityRewardVault).claim(l2Token, poolTosL2Token);
        }

        // wton-tos  rewardTonTosPoolParams
        if (poolWtonTos != address(0) && IL2LiquidityRewardVault(liquidityRewardVault).availableClaimAmount(l2Token, poolWtonTos)  != 0 ){
            IL2LiquidityRewardVault(liquidityRewardVault).claim(l2Token, poolWtonTos);
        }

        // tosAirdropParams
        if (IL2AirdropVault(tosAirdropVault).availableClaimAmount(l2Token) != 0 ){
            IL2AirdropVault(tosAirdropVault).claim(l2Token);
        }

        // tonAirdropParams
        if (IL2AirdropVault(tonAirdropVault).availableClaimAmount(l2Token) != 0 ){
            IL2AirdropVault(tonAirdropVault).claim(l2Token);
        }

        // scheduleVaultNames
        if(scheduleVaultNames.length != 0) {
            for(uint256 i ; i < scheduleVaultNames.length ; i++) {
                if (IL2ScheduleVault(scheduleVault).availableClaimAmount(l2Token, scheduleVaultNames[i]) != 0 )
                    IL2ScheduleVault(scheduleVault).claim(l2Token, scheduleVaultNames[i]);
            }
        }
    }

    function _distributesL2Token(
        address l1Token,
        address l2Token,
        uint256 projectId,
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    ) internal {
        LibProject.L2ProjectInfo memory info = projects[l2Token];

        require(info.l1Token == l1Token, "not matched l1Token");
        require(info.l2Token == l2Token, "not matched l2Token");

        uint256 publicTotal = tokamakVaults.publicSaleParams.vaultParams.total1roundSaleAmount
            + tokamakVaults.publicSaleParams.vaultParams.total2roundSaleAmount;

        uint256 total = publicTotal +
            tokamakVaults.initialVaultParams.totalAllocatedAmount +
            tokamakVaults.rewardTonTosPoolParams.params.totalAllocatedAmount +
            tokamakVaults.rewardProjectTosPoolParams.params.totalAllocatedAmount +
            tokamakVaults.tosAirdropParams.totalAllocatedAmount +
            tokamakVaults.tonAirdropParams.totalAllocatedAmount ;

        uint256 totalCustomSchedule = 0;
        uint256 totalNonCustomSchedule = 0;

        for (uint256 i = 0; i < customScheduleVaults.length; i++)
            totalCustomSchedule += customScheduleVaults[i].params.totalAllocatedAmount;

        for (uint256 j = 0; j < customNonScheduleVaults.length; j++)
            totalNonCustomSchedule += customNonScheduleVaults[j].totalAllocatedAmount;

        total += (totalCustomSchedule + totalNonCustomSchedule);

        require(total == totalAmount, "not matched totalAmount");
        require(totalAmount <= IERC20(l2Token).balanceOf(address(this)), "insufficient balance");

        projects[info.l2Token].projectId = projectId;
        _approveVaults(info.l2Token, publicSaleVault, publicTotal);
        _approveVaults(info.l2Token, initialLiquidityVault, tokamakVaults.initialVaultParams.totalAllocatedAmount);
        _approveVaults(info.l2Token, liquidityRewardVault,
            tokamakVaults.rewardTonTosPoolParams.params.totalAllocatedAmount + tokamakVaults.rewardProjectTosPoolParams.params.totalAllocatedAmount );
        _approveVaults(info.l2Token, tonAirdropVault, tokamakVaults.tonAirdropParams.totalAllocatedAmount);
        _approveVaults(info.l2Token, tosAirdropVault, tokamakVaults.tosAirdropParams.totalAllocatedAmount);

        if (publicTotal != 0) {

            if(!IL2CustomVaultBase(publicSaleVault).isVaultAdmin(info.l2Token, info.projectOwner)) {
                IL2CustomVaultBase(publicSaleVault).setVaultAdmin(info.l2Token, info.projectOwner);
            }
            IL2PublicSaleVault(publicSaleVault).vaultInitialize(
                info.l2Token,
                tokamakVaults.publicSaleParams.vaultParams,
                tokamakVaults.publicSaleParams.claimParams,
                tokamakVaults.publicSaleParams.vestingParams
            );
        }
        if (tokamakVaults.initialVaultParams.totalAllocatedAmount != 0) {

            if(!IL2CustomVaultBase(initialLiquidityVault).isVaultAdmin(info.l2Token, info.projectOwner)) IL2CustomVaultBase(initialLiquidityVault).setVaultAdmin(info.l2Token, info.projectOwner);

            IL2InitialLiquidityVault(initialLiquidityVault).initialize(
                info.l2Token,
                tokamakVaults.initialVaultParams);
        }

        if (tokamakVaults.rewardTonTosPoolParams.params.totalAllocatedAmount != 0) {
            if(!IL2CustomVaultBase(liquidityRewardVault).isVaultAdmin(info.l2Token, info.projectOwner))
                IL2CustomVaultBase(liquidityRewardVault).setVaultAdmin(info.l2Token, info.projectOwner);

            LibProject.InitalParameterLiquidityRewardVault memory rewardParams = tokamakVaults.rewardTonTosPoolParams;

            IL2LiquidityRewardVault(liquidityRewardVault).initialize(
                l2Token,
                rewardParams.poolParams,
                rewardParams.params);
        }

        if (tokamakVaults.rewardProjectTosPoolParams.params.totalAllocatedAmount != 0) {
            if(!IL2CustomVaultBase(liquidityRewardVault).isVaultAdmin(info.l2Token, info.projectOwner))
                IL2CustomVaultBase(liquidityRewardVault).setVaultAdmin(info.l2Token, info.projectOwner);

            LibProject.InitalParameterLiquidityRewardVault memory rewardParams = tokamakVaults.rewardProjectTosPoolParams;

            IL2LiquidityRewardVault(liquidityRewardVault).initialize(
                l2Token,
                rewardParams.poolParams,
                rewardParams.params);
        }

        if (tokamakVaults.tosAirdropParams.totalAllocatedAmount != 0) {
            if(!IL2CustomVaultBase(tosAirdropVault).isVaultAdmin(info.l2Token, info.projectOwner))
                IL2CustomVaultBase(tosAirdropVault).setVaultAdmin(info.l2Token, info.projectOwner);

            IL2AirdropVault(tosAirdropVault).initialize(
                info.l2Token,
                tokamakVaults.tosAirdropParams);
        }

        if (tokamakVaults.tonAirdropParams.totalAllocatedAmount != 0) {
            if(!IL2CustomVaultBase(tonAirdropVault).isVaultAdmin(info.l2Token, info.projectOwner))
                IL2CustomVaultBase(tonAirdropVault).setVaultAdmin(info.l2Token, info.projectOwner);

            IL2AirdropVault(tonAirdropVault).initialize(
                info.l2Token,
                tokamakVaults.tonAirdropParams);
        }

        uint256 projectId_ = projectId;
        if (totalCustomSchedule != 0) {
            if(!IL2CustomVaultBase(scheduleVault).isVaultAdmin(info.l2Token, info.projectOwner))
                IL2CustomVaultBase(scheduleVault).setVaultAdmin(info.l2Token, info.projectOwner);

            for (uint256 i = 0; i < customScheduleVaults.length; i++){
                LibProject.InitalParameterSchedule memory params = customScheduleVaults[i];

                _approveVaults(info.l2Token, scheduleVault, params.params.totalAllocatedAmount);

                IL2ScheduleVault(scheduleVault).initialize(
                    info.l2Token,
                    params.vaultName,
                    params.params);
            }
        }

        if (totalNonCustomSchedule != 0) {
            if(!IL2CustomVaultBase(nonScheduleVault).isVaultAdmin(info.l2Token, info.projectOwner))
                IL2CustomVaultBase(nonScheduleVault).setVaultAdmin(info.l2Token, info.projectOwner);

            for (uint256 i = 0; i < customNonScheduleVaults.length; i++){
                LibProject.InitalParameterNonScheduleVault memory params = customNonScheduleVaults[i];
                _approveVaults(info.l2Token, nonScheduleVault, params.totalAllocatedAmount);

                IL2NonScheduleVault(nonScheduleVault).initialize(
                    info.l2Token,
                    params.vaultName,
                    params.claimer,
                    params.totalAllocatedAmount );
            }
        }

        emit DistributedL2Token(info.l1Token, info.l2Token, projectId_, total);
    }

    /* ========== Anyone can execute ========== */

    /* ========== VIEW ========== */

    function viewProject(address l2token) external view returns (LibProject.L2ProjectInfo memory) {
        return projects[l2token];
    }

    function availableClaimAll(
        address l2Token,
        string[] memory scheduleVaultNames
    ) public view returns (bool) {

        if (l2Token == address(0)) return false;

        address poolTosL2Token = IL2LiquidityRewardVault(liquidityRewardVault).getPoolAddress(tos, l2Token, poolFee);
        address poolWtonTos = IL2LiquidityRewardVault(liquidityRewardVault).getPoolAddress(wton, tos, poolFee);

        // tos-l2token rewardProjectTosPoolParams
        if (poolTosL2Token != address(0) && IL2LiquidityRewardVault(liquidityRewardVault).availableClaimAmount(l2Token, poolTosL2Token) != 0 )
            return true;

        // wton-tos  rewardTonTosPoolParams
        if (poolWtonTos != address(0) && IL2LiquidityRewardVault(liquidityRewardVault).availableClaimAmount(l2Token, poolWtonTos)  != 0 )
            return true;

        // tosAirdropParams
        if (IL2AirdropVault(tosAirdropVault).availableClaimAmount(l2Token) != 0 )
            return true;

        // tonAirdropParams
        if (IL2AirdropVault(tonAirdropVault).availableClaimAmount(l2Token) != 0 )
            return true;

        // scheduleVaultNames
        if(scheduleVaultNames.length != 0) {
            for(uint256 i ; i < scheduleVaultNames.length ; i++) {
                if (IL2ScheduleVault(scheduleVault).availableClaimAmount(l2Token, scheduleVaultNames[i]) != 0 )
                    return true;
            }
        }

        return false;
    }

    /* === ======= internal ========== */

}