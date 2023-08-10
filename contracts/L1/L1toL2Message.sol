// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibProject } from "../libraries/LibProject.sol";
import "../libraries/SafeERC20.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import "../libraries/BytesLib.sol";

import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

import { OnApprove } from "./interfaces/OnApprove.sol";

// import "hardhat/console.sol";

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
 * @title L1toL2Message
 * @dev
 */
contract L1toL2Message is ERC165Storage{
    using SafeERC20 for IERC20;
    using BytesLib for bytes;
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

    modifier nonZero(uint256 value) {
        require(value != 0, "Z1");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Z2");
        _;
    }

    constructor() {
        _registerInterface(OnApprove(address(this)).onApprove.selector);
    }

    function onApprove(
        address sender,
        address spender,
        uint256 amount,
        bytes calldata data
    ) public returns (bool) {

        // data :
        // 20 bytes addressManager,
        // 20 bytes l1Token,
        // 20 bytes  l2Token,
        // 20 bytes depositAndCallTarget,
        // 4 bytes minGasLimitForDeposit
        // 4 bytes minGasLimitForCall
        // 나머지 bytes call

        require(data.length > 88, 'wrong data');
        // console.log("data.length %s", data.length);

        address addressManager = data.toAddress(0);
        address depositAndCallTarget = data.toAddress(60);
        uint256 amount1 = amount;

        address l1Token = data.toAddress(20);
        address l2Token = data.toAddress(40);
        uint32  minGasLimitForDeposit = data.toUint32(80);
        uint32  minGasLimitForCall = data.toUint32(84);
        bytes memory callData = data.slice(88, (data.length-88));

        // console.log("addressManager %s", addressManager);
        // console.log("l1Token %s", l1Token);
        // console.log("l2Token %s", l2Token);
        // console.log("depositAndCallTarget %s", depositAndCallTarget);
        // console.log("amount %s", amount);
        // console.log("minGasLimitForDeposit %s", minGasLimitForDeposit);
        // console.log("minGasLimitForCall %s", minGasLimitForCall);
        // console.logBytes(data.slice(88, data.length-1));

        address l1Messenger = LibProject.getL1CommunicationMessenger(addressManager);
        require(l1Messenger != address(0), "l1Messenger is ZeroAddress");

        _depositL1TokenToL2(
            sender,
            addressManager,
            l1Token,
            l2Token,
            depositAndCallTarget,
            amount1,
            minGasLimitForDeposit
        );

        L1CrossDomainMessengerI(l1Messenger).sendMessage(
                depositAndCallTarget,
                callData,
                minGasLimitForCall
            );

        return true;
    }

    function depositAndCall(
        address addressManager, address l1Token, address l2Token, address depositAndCallTarget,
        uint256 amount,
        uint32 minGasLimitForDeposit,
        uint32 minGasLimitForCall, bytes memory callData
    )
        external
    {
        address l1Messenger = LibProject.getL1CommunicationMessenger(addressManager);
        require(l1Messenger != address(0), "l1Messenger is ZeroAddress");

        _depositL1TokenToL2(msg.sender, addressManager, l1Token, l2Token, depositAndCallTarget, amount, minGasLimitForDeposit);

        L1CrossDomainMessengerI(l1Messenger).sendMessage(
                depositAndCallTarget,
                callData,
                minGasLimitForCall
            );
    }

    function depositsAndMessages(
        address addressManager,
        DepositMessage[] memory depositMassages,
        CallMessage[] memory callMessages
    )
        external
    {
        _deposits(msg.sender, addressManager, depositMassages);
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
        _depositL1TokenToL2(msg.sender, addressManager, l1Token, l2Token, depositTo, amount, _minGasLimit);
    }

    function deposits(
        address addressManager, DepositMessage[] memory depositMessages)
        public nonZeroAddress(addressManager)
    {
        _deposits(msg.sender, addressManager, depositMessages);
    }

    function depositToMany(
        address addressManager, address l1Token, address l2Token, DepositTo[] memory depositTos )
        public
    {
        _depositToMany(msg.sender, addressManager,  l1Token,  l2Token, depositTos);
    }


    function _depositL1TokenToL2(
        address sender,
        address addressManager, address l1Token, address l2Token, address depositTo,
        uint256 amount, uint32 _minGasLimit )
        internal
    {
        address l1Bridge = LibProject.getL1Bridge(addressManager);
        require(l1Bridge != address(0), "l1Bridge is ZeroAddress");

        require(IERC20(l1Token).balanceOf(sender) >= amount, "l1Token balance is insufficient");
        require(IERC20(l1Token).allowance(sender, address(this)) >= amount, "l1Token allowance is insufficient");

        uint256 allowance = IERC20(l1Token).allowance(address(this), l1Bridge);

        if (allowance < amount) {
            IERC20(l1Token).approve(l1Bridge, type(uint256).max);
        }

        IERC20(l1Token).safeTransferFrom(sender, address(this), amount);

        L1BridgeI(l1Bridge).depositERC20To(
            l1Token,
            l2Token,
            depositTo,
            amount,
            _minGasLimit,
            abi.encode(l1Token, l2Token, depositTo, amount)
        );
    }

    function _deposits(
        address sender, address addressManager, DepositMessage[] memory depositMessages)
        internal
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
            _depositToMany(
                sender,
                addressManager,
                depositMessages[i].l1Token,
                depositMessages[i].l2Token,
                depositMessages[i].depositTos );
        }
    }

    function _depositToMany(
        address sender, address addressManager, address l1Token, address l2Token, DepositTo[] memory depositTos )
        internal
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

        require(IERC20(l1Token).balanceOf(sender) >= sumAmount, "l1Token balance is insufficient");
        require(IERC20(l1Token).allowance(sender, address(this)) >= sumAmount, "l1Token allowance is insufficient");

        uint256 allowance = IERC20(l1Token).allowance(address(this), l1Bridge);

        if (allowance < sumAmount) {
            IERC20(l1Token).approve(l1Bridge, type(uint256).max);
        }

        IERC20(l1Token).safeTransferFrom(sender, address(this), sumAmount);
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

}