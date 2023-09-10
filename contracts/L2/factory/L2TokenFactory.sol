// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/* Contract Imports */
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";

import { L2StandardERC20 } from "../../standards/L2StandardERC20.sol";
import { Lib_PredeployAddresses } from "../../libraries/constants/Lib_PredeployAddresses.sol";


interface IL2Projectmanager {

    function createL2Project(
        address projectOwner,
        address l1Token,
        address l2Token,
        string calldata projectName
    )  external;
}

/**
 * @title L2TokenFactory
 * @dev Factory contract for creating standard L2 token representations of L1 ERC20s
 * compatible with and working on the standard bridge.
 */
contract L2TokenFactory is AccessibleCommon {

    address public l2ProjectManager;

    event StandardL2TokenCreated(address indexed l1Token, address indexed l2Token);

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Z2");
        _;
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
        l2ProjectManager = _l2ProjectManager;
    }

    /* ========== Anyone can execute ========== */

    /**
     * @dev Creates an instance of the standard ERC20 token on L2.
     * @param projectOwner Address of the project owner.
     * @param _l1Token Address of the corresponding L1 token.
     * @param _name ERC20 name.
     * @param _symbol ERC20 symbol.
     */
    function createL2Token(
        address projectOwner,
        address _l1Token,
        string calldata _name,
        string calldata _symbol,
        string calldata projectName
    ) external {
        require(_l1Token != address(0), "Must provide L1 token address");
        require(projectOwner != address(0), "zero projectOwner");
        require(bytes(_name).length != 0, "name is null");
        require(bytes(_symbol).length != 0, "symbol is null");

        L2StandardERC20 l2Token = new L2StandardERC20(
            Lib_PredeployAddresses.L2_STANDARD_BRIDGE,
            _l1Token,
            _name,
            _symbol
        );

        require(address(l2Token) != address(0), "zero l2Token");

        IL2Projectmanager(l2ProjectManager).createL2Project(
            projectOwner, _l1Token, address(l2Token), projectName
        );

        emit StandardL2TokenCreated(_l1Token, address(l2Token));
    }

    /* ========== VIEW ========== */

    /* === ======= internal ========== */


}
