// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibProject } from "../libraries/LibProject.sol";
import "../libraries/SafeERC20.sol";
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
contract L1toL2SendMessage {
    using SafeERC20 for IERC20;
    /* ========== DEPENDENCIES ========== */

    struct CallMessage {
        address target;
        bytes message;
        uint32 minGasLimit;
    }

    struct DepositMessage {
        address l1Token;
        address l2Token;
        DepositTo[] depositTos;
    }

    struct DepositTo {
        address to;
        uint256 amount;
        uint32 minGasLimit;
    }

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
        address addressManager,
        DepositMessage[] memory depositMassage,
        CallMessage[] memory callMessages
    )
        external
    {
        deposits(addressManager, depositMassage);
        l2SendMessage(addressManager, callMessages);
    }

    function l2SendMessage(
            address addressManager,
            CallMessage[] memory callMessages
        )
        public
    {
        address l1Messenger = LibProject.getL1CommunicationMessenger(addressManager);
        require(l1Messenger != address(0), "l1Messenger is ZeroAddress");
        require(callMessages.length != 0, 'zero call message');

        uint256 len = callMessages.length ;
        for(uint256 i = 0; i < len ; i++){
            require(callMessages[i].target != address(0)
                && callMessages[i].message.length != 0
                && callMessages[i].minGasLimit != 0, 'invalid message');
        }

        for(uint256 i = 0; i < len ; i++){
            L1CrossDomainMessengerI(l1Messenger).sendMessage(
                callMessages[i].target,
                callMessages[i].message,
                callMessages[i].minGasLimit
            );
        }
    }

    function depositL1TokenToL2(
        address addressManager, address l1Token, address l2Token, address depositTo,
        uint256 amount, uint32 _minGasLimit )
        public
    {
        address l1Bridge = LibProject.getL1Bridge(addressManager);
        require(l1Bridge != address(0), "l1Bridge is ZeroAddress");

        require(IERC20(l1Token).balanceOf(msg.sender) >= amount, "l1Token balance is insufficient");
        require(IERC20(l1Token).allowance(msg.sender, address(this)) >= amount, "l1Token allowance is insufficient");

        uint256 allowance = IERC20(l1Token).allowance(address(this), l1Bridge);

        if (allowance < amount) {
            IERC20(l1Token).approve(l1Bridge, type(uint256).max);
        }

        IERC20(l1Token).safeTransferFrom(msg.sender, address(this), amount);

        L1BridgeI(l1Bridge).depositERC20To(
            l1Token,
            l2Token,
            depositTo,
            amount,
            _minGasLimit,
            abi.encode(l1Token, l2Token, depositTo, amount)
        );
    }

    function deposits(
        address addressManager, DepositMessage[] memory depositMessages)
        public nonZeroAddress(addressManager)
    {
        require(depositMessages.length != 0, 'zero depositMessages');

        uint256 len = depositMessages.length;
        for(uint256 i = 0; i < len ; i++){
            require(
                depositMessages[i].l1Token != address(0) &&
                depositMessages[i].l2Token != address(0) &&
                depositMessages[i].depositTos.length != 0, "invalid depositMessages");
        }

        for(uint256 i = 0; i < len ; i++){
            depositToMany(
                addressManager,
                depositMessages[i].l1Token,
                depositMessages[i].l2Token,
                depositMessages[i].depositTos );
        }
    }


    function depositToMany(
        address addressManager, address l1Token, address l2Token, DepositTo[] memory depositTos )
        public
    {
        address l1Bridge = LibProject.getL1Bridge(addressManager);
        require(l1Bridge != address(0), "l1Bridge is ZeroAddress");

        require(depositTos.length != 0, "zero depositTo");

        uint256 len = depositTos.length;
        uint256 sumAmount = 0;
        for(uint256 i = 0; i < len ; i++){
            require(
                depositTos[i].to != address(0) &&
                depositTos[i].amount != 0 && depositTos[i].minGasLimit != 0, "invalid depositTos");
            sumAmount += depositTos[i].amount;
        }

        require(IERC20(l1Token).balanceOf(msg.sender) >= sumAmount, "l1Token balance is insufficient");
        require(IERC20(l1Token).allowance(msg.sender, address(this)) >= sumAmount, "l1Token allowance is insufficient");

        uint256 allowance = IERC20(l1Token).allowance(address(this), l1Bridge);

        if (allowance < sumAmount) {
            IERC20(l1Token).approve(l1Bridge, type(uint256).max);
        }

        IERC20(l1Token).safeTransferFrom(msg.sender, address(this), sumAmount);
        for(uint256 i = 0; i < len ; i++){
            L1BridgeI(l1Bridge).depositERC20To(
                l1Token,
                l2Token,
                depositTos[i].to,
                depositTos[i].amount,
                depositTos[i].minGasLimit,
                abi.encode(l1Token, l2Token, depositTos[i].to, depositTos[i].amount)
            );
        }
    }

    /* ========== VIEW ========== */

    /* === ======= internal ========== */

}