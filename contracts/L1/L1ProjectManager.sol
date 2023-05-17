// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { AccessibleCommon } from "../common/AccessibleCommon.sol";

import { IERC20Factory } from "./interfaces/IERC20Factory.sol";
import { LibProject } from "../libraries/constants/LibProject.sol";

/**
 * @title L1ProjectManager
 * @dev
 */
contract L1ProjectManager is AccessibleCommon {

    struct ProjectInfo {
        address projectOwner;
        address tokenOwner;
        address l1token;
        address l2token;
        address addressManager;
        uint256 initialTokenSupply;
        uint8 tokenType;
        uint8 l2Type;
        string projectName;
    }

    bool internal free = true;

    uint256 public projectCount;

    // projectIndex - ProjectInfo
    mapping(uint256 => ProjectInfo) public projects;

    // projectIndex - ProjectInfo
    mapping(address => uint256) public projectTokens;

    // l2type - l2TokenFactory
    mapping(uint8 => address) public l2TokenFactory;

    // TOKEN_TYPE - l1TokenFactory
    mapping(uint8 => address) public l1TokenFactory;

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

    event CreatedProject(uint256 projectId, address l1token, string projectName, address projectOwner, string tokenName, string tokenSymbol, uint256 initialTotalSupply);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    constructor() {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /* ========== onlyOwner ========== */

    /// @dev l2TokenFactory 주소 설정
    function setL2TokenFactory(uint8 l2Type, address _l2TokenFactory)
        external nonZeroAddress(_l2TokenFactory) onlyOwner
    {
        require(l2Type < uint8(LibProject.L2_TYPE.NONE), "unsupported l2Type");
        require(l2TokenFactory[l2Type] != _l2TokenFactory, "same");
        l2TokenFactory[l2Type] = _l2TokenFactory;
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

    /* ========== Anyone can execute ========== */

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

        // 토큰 생성, 토큰 초기 개수는 현재 프로젝트 토큰에게 주는 것으로 하려나..
        address projectToken = IERC20Factory(l1TokenFactory[tokenType]).create(
            tokenName, tokenSymbol, initialTotalSupply, tokenOwner
        );

        require(projectToken != address(0), "zero projectToken");
        uint256 projectId = ++projectCount;

        projects[projectId] = ProjectInfo({
            projectOwner: projectOwner,
            tokenOwner : tokenOwner,
            l1token : projectToken,
            l2token : address(0),
            addressManager : address(0),
            initialTokenSupply : initialTotalSupply,
            tokenType : tokenType,
            l2Type : uint8(0),
            projectName : projectName
        });

        projectTokens[projectToken] = projectId;

        emit CreatedProject(projectId, projectToken, projectName, projectOwner, tokenName, tokenSymbol, initialTotalSupply);
        return projectId;
    }

    /// @dev 프로젝트 생성
    function setL2(uint256 projectId, uint8 l2Type, address addressManager, address l2token)
        external nonZeroAddress(addressManager) nonZeroAddress(l2token)
    {
        require(msg.sender == projects[projectId].projectOwner, "caller is not projectOwner.");
        require(l2Type < uint8(LibProject.L2_TYPE.NONE), "unsupported l2Type");

        ProjectInfo storage info = projects[projectId];
        require(info.addressManager != addressManager || info.l2token != l2token, "same L2");
        info.addressManager = addressManager;
        info.l2token = l2token;
    }

    /// @dev L1 볼트에 토큰 전송 및 일정 설정
    function setL1Vaults(uint256 projectId)
        external
    {

    }

    /// @dev L2 볼트에 토큰 전송 및 일정 설정
    function setL2Vaults(uint256 projectId)
        external
    {

    }

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}