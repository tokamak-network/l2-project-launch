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

    // token - start airdrop time  , 토큰마다 에포크 시작 기준이 다르다..
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