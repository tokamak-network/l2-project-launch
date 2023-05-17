// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { AccessibleCommon } from "../common/AccessibleCommon.sol";

/**
 * @title L2ProjectManager
 * @dev
 */
contract L2ProjectManager is AccessibleCommon {

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
        require(msg.sender != l2TokenFactory, "caller is not l2TokenFactory");
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

    event AddedProject(address indexed l1token, address indexed l2token, address projectOwner, string projectName);

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */


    /* ========== onlyOwner ========== */

    /// @dev l1ProjectManager 주소 설정
    function setL1ProjectManager(address _l1ProjectManager)
        external nonZeroAddress(_l1ProjectManager) onlyOwner
    {
        require(l1ProjectManager != _l1ProjectManager, "same address");
        l1ProjectManager = _l1ProjectManager;
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

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}