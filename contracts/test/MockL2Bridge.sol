// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { L2StandardERC20 } from "../standards/L2StandardERC20.sol";

import { IL2StandardERC20 } from "../standards/IL2StandardERC20.sol";

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

import "hardhat/console.sol";

contract MockL2Bridge  is Ownable {

    address public l2Messenger;
    address public l1TokenBridge;

    modifier onlyL1TokenBridge() {
        require(
            msg.sender == l1TokenBridge,
            "not onlyL1TokenBridge"
        );

        // require(
        //     getCrossDomainMessenger().xDomainMessageSender() == _sourceDomainAccount,
        //     "OVM_XCHAIN: wrong sender of cross-domain message"
        // );

        _;
    }

    constructor() {
    }

    function setAddress(
        address _l2Messenger,
        address _l1TokenBridge
    ) external onlyOwner {
        l2Messenger = _l2Messenger;
        l1TokenBridge = _l1TokenBridge;
    }

    function mintToken2(address l2Token, address _to, uint256 _amount) external {

        IL2StandardERC20(l2Token).mint(_to, _amount);
    }

    // function withdraw(
    //     address _l2Token,
    //     uint256 _amount,
    //     uint32 _l1Gas,
    //     bytes calldata _data
    // ) external virtual {
    //     _initiateWithdrawal(_l2Token, msg.sender, msg.sender, _amount, _l1Gas, _data);
    // }

    // function withdrawTo(
    //     address _l2Token,
    //     address _to,
    //     uint256 _amount,
    //     uint32 _l1Gas,
    //     bytes calldata _data
    // ) external virtual {
    //     _initiateWithdrawal(_l2Token, msg.sender, _to, _amount, _l1Gas, _data);
    // }
    // /**
    //  * @dev Performs the logic for withdrawals by burning the token and informing
    //  *      the L1 token Gateway of the withdrawal.
    //  * @param _l2Token Address of L2 token where withdrawal is initiated.
    //  * @param _from Account to pull the withdrawal from on L2.
    //  * @param _to Account to give the withdrawal to on L1.
    //  * @param _amount Amount of the token to withdraw.
    //  * @param _l1Gas Unused, but included for potential forward compatibility considerations.
    //  * @param _data Optional data to forward to L1. This data is provided
    //  *        solely as a convenience for external contracts. Aside from enforcing a maximum
    //  *        length, these contracts provide no guarantees about its content.
    //  */
    // function _initiateWithdrawal(
    //     address _l2Token,
    //     address _from,
    //     address _to,
    //     uint256 _amount,
    //     uint32 _l1Gas,
    //     bytes calldata _data
    // ) internal {

    //     // When a withdrawal is initiated, we burn the withdrawer's funds to prevent subsequent L2
    //     // usage
    //     // slither-disable-next-line reentrancy-events
    //     IL2StandardERC20(_l2Token).burn(msg.sender, _amount);

    //     // Construct calldata for l1TokenBridge.finalizeERC20Withdrawal(_to, _amount)
    //     // slither-disable-next-line reentrancy-events
    //     address l1Token = IL2StandardERC20(_l2Token).l1Token();
    //     bytes memory message;

    //     if (_l2Token == Lib_PredeployAddresses.OVM_ETH) {
    //         message = abi.encodeWithSelector(
    //             IL1StandardBridge.finalizeETHWithdrawal.selector,
    //             _from,
    //             _to,
    //             _amount,
    //             _data
    //         );
    //     } else {
    //         message = abi.encodeWithSelector(
    //             IL1ERC20Bridge.finalizeERC20Withdrawal.selector,
    //             l1Token,
    //             _l2Token,
    //             _from,
    //             _to,
    //             _amount,
    //             _data
    //         );
    //     }

    //     // Send message up to L1 bridge
    //     // slither-disable-next-line reentrancy-events
    //     sendCrossDomainMessage(l1TokenBridge, _l1Gas, message);

    //     // slither-disable-next-line reentrancy-events
    //     emit WithdrawalInitiated(l1Token, _l2Token, msg.sender, _to, _amount, _data);
    // }

    // function finalizeDeposit(
    //     address _l1Token,
    //     address _l2Token,
    //     address _from,
    //     address _to,
    //     uint256 _amount,
    //     bytes calldata _data
    // ) external virtual onlyL1TokenBridge(l1TokenBridge) {
    //     // Check the target token is compliant and
    //     // verify the deposited token on L1 matches the L2 deposited token representation here
    //     if (
    //         // slither-disable-next-line reentrancy-events
    //         ERC165Checker.supportsInterface(_l2Token, 0x1d1d8b63) &&
    //         _l1Token == IL2StandardERC20(_l2Token).l1Token()
    //     ) {
    //         // When a deposit is finalized, we credit the account on L2 with the same amount of
    //         // tokens.
    //         // slither-disable-next-line reentrancy-events
    //         IL2StandardERC20(_l2Token).mint(_to, _amount);
    //         // slither-disable-next-line reentrancy-events
    //         emit DepositFinalized(_l1Token, _l2Token, _from, _to, _amount, _data);
    //     } else {
    //         // Either the L2 token which is being deposited-into disagrees about the correct address
    //         // of its L1 token, or does not support the correct interface.
    //         // This should only happen if there is a  malicious L2 token, or if a user somehow
    //         // specified the wrong L2 token address to deposit into.
    //         // In either case, we stop the process here and construct a withdrawal
    //         // message so that users can get their funds out in some cases.
    //         // There is no way to prevent malicious token contracts altogether, but this does limit
    //         // user error and mitigate some forms of malicious contract behavior.
    //         bytes memory message = abi.encodeWithSelector(
    //             IL1ERC20Bridge.finalizeERC20Withdrawal.selector,
    //             _l1Token,
    //             _l2Token,
    //             _to, // switched the _to and _from here to bounce back the deposit to the sender
    //             _from,
    //             _amount,
    //             _data
    //         );

    //         // Send message up to L1 bridge
    //         // slither-disable-next-line reentrancy-events
    //         sendCrossDomainMessage(l1TokenBridge, 0, message);
    //         // slither-disable-next-line reentrancy-events
    //         emit DepositFailed(_l1Token, _l2Token, _from, _to, _amount, _data);
    //     }
    // }
}
