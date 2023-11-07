// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../libraries/LibDividend.sol";

/**
 * @title L2DividendPoolForStosStorage
 * @dev
 */
contract L2DividendPoolForStosStorage {

    address public universalStos;
    uint256 public epochUnit;

    // token - start airdrop time  , it must be set at thursdat at 9 o'clock
    mapping(address => uint256) public genesis;

    // token - Distribution
    mapping(address => LibDividend.Distribution) public distributions;

    // token - epoch number - distributed amount
    mapping (address => mapping(uint256 => uint256)) tokensPerWeek;

    // token - account - start epoch number
    mapping (address => mapping (address => uint256)) claimStartWeeklyEpoch;

    // tokens
    address[] public distributedTokens;
    bool internal free;
}