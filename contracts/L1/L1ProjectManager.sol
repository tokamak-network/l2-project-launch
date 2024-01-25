// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../common/AccessibleCommon.sol";
import "./L1ProjectManagerStorage.sol";

import { IERC20Factory } from "./interfaces/IERC20Factory.sol";
import { LibProject } from "../libraries/LibProject.sol";
import "../libraries/SafeERC20.sol";
import {IERC20} from "../interfaces/IERC20.sol";

// import "hardhat/console.sol";

interface L2ProjectManagerI {
    function distributesL2Token(
        address l1Token,
        address l2Token,
        uint256 projectId,
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    ) external;
}

interface L1CrossDomainMessengerI {
    function sendMessage(
        address _target,
        bytes memory _message,
        uint32 _gasLimit
    ) external;
}

interface L1BridgeI {
    function depositERC20To(
        address _l1Token,
        address _l2Token,
        address _to,
        uint256 _amount,
        uint32 _l2Gas,
        bytes calldata _data
    ) external;
}

interface IIERC20 {
    function mint(address account, uint256 amount) external;
}

/**
 * @title L1ProjectManager
 * @dev
 */
contract L1ProjectManager is ProxyStorage, AccessibleCommon, L1ProjectManagerStorage {
    using SafeERC20 for IERC20;

    event CreatedProject(
        address l1Token,
        uint256 projectId,
        address tokenOwner,
        address projectOwner,
        address addressManager,
        uint256 initialTotalSupply,
        string projectName, string tokenName, string tokenSymbol);

    event SetL2Token(uint256 projectId, uint8 l2Type, address addressManager, address l2Token);
    event SetL2Infos(uint8 l2Type, address l2TokenFactory, address l2ProjectManager, uint32 depositMinGasLimit, uint32 sendMsgMinGasLimit);
    event LaunchedProject(
        uint256 projectId,
        address l1Token,
        address l2Token,
        uint256 totalAmount);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    constructor() {
    }

    /* ========== onlyOwner ========== */

    function setL2Infos(
        uint8 l2Type,
        address _l2TokenFactory,
        address _l2ProjectManager,
        uint32 _depositMinGasLimit,
        uint32 _sendMsgMinGasLimit
    )
        external
        nonZeroAddress(_l2TokenFactory) nonZeroAddress(_l2ProjectManager)
        nonZero(_depositMinGasLimit) nonZero(_sendMsgMinGasLimit)
        onlyOwner
    {
        require(l2Type < uint8(LibProject.L2_TYPE.NONE), "unsupported l2Type");
        require(
            l2Info[l2Type].l2TokenFactory != _l2TokenFactory
            || l2Info[l2Type].l2ProjectManager != _l2ProjectManager
            || l2Info[l2Type].depositMinGasLimit != _depositMinGasLimit
            || l2Info[l2Type].sendMsgMinGasLimit != _sendMsgMinGasLimit , "same");

        LibProject.L2Info memory info = LibProject.L2Info({
                l2TokenFactory: _l2TokenFactory,
                l2ProjectManager: _l2ProjectManager,
                depositMinGasLimit: _depositMinGasLimit,
                sendMsgMinGasLimit: _sendMsgMinGasLimit
        });

        l2Info[l2Type] = info;

        emit SetL2Infos(l2Type, _l2TokenFactory, _l2ProjectManager, _depositMinGasLimit, _sendMsgMinGasLimit);
    }

    function setL1TokenFactories(uint8[] memory tokenTypes, address[] memory _l1TokenFactorys)
        external onlyOwner
    {
        require(tokenTypes.length != 0 && tokenTypes.length == _l1TokenFactorys.length, "wrong length");
        uint256 len = tokenTypes.length;

        for (uint256 i = 0; i < len; i++){
            require(tokenTypes[i] < uint8(LibProject.TOKEN_TYPE.NONE), "unsupported token type");
            require(l1TokenFactory[tokenTypes[i]] != _l1TokenFactorys[i], "same address");
            l1TokenFactory[tokenTypes[i]] = _l1TokenFactorys[i];
        }
    }

    function setL2PublicSaleValue(
        uint8 _min,
        uint8 _max,
        uint256 _delayTime
    )
        external
        onlyOwner
    {
        LibProject.PublicSaleSet memory set = LibProject.PublicSaleSet({
            minPercents: _min,
            maxPercents: _max,
            delayTime: _delayTime
        });

        publicInfo[0] = set;
    }

    /* ========== Only ProjectOwner ========== */

    /// @dev 프로젝트 생성
    function createProject(
        address tokenOwner,
        address projectOwner,
        address addressManager,
        uint256 initialTotalSupply,
        uint8 tokenType,
        string memory projectName,
        string memory tokenName,
        string memory tokenSymbol
    )
        external
        returns (uint256)
    {
        require(tokenOwner != address(0) && projectOwner != address(0) && addressManager != address(0),
            "zero address");
        require(bytes(projectName).length != 0, "projectName is null");
        require(bytes(tokenName).length != 0, "tokenName is null");
        require(bytes(tokenSymbol).length != 0, "tokenSymbol is null");
        require(tokenType < uint8(LibProject.TOKEN_TYPE.NONE)
            && address(l1TokenFactory[tokenType]) != address(0), "wrong tokenType or zero l1TokenFactory");

        address projectToken = IERC20Factory(l1TokenFactory[tokenType]).create(
            tokenName, tokenSymbol, initialTotalSupply, address(this)
        );

        require(projectToken != address(0), "zero projectToken");
        uint256 projectId = ++projectCount;
        // address _tokenOwner = tokenOwner;

        projects[projectId] = LibProject.ProjectInfo({
            projectOwner: projectOwner,
            tokenOwner : tokenOwner,
            l1Token : projectToken,
            l2Token : address(0),
            addressManager : addressManager,
            initialTotalSupply : initialTotalSupply,
            tokenType : tokenType,
            l2Type : uint8(0),
            projectName : projectName
        });

        projectTokens[projectToken] = projectId;

        emit CreatedProject(
            projectToken, projectId, tokenOwner, projectOwner, addressManager, initialTotalSupply,
            projectName,  tokenName, tokenSymbol );
        return projectId;
    }

    function launchProjectExceptCheckPublic(
        uint256 projectId,
        address l2Token,
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    )
        external nonZeroAddress(l2Token) nonZero(totalAmount)
    {
        LibProject.ProjectInfo memory info = projects[projectId];
        require(info.projectOwner != address(0) && msg.sender == info.projectOwner, "caller is not projectOwner.");
        require(info.l2Token == address(0), "already launched");
        require(projectTokens[info.l1Token] == projectId, "wrong l1Token");

        address l1Messenger = LibProject.getL1CommunicationMessenger(info.addressManager);
        require(l1Messenger != address(0), "l1Messenger is ZeroAddress");
        bytes memory  callData = abi.encodeWithSelector(
                    L2ProjectManagerI.distributesL2Token.selector,
                    info.l1Token,
                    l2Token,
                    projectId,
                    totalAmount,
                    tokamakVaults,
                    customScheduleVaults,
                    customNonScheduleVaults
                ) ;
        uint256 totalAllocatedAmount = 0;

        // 입력 데이타 검증
        // (bool boolValidateTokamakVaults, uint256 tokamakVaultsTotalAmount) = LibProject.validateTokamakVaults(tokamakVaults);
        (bool boolValidateTokamakVaults, uint256 tokamakVaultsTotalAmount) = validateTokamakVaultsExceptPublic(tokamakVaults);

        require(boolValidateTokamakVaults, "TokamakVaults vaildate fail");

        (bool boolValidatePublicVaults,) = validationPublicSaleVaults(tokamakVaults.publicSaleParams);
        require(boolValidatePublicVaults, "PublicVault vaildate fail");

        totalAllocatedAmount += tokamakVaultsTotalAmount;

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom1, uint256 custom1TotalAmount) = LibProject.validateScheduleVault(customScheduleVaults);
            require(boolValidateCustom1, "customScheduleVaults vaildate fail");
            totalAllocatedAmount += custom1TotalAmount;
        }

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom2, uint256 custom2TotalAmount) = LibProject.validateNonScheduleVault(customNonScheduleVaults);
            require(boolValidateCustom2, "customNonScheduleVaults vaildate fail");
            totalAllocatedAmount += custom2TotalAmount;
        }
        require(totalAllocatedAmount == totalAmount, "totalAmount is different from vaults allocated amount");

        uint256 id = projectId;

        // 1. L2토큰 정보를 저장한다.
        projects[id].l2Token = l2Token;
        info.l2Token = l2Token;

        uint256 balance = IERC20(projects[id].l1Token).balanceOf(address(this));

        // 2. L1 토큰 발행하고,
        if (balance <= info.initialTotalSupply && info.tokenType != 0) {
            IIERC20(info.l1Token).mint(address(this), info.initialTotalSupply - balance);
            balance = IERC20(projects[id].l1Token).balanceOf(address(this));
        }

        require(balance >= info.initialTotalSupply, "balance is insufficient");

        LibProject.L2Info memory _l2Info = l2Info[info.l2Type];

        // 3. L2로 디파짓 한다.
        _depositL1TokenToL2(
            info.addressManager,
            info.l1Token,
            info.l2Token,
            _l2Info.l2ProjectManager,
            info.initialTotalSupply,
            _l2Info.depositMinGasLimit,
            abi.encode(id)
        );
        // bytes memory callData = abi.encodeWithSelector(L2ProjectManagerI.distributesL2Token.selector, functionParams);

        // 4. 커스텀 배포정보를 L2에 보낸다.
        L1CrossDomainMessengerI(l1Messenger).sendMessage(
                _l2Info.l2ProjectManager,
                callData,
                _l2Info.sendMsgMinGasLimit
            );

        emit LaunchedProject(id, info.l1Token, info.l2Token, info.initialTotalSupply);
    }

    function launchProject(
        uint256 projectId,
        address l2Token,
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    )
        external nonZeroAddress(l2Token) nonZero(totalAmount)
    {
        LibProject.ProjectInfo memory info = projects[projectId];
        require(info.projectOwner != address(0) && msg.sender == info.projectOwner, "caller is not projectOwner.");
        require(info.l2Token == address(0), "already launched");
        require(projectTokens[info.l1Token] == projectId, "wrong l1Token");

        address l1Messenger = LibProject.getL1CommunicationMessenger(info.addressManager);
        require(l1Messenger != address(0), "l1Messenger is ZeroAddress");
        bytes memory  callData = abi.encodeWithSelector(
                    L2ProjectManagerI.distributesL2Token.selector,
                    info.l1Token,
                    l2Token,
                    projectId,
                    totalAmount,
                    tokamakVaults,
                    customScheduleVaults,
                    customNonScheduleVaults
                ) ;
        uint256 totalAllocatedAmount = 0;

        // 입력 데이타 검증
        (bool boolValidateTokamakVaults, uint256 tokamakVaultsTotalAmount) = LibProject.validateTokamakVaults(tokamakVaults);
        require(boolValidateTokamakVaults, "TokamakVaults vaildate fail");

        (bool boolValidatePublicVaults,) = validationPublicSaleVaults(tokamakVaults.publicSaleParams);
        require(boolValidatePublicVaults, "PublicVault vaildate fail");

        totalAllocatedAmount += tokamakVaultsTotalAmount;

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom1, uint256 custom1TotalAmount) = LibProject.validateScheduleVault(customScheduleVaults);
            require(boolValidateCustom1, "customScheduleVaults vaildate fail");
            totalAllocatedAmount += custom1TotalAmount;
        }

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom2, uint256 custom2TotalAmount) = LibProject.validateNonScheduleVault(customNonScheduleVaults);
            require(boolValidateCustom2, "customNonScheduleVaults vaildate fail");
            totalAllocatedAmount += custom2TotalAmount;
        }
        require(totalAllocatedAmount == totalAmount, "totalAmount is different from vaults allocated amount");

        uint256 id = projectId;

        // 1. L2토큰 정보를 저장한다.
        projects[id].l2Token = l2Token;
        info.l2Token = l2Token;

        uint256 balance = IERC20(projects[id].l1Token).balanceOf(address(this));

        // 2. L1 토큰 발행하고,
        if (balance <= info.initialTotalSupply && info.tokenType != 0) {
            IIERC20(info.l1Token).mint(address(this), info.initialTotalSupply - balance);
            balance = IERC20(projects[id].l1Token).balanceOf(address(this));
        }

        require(balance >= info.initialTotalSupply, "balance is insufficient");

        LibProject.L2Info memory _l2Info = l2Info[info.l2Type];

        // 3. L2로 디파짓 한다.
        _depositL1TokenToL2(
            info.addressManager,
            info.l1Token,
            info.l2Token,
            _l2Info.l2ProjectManager,
            info.initialTotalSupply,
            _l2Info.depositMinGasLimit,
            abi.encode(id)
        );
        // bytes memory callData = abi.encodeWithSelector(L2ProjectManagerI.distributesL2Token.selector, functionParams);

        // 4. 커스텀 배포정보를 L2에 보낸다.
        L1CrossDomainMessengerI(l1Messenger).sendMessage(
                _l2Info.l2ProjectManager,
                callData,
                _l2Info.sendMsgMinGasLimit
            );

        emit LaunchedProject(id, info.l1Token, info.l2Token, info.initialTotalSupply);
    }

    /* ========== VIEW ========== */
    function viewL2Info(uint8 _l2Type) external view returns (LibProject.L2Info memory) {
        return l2Info[_l2Type];
    }

    function validationVaultsParameters(
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    ) external view returns(bool valid, string memory resean) {

        uint256 totalAllocatedAmount = 0;

        (bool boolValidateTokamakVaults, uint256 tokamakVaultsTotalAmount) = LibProject.validateTokamakVaults(tokamakVaults);
        if(!boolValidateTokamakVaults) {
            return (false, "F1");
        }

        (bool boolValidatePublicVaults,) = validationPublicSaleVaults(tokamakVaults.publicSaleParams);
        require(boolValidatePublicVaults, "F1-1");

        totalAllocatedAmount += tokamakVaultsTotalAmount;

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom1, uint256 custom1TotalAmount) = LibProject.validateScheduleVault(customScheduleVaults);
            totalAllocatedAmount += custom1TotalAmount;
            if(!boolValidateCustom1) {
                return (false, "F2");
            }
        }

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom2, uint256 custom2TotalAmount) = LibProject.validateNonScheduleVault(customNonScheduleVaults);
            totalAllocatedAmount += custom2TotalAmount;
            if(!boolValidateCustom2) {
                return (false, "F3");
            }
        }

        if(totalAmount != totalAllocatedAmount) return (false, 'F4');
        return (true, '');
    }


    function validationVaultsParametersExceptPublic(
        uint256 totalAmount,
        LibProject.TokamakVaults memory tokamakVaults,
        LibProject.InitalParameterSchedule[] memory customScheduleVaults,
        LibProject.InitalParameterNonScheduleVault[] memory customNonScheduleVaults
    ) external view returns(bool valid, string memory resean) {

        uint256 totalAllocatedAmount = 0;

        (bool boolValidateTokamakVaults, uint256 tokamakVaultsTotalAmount) = validateTokamakVaultsExceptPublic(tokamakVaults);
        if(!boolValidateTokamakVaults) {
            return (false, "F0");
        }

        (bool boolValidatePublicVaults,) = validationPublicSaleVaults(tokamakVaults.publicSaleParams);
        require(boolValidatePublicVaults, "F1-1");

        totalAllocatedAmount += tokamakVaultsTotalAmount;

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom1, uint256 custom1TotalAmount) = LibProject.validateScheduleVault(customScheduleVaults);
            totalAllocatedAmount += custom1TotalAmount;
            if(!boolValidateCustom1) {
                return (false, "F2");
            }
        }

        if(customScheduleVaults.length != 0){
            (bool boolValidateCustom2, uint256 custom2TotalAmount) = LibProject.validateNonScheduleVault(customNonScheduleVaults);
            totalAllocatedAmount += custom2TotalAmount;
            if(!boolValidateCustom2) {
                return (false, "F3");
            }
        }

        if(totalAmount != totalAllocatedAmount) return (false, 'F4');
        return (true, '');
    }

    function validationPublicSaleVaults(
        LibProject.InitalParameterPublicSale memory publicSaleParams
    ) public view returns(bool valid, string memory resean) {
        LibProject.PublicSaleSet memory sale = publicInfo[0];

        if (
            sale.minPercents > publicSaleParams.vaultParams.changeTOSPercent ||
            sale.maxPercents < publicSaleParams.vaultParams.changeTOSPercent
        ) return (false, "F1");

        if (
            (block.timestamp + sale.delayTime) > publicSaleParams.vaultParams.startWhiteTime
        ) return (false, "F1");


        return (true, '');
    }

    /* === ======= internal ========== */
    function _depositL1TokenToL2(
        address addressManager, address l1Token, address l2Token, address depositTo,
        uint256 amount, uint32 _minGasLimit, bytes memory data)
        internal
    {
        address l1Bridge = LibProject.getL1Bridge(addressManager);
        require(l1Bridge != address(0), "l1Bridge is ZeroAddress");

        uint256 allowance = IERC20(l1Token).allowance(address(this), l1Bridge);

        if (allowance < amount) IERC20(l1Token).approve(l1Bridge, type(uint256).max);

        L1BridgeI(l1Bridge).depositERC20To(
            l1Token,
            l2Token,
            depositTo,
            amount,
            _minGasLimit,
            data
        );
    }

    function validateTokamakVaultsExceptPublic(LibProject.TokamakVaults memory tokamakVaults)
    public pure returns (bool boolValidate, uint256 totalAmount) {

        if (
            tokamakVaults.initialVaultParams.totalAllocatedAmount == 0 ||
            tokamakVaults.rewardTonTosPoolParams.params.totalAllocatedAmount == 0 ||
            tokamakVaults.rewardProjectTosPoolParams.params.totalAllocatedAmount == 0 ||
            tokamakVaults.tosAirdropParams.totalAllocatedAmount == 0 ||
            tokamakVaults.tonAirdropParams.totalAllocatedAmount == 0
        ) return (boolValidate, totalAmount);

        if (tokamakVaults.initialVaultParams.tosPrice == 0 ||
            tokamakVaults.initialVaultParams.tokenPrice == 0 ||
            tokamakVaults.initialVaultParams.initSqrtPrice == 0 ||
            tokamakVaults.initialVaultParams.startTime == 0 ||
            tokamakVaults.initialVaultParams.fee == 0) return (boolValidate, totalAmount);

        if (tokamakVaults.rewardTonTosPoolParams.poolParams.token0 == address(0) ||
            tokamakVaults.rewardTonTosPoolParams.poolParams.token1 == address(0) ||
            tokamakVaults.rewardTonTosPoolParams.poolParams.fee == 0 ||
            tokamakVaults.rewardTonTosPoolParams.params.totalClaimCount == 0 ||
            tokamakVaults.rewardTonTosPoolParams.params.firstClaimAmount == 0 ||
            tokamakVaults.rewardTonTosPoolParams.params.firstClaimTime == 0 ||
            tokamakVaults.rewardTonTosPoolParams.params.secondClaimTime == 0 ||
            tokamakVaults.rewardTonTosPoolParams.params.roundIntervalTime == 0
            ) return (boolValidate, totalAmount);

        if (tokamakVaults.rewardProjectTosPoolParams.poolParams.token0 == address(0) ||
            tokamakVaults.rewardProjectTosPoolParams.poolParams.token1 == address(0) ||
            tokamakVaults.rewardProjectTosPoolParams.poolParams.fee == 0 ||
            tokamakVaults.rewardProjectTosPoolParams.params.totalClaimCount == 0 ||
            tokamakVaults.rewardProjectTosPoolParams.params.firstClaimAmount == 0 ||
            tokamakVaults.rewardProjectTosPoolParams.params.firstClaimTime == 0 ||
            tokamakVaults.rewardProjectTosPoolParams.params.secondClaimTime == 0 ||
            tokamakVaults.rewardProjectTosPoolParams.params.roundIntervalTime == 0
            ) return (boolValidate, totalAmount);

        if (tokamakVaults.tosAirdropParams.totalClaimCount == 0 ||
            tokamakVaults.tosAirdropParams.firstClaimAmount == 0 ||
            tokamakVaults.tosAirdropParams.firstClaimTime == 0 ||
            tokamakVaults.tosAirdropParams.secondClaimTime == 0 ||
            tokamakVaults.tosAirdropParams.roundIntervalTime == 0
            ) return (boolValidate, totalAmount);

        if (tokamakVaults.tonAirdropParams.totalClaimCount == 0 ||
            tokamakVaults.tonAirdropParams.firstClaimAmount == 0 ||
            tokamakVaults.tonAirdropParams.firstClaimTime == 0 ||
            tokamakVaults.tonAirdropParams.secondClaimTime == 0 ||
            tokamakVaults.tonAirdropParams.roundIntervalTime == 0
            ) return (boolValidate, totalAmount);

        if (
            tokamakVaults.rewardTonTosPoolParams.params.secondClaimTime < tokamakVaults.rewardTonTosPoolParams.params.firstClaimTime ||
            tokamakVaults.rewardProjectTosPoolParams.params.secondClaimTime < tokamakVaults.rewardProjectTosPoolParams.params.firstClaimTime ||
            tokamakVaults.tosAirdropParams.secondClaimTime < tokamakVaults.tosAirdropParams.firstClaimTime ||
            tokamakVaults.tonAirdropParams.secondClaimTime < tokamakVaults.tonAirdropParams.firstClaimTime
            )
            return (boolValidate, totalAmount);

        totalAmount = tokamakVaults.publicSaleParams.vaultParams.total1roundSaleAmount +
                    tokamakVaults.publicSaleParams.vaultParams.total2roundSaleAmount +
                    tokamakVaults.initialVaultParams.totalAllocatedAmount +
                    tokamakVaults.rewardTonTosPoolParams.params.totalAllocatedAmount +
                    tokamakVaults.rewardProjectTosPoolParams.params.totalAllocatedAmount +
                    tokamakVaults.tosAirdropParams.totalAllocatedAmount +
                    tokamakVaults.tonAirdropParams.totalAllocatedAmount ;

        if (totalAmount == 0) return (boolValidate, totalAmount);

        boolValidate = true;
    }

}