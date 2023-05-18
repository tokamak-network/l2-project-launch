// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { AccessibleCommon } from "../common/AccessibleCommon.sol";

import {IERC20} from "../interfaces/IERC20.sol";
import "../libraries/SafeERC20.sol";
import "hardhat/console.sol";

/**
 * @title L2ProjectManager
 * @dev
 */
contract L2ProjectManager is AccessibleCommon {
    using SafeERC20 for IERC20;
    struct ProjectInfo {
        address projectOwner;
        address l1Token;
        address l2Token;
        string projectName;
    }

    bool internal free = true;
    address public l1ProjectManager;
    address public l2TokenFactory;

    // l2token - ProjectInfo
    mapping(address => ProjectInfo) public projects;

    modifier onlyL2TokenFactory() {
        require(l2TokenFactory != address(0) && msg.sender == l2TokenFactory, "caller is not l2TokenFactory");
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

    event AddedProject(address indexed l1Token, address indexed l2Token, address projectOwner, string projectName);
    event Hello(string);
    event BalacneOf(address l2Token, uint256 amount);

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
    /* ========== only L2TokenFactory ========== */

    /// @dev 프로젝트 추가
    function addProject(
        address projectOwner,
        address l1Token,
        address l2Token,
        string calldata projectName
    )
        external onlyL2TokenFactory
    {
        require(bytes(projectName).length != 0, "projectName is null");
        require(projects[l2Token].l1Token == address(0), "already added");
        projects[l2Token] = ProjectInfo({
            projectOwner: projectOwner,
            l1Token : l1Token,
            l2Token : l2Token,
            projectName : projectName
        });

        emit AddedProject(l1Token, l2Token, projectOwner, projectName);
    }

    /* ========== Anyone can execute ========== */
    function hello(string memory _msg) external {
        emit Hello(_msg);
    }

    function balanceOf(address l2Token) external {
        uint256 balance = IERC20(l2Token).balanceOf(address(this));
        emit BalacneOf(l2Token, balance);
    }
    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}