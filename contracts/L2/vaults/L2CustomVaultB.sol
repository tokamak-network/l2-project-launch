// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { AccessibleCommon } from "../../common/AccessibleCommon.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";
import "hardhat/console.sol";

/**
 * @title L2CustomVaultB
 * @dev 볼트 어드민이 스케쥴에 따라 클래임하는 볼트
 */
contract L2CustomVaultB is AccessibleCommon {
    using SafeERC20 for IERC20;
    bool internal free = true;
    address public l2ProjectManager;

    struct VaultInfo {
        uint256 totalAllocatedAmount;
        uint256 totalClaimCount;
        uint256 totalClaimAmount;
        uint256 firstClaimAmount;
        uint32 firstClaimTime;
        uint32 claimIntervalSeconds;
        uint32 nowClaimRound;
    }

    // l2token - VaultInfo
    mapping(address => VaultInfo) public vaultInfo;

    // l2token - tokenOwner
    mapping(address => address) public vaultAdmin;

    event SetVaultAdmin(address l2Token, address newAdmin);

    modifier onlyL2ProjectManager() {
        require(l2ProjectManager != address(0) && msg.sender == l2ProjectManager, "caller is not l2ProjectManager");
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

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */
     constructor() {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /* ========== onlyOwner ========== */

    function setL2ProjectManager(address _l2ProjectManager)
        external nonZeroAddress(_l2ProjectManager) onlyOwner
    {
        require(l2ProjectManager != _l2ProjectManager, "same");
        _l2ProjectManager = _l2ProjectManager;
    }

    /* ========== only L2ProjectManager ========== */

    function setVaultAdmin(
        address l2Token,
        address _newAdmin
    )
        external nonZeroAddress(l2Token) nonZeroAddress(_newAdmin) onlyL2ProjectManager
    {

        vaultAdmin[l2Token] = _newAdmin;

        emit SetVaultAdmin(l2Token, _newAdmin);
    }

    /* ========== Anyone can vault admin of token ========== */
    function claim(address l2Token, address to, uint256 amount)
        external nonZeroAddress(msg.sender) nonZeroAddress(l2Token) nonZeroAddress(to) nonZero(amount)
    {
        require(vaultAdmin[l2Token] == msg.sender);
        require(amount <= IERC20(l2Token).balanceOf(address(this)), "balance is insufficient.");

        IERC20(l2Token).safeTransfer(to, amount);
    }

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}