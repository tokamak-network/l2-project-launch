//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../libraries/SafeERC20.sol";

import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import { L2VestingFundVaultStorage } from "./L2VestingFundVaultStorage.sol";

import "hardhat/console.sol";

contract L2VestingFundVault is 
    ProxyStorage,
    AccessibleCommon, 
    L2VestingFundVaultStorage 
{
    using SafeERC20 for IERC20;

}