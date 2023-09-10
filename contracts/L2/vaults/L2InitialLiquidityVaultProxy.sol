//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../proxy/Proxy.sol";
import { L2CustomVaultBaseStorage } from "./L2CustomVaultBaseStorage.sol";
import "./L2InitialLiquidityVaultStorage.sol";

contract L2InitialLiquidityVaultProxy is Proxy, L2CustomVaultBaseStorage, L2InitialLiquidityVaultStorage
{

}
