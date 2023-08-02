// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibProject } from "../libraries/LibProject.sol";
// import "../libraries/SafeERC20.sol";
import {IERC20} from "../interfaces/IERC20.sol";

// import "hardhat/console.sol";

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
 * @title L1toL2MessageTest
 * @dev
 */
contract L1toL2MessageTest {

    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */
    modifier nonZero(uint256 value) {
        require(value != 0, "Z1");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Z2");
        _;
    }

    constructor() {
    }

    function depositAndMessage(
        address addressManager, address l1Token, address l2Token,
        address callContract,
        uint256 amount, uint32 _depositMinGasLimit, uint32 _setMinGasLimit
    )
        external
    {
        depositL1TokenToL2(addressManager, l1Token, l2Token, callContract, amount, _depositMinGasLimit);
        l2SendMessage(addressManager, l2Token, callContract,  _setMinGasLimit);
    }

    function l2SendMessage(
            address addressManager,
            address l2Token,
            address callContract,
            uint32 _minGasLimit
        )
        public
    {
        address l1Messenger = LibProject.getL1CommunicationMessenger(addressManager);
        require(l1Messenger != address(0), "l1Messenger is ZeroAddress");

        bytes memory message = abi.encodeWithSelector(
                L2ProjectManagerI.balanceOf.selector,
                l2Token
        );

        L1CrossDomainMessengerI(l1Messenger).sendMessage(callContract, message, _minGasLimit);
    }

    function depositL1TokenToL2(
        address addressManager, address l1Token, address l2Token,
        address callContract, uint256 amount, uint32 _minGasLimit )
        public
    {
        address l1Bridge = LibProject.getL1Bridge(addressManager);
        require(l1Bridge != address(0), "l1Bridge is ZeroAddress");
        IERC20(l1Token).approve(l1Bridge, type(uint256).max);

        L1BridgeI(l1Bridge).depositERC20To(
            l1Token,
            l2Token,
            callContract,
            amount,
            _minGasLimit,
            abi.encode(l1Token, l2Token, callContract, amount)
        );
    }

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}