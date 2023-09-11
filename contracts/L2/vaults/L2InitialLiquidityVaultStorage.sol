//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibInitialLiquidityVault } from "../../libraries/LibInitialLiquidityVault.sol";

contract L2InitialLiquidityVaultStorage {
    uint256 constant INITIAL_PRICE_DIV = 1e18;

    address public ton;  //  ton token
    address public tos;  //  tos token

    address public uniswapV3Factory;
    address public nonfungiblePositionManager;
    uint32 public TWAP_PERIOD;
    // int24 public tickIntervalMinimum;
    int24 public acceptTickChangeInterval;
    int24 public acceptSlippagePrice;
    int24 public tickSpacings ;

    // l2token - PoolInfo
    mapping(address => LibInitialLiquidityVault.PoolInfo) public poolInfo;

}
