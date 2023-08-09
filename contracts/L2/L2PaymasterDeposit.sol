// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IERC20} from "../interfaces/IERC20.sol";
import "../libraries/SafeERC20.sol";
// import "hardhat/console.sol";

interface IPaymaster {
    function addDepositFor(address token, address account, uint256 amount) external;
}

contract L2PaymasterDeposit {
    using SafeERC20 for IERC20;

    address public paymaster;
    event AddedDepositFor(address indexed l1Token, address indexed account, uint256 amount);
    event InsufficentBalance(address indexed l1Token, address indexed account, uint256 amount);

    constructor(address _paymaster) {
       paymaster = _paymaster;
    }

    function addDepositFor(
        address token,
        address account,
        uint256 amount)
        external
    {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amount) {
            emit InsufficentBalance(token, account, amount);
        } else {
            uint256 allowance = IERC20(token).allowance(address(this), paymaster);
            if (allowance < amount) {
                IERC20(token).approve(paymaster, type(uint256).max);
            }

            IPaymaster(paymaster).addDepositFor(
                token, account, amount
            );
            emit AddedDepositFor(token, account, amount);
        }
    }

}