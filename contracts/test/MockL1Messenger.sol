// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract MockL1Messenger  {

    mapping(bytes32 => bool) public successfulMessages;

    uint256 public messageNonce;

    event SentMessage(
        address indexed target,
        address sender,
        bytes message,
        uint256 messageNonce,
        uint256 gasLimit
    );

    constructor() {
    }

    function setSuccessfulMessages(bytes32 _hashMessages, bool _bool) external {
        successfulMessages[_hashMessages] = _bool;
    }

    function sendMessage(
        address _target,
        bytes memory _message,
        uint32 _gasLimit
    ) public {

        // slither-disable-next-line reentrancy-events
        emit SentMessage(_target, msg.sender, _message, ++messageNonce, _gasLimit);
    }

}
