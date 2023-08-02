// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../common/AccessibleCommon.sol";
import "./L1ProjectManagerStorage.sol";

import { IERC20Factory } from "./interfaces/IERC20Factory.sol";
// import { LibProject } from "../libraries/LibProject.sol";
// import "../libraries/SafeERC20.sol";
import {IERC20} from "../interfaces/IERC20.sol";

import "hardhat/console.sol";

interface L2ProjectManagerI {
    function hello(string memory _msg) external;
    function balanceOf(address l2Token) external;
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

/**
 * @title L1ProjectManager
 * @dev
 */
contract L1ProjectManager is ProxyStorage, AccessibleCommon, L1ProjectManagerStorage {

    event CreatedProject(uint256 projectId, address l1Token, string projectName, address projectOwner, string tokenName, string tokenSymbol, uint256 initialTotalSupply);
    event SetL2Token(uint256 projectId, uint8 l2Type, address addressManager, address l2Token);
    event SetL2TokenFactory(uint8 l2Type, address _l2TokenFactory);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    constructor() {
    }

    /* ========== onlyOwner ========== */

    /// @dev l2TokenFactory 주소 설정
    function setL2TokenFactory(uint8 l2Type, address _l2TokenFactory)
        external nonZeroAddress(_l2TokenFactory) onlyOwner
    {
        require(l2Type < uint8(LibProject.L2_TYPE.NONE), "unsupported l2Type");
        require(l2TokenFactory[l2Type] != _l2TokenFactory, "same");
        l2TokenFactory[l2Type] = _l2TokenFactory;

        emit SetL2TokenFactory(l2Type, _l2TokenFactory);
    }

    function setL2ProjectManager(uint8 l2Type, address _l2ProjectManager)
        external nonZeroAddress(_l2ProjectManager) onlyOwner
    {
        require(l2Type < uint8(LibProject.L2_TYPE.NONE), "unsupported l2Type");
        require(l2ProjectManager[l2Type] != _l2ProjectManager, "same");
        l2ProjectManager[l2Type] = _l2ProjectManager;

        emit SetL2TokenFactory(l2Type, _l2ProjectManager);
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

    /* ========== Only ProjectOwner ========== */

    function setL2Token(uint256 projectId, uint8 l2Type, address addressManager, address l2Token)
        external nonZeroAddress(addressManager) nonZeroAddress(l2Token) onlyProjectOwner(projectId)
    {
        require(l2Type < uint8(LibProject.L2_TYPE.NONE), "unsupported l2Type");

        LibProject.ProjectInfo storage info = projects[projectId];
        require(info.addressManager != addressManager || info.l2Token != l2Token, "same L2");
        info.addressManager = addressManager;
        info.l2Token = l2Token;

        emit SetL2Token(projectId, l2Type, addressManager, l2Token);
    }

    /// @dev L1 볼트에 토큰 전송 및 일정 설정
    function setL1Vaults(uint256 projectId)
        external onlyProjectOwner(projectId)
    {

    }

    function depositAndSetL2Vaults(uint256 projectId, uint256 amount, uint32 _depositMinGasLimit, uint32 _setMinGasLimit)
        external
    {
        depositL1TokenToL2(projectId, amount, _depositMinGasLimit);
        setL2Vaults(projectId, _setMinGasLimit);
    }

    function setL2Vaults(uint256 projectId, uint32 _minGasLimit)
        public nonZeroAddress(l2ProjectManager[projects[projectId].l2Type]) onlyProjectOwner(projectId)
    {
        address l1Messenger = LibProject.getL1CommunicationMessenger(projects[projectId].addressManager);
        require(l1Messenger != address(0), "l1Messenger is ZeroAddress");
        // require(l2ProjectManager[projects[projectId].l2Type] != address(0), "l2ProjectManager is ZeroAddress");

        bytes memory message = abi.encodeWithSelector(
                L2ProjectManagerI.balanceOf.selector,
                projects[projectId].l2Token
        );

        L1CrossDomainMessengerI(l1Messenger).sendMessage(l2ProjectManager[projects[projectId].l2Type], message, _minGasLimit);
    }

    function depositL1TokenToL2(uint256 projectId, uint256 amount, uint32 _minGasLimit)
        public nonZeroAddress(l2ProjectManager[projects[projectId].l2Type]) nonZeroAddress(projects[projectId].l2Token) onlyProjectOwner(projectId)
    {
        address l1Bridge = LibProject.getL1Bridge(projects[projectId].addressManager);
        require(l1Bridge != address(0), "l1Bridge is ZeroAddress");
        IERC20(projects[projectId].l1Token).approve(l1Bridge, projects[projectId].initialTotalSupply);

        L1BridgeI(l1Bridge).depositERC20To(
            projects[projectId].l1Token,
            projects[projectId].l2Token,
            l2ProjectManager[projects[projectId].l2Type],
            amount,
            _minGasLimit,
            abi.encode(projectId)
        );
    }

    /* ========== Only ProjectOwner ========== */

    /// @dev 프로젝트 생성
    function createProject(
        address tokenOwner,
        address projectOwner,
        uint256 initialTotalSupply,
        uint8 tokenType,
        string memory projectName,
        string memory tokenName,
        string memory tokenSymbol
    )
        external returns (uint256)
    {
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

        projects[projectId] = LibProject.ProjectInfo({
            projectOwner: projectOwner,
            tokenOwner : tokenOwner,
            l1Token : projectToken,
            l2Token : address(0),
            addressManager : address(0),
            initialTotalSupply : initialTotalSupply,
            tokenType : tokenType,
            l2Type : uint8(0),
            projectName : projectName
        });

        projectTokens[projectToken] = projectId;

        emit CreatedProject(projectId, projectToken, projectName, projectOwner, tokenName, tokenSymbol, initialTotalSupply);
        return projectId;
    }

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}