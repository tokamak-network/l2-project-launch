//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

// import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
// import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
// import { L2CustomVaultBaseStorage } from "./L2CustomVaultBaseStorage.sol";

import "./L2CustomVaultBase.sol";
import "./L2InitialLiquidityVaultStorage.sol";

import "../interfaces/INonfungiblePositionManager.sol";

import '../../libraries/LibProject.sol';
import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";

import "../libraries/TickMath.sol";
import "../libraries/OracleLibrary.sol";
import '../libraries/FullMath.sol';

interface IIUniswapV3Factory {
    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address pool);

    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool);
}

interface IIUniswapV3Pool {

    function initialize(uint160 sqrtPriceX96) external;
    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        );

    function token0() external view returns (address);
    function token1() external view returns (address);

}

contract L2InitialLiquidityVault is L2CustomVaultBase, L2InitialLiquidityVaultStorage
{
    using SafeERC20 for IERC20;
    /* ========== DEPENDENCIES ========== */

    modifier afterSetUniswap() {
        require(
            uniswapV3Factory != address(0)
            && nonfungiblePositionManager != address(0)
            && tos != address(0)
            ,
            "Vault: before setUniswap");
        _;
    }

    modifier readyToCreatePool(address l2Token) {
        require(poolInfo[l2Token].boolReadyToCreatePool, "Vault: not ready to CreatePool");
        _;
    }

    modifier beforeSetReadyToCreatePool(address l2Token) {
        require(!poolInfo[l2Token].boolReadyToCreatePool, "Vault: already ready to CreatePool");
        _;
    }

    event SetUniswapInfo(address _factory, address _npm, address _ton, address _tos);
    event SetStartTime(address l2Token, uint32 startTime);
    event SetPoolInitialized(address l2Token, address pool, uint160 inSqrtPriceX96);
    event SetCreatedPool(address l2Token, address pool);
    event InitializedInitialLiquidityVault(
        address l2Token,
        uint256 totalAllocatedAmount,
        uint256 initialTosPrice,
        uint256 initialTokenPrice,
        uint32 startTime,
        uint160 initSqrtPriceX96,
        uint24 fee
    );

    event IncreasedLiquidityInVault(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);

    event InitialMintedInVault(
        address l2Token,
        address pool,
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */
    function setUniswapInfo(address _poolfactory, address _npm, address _ton, address _tos)
        external
        onlyOwner nonZeroAddress(_poolfactory) nonZeroAddress(_npm) nonZeroAddress(_ton) nonZeroAddress(_tos)
    {
        require(_poolfactory != uniswapV3Factory ||  _npm != nonfungiblePositionManager ||
             ton != _ton || tos != _tos, "same");

        uniswapV3Factory = _poolfactory;
        nonfungiblePositionManager = _npm;
        ton = _ton;
        tos = _tos;

        emit SetUniswapInfo(_poolfactory, _npm, _ton, _tos);
    }

    function setAcceptTickChangeInterval(int24 _interval) external onlyOwner
    {
        require(_interval > 0, "zero");
        require(acceptTickChangeInterval != _interval, "same");
        acceptTickChangeInterval = _interval;
    }

    function setAcceptSlippagePrice(int24 _value) external onlyOwner
    {
        require(_value > 0, "zero");
        require(acceptSlippagePrice != _value, "same");
        acceptSlippagePrice = _value;
    }

    function setTWAP_PERIOD(uint32 value) external onlyOwner
    {
        require(value > 0, "zero");
        require(TWAP_PERIOD != value, "same");
        TWAP_PERIOD = value;
    }


    /* ========== only L2ProjectManager ========== */
    function initialize(
        address l2Token,
        LibProject.InitalParameterInitialLiquidityVault memory params
    )
        external onlyL2ProjectManagerOrVaultAdmin(l2Token) afterSetUniswap
    {
        console.log('initialize in l2Token %s', l2Token);

        require(poolInfo[l2Token].totalAllocatedAmount == 0, "already initialized");
        require(params.totalAllocatedAmount != 0 && params.tosPrice != 0 && params.tokenPrice != 0 && params.initSqrtPrice != 0 && params.fee != 0,
            "zero totalAllocatedAmount or tosPrice or tokenPrice or initSqrtPriceX96 or startTime");
        require(params.startTime > uint32(block.timestamp), "StartTime has passed");

        console.log('initialize iparams.totalAllocatedAmount %s', params.totalAllocatedAmount);
        IERC20(l2Token).safeTransferFrom(l2ProjectManager, address(this), params.totalAllocatedAmount);
        console.log('initialize safeTransferFrom ');

        LibInitialLiquidityVault.PoolInfo storage info = poolInfo[l2Token];
        info.totalAllocatedAmount = params.totalAllocatedAmount;
        info.initialTosPrice = params.tosPrice;
        info.initialTokenPrice = params.tokenPrice;
        info.initSqrtPriceX96 = uint160(params.initSqrtPrice);
        info.startTime = params.startTime;
        info.fee = params.fee;

        emit InitializedInitialLiquidityVault(
            l2Token, params.totalAllocatedAmount, params.tosPrice, params.tokenPrice, params.startTime, uint160(params.initSqrtPrice), params.fee);
    }

    /* ========== only VaultAdmin Of Token ========== */
    function setStartTime(address l2Token, uint32 _startTime)
        public onlyVaultAdminOfToken(l2Token)
    {
        LibInitialLiquidityVault.PoolInfo storage info = poolInfo[l2Token];
        require(block.timestamp < info.startTime, "StartTime has passed");
        require(info.startTime != _startTime, "same StartTime");
        info.startTime = _startTime;
        emit SetStartTime(l2Token, _startTime);
    }

    /* ========== Anyone can  ========== */

    function setCreatePool(address l2Token) external beforeSetReadyToCreatePool(l2Token) ifFree
    {
        LibInitialLiquidityVault.PoolInfo storage info = poolInfo[l2Token];
        require(info.startTime > 0 && info.startTime < uint32(block.timestamp), "StartTime has not passed.");
        require(info.pool == address(0), "already created");
        require(info.initSqrtPriceX96 > 0, "zero initSqrtPriceX96");
        address pool = IIUniswapV3Factory(uniswapV3Factory).getPool(tos, l2Token, info.fee);

        if(pool == address(0)){
            address _pool = IIUniswapV3Factory(uniswapV3Factory).createPool(tos, l2Token, info.fee);
            require(_pool != address(0), "createPool fail");
            pool = _pool;
        }

        info.pool = pool;
        info.boolReadyToCreatePool = true;

        (uint160 sqrtPriceX96,,,,,,) =  IIUniswapV3Pool(pool).slot0();
        if(sqrtPriceX96 == 0){
            IIUniswapV3Pool(pool).initialize(info.initSqrtPriceX96);
            emit SetPoolInitialized(l2Token, pool, info.initSqrtPriceX96);
        }
        emit SetCreatedPool(l2Token, pool);

        (uint160 _sqrtPriceX96,,,,,,) =  IIUniswapV3Pool(pool).slot0();
        require(_sqrtPriceX96 != 0, 'zero _sqrtPriceX96');

    }

    function mint(address l2Token, uint256 tosAmount)
        external readyToCreatePool(l2Token) nonZero(tosAmount) ifFree
    {
        uint256 tosBalance =  IERC20(tos).balanceOf(address(this));
        uint256 tokenBalance =  IERC20(l2Token).balanceOf(address(this));
        require(tosBalance > 1 ether && tokenBalance > 1 ether, "balance is insufficient");
        require(tosAmount <= tosBalance, "toBalance is insufficient");

        if (acceptTickChangeInterval == 0) acceptTickChangeInterval = 8;
        if (acceptSlippagePrice == 0) acceptSlippagePrice = 10; // based 100
        if (TWAP_PERIOD == 0) TWAP_PERIOD = 120;

        LibInitialLiquidityVault.PoolInfo memory info = poolInfo[l2Token];
        (uint160 sqrtPriceX96, int24 tick,,,,,) =  IIUniswapV3Pool(info.pool).slot0();
        require(sqrtPriceX96 > 0, "pool is not initialized");

        //if (lpToken > 0)
        {
            int24 timeWeightedAverageTick = OracleLibrary.consult(info.pool, TWAP_PERIOD);
            require(
                acceptMinTick(timeWeightedAverageTick, getTickSpacing(info.fee)) <= tick
                && tick < acceptMaxTick(timeWeightedAverageTick, getTickSpacing(info.fee)),
                "It's not allowed changed tick range."
            );
        }

        uint256 amount0Desired = 0;
        uint256 amount1Desired = 0;
        address token0 = IIUniswapV3Pool(info.pool).token0();

        if(token0 != tos){
            amount0Desired = getQuoteAtTick(
                tick,
                uint128(tosAmount),
                tos,
                l2Token
                );
            amount1Desired = tosAmount;
            require(amount0Desired <= tokenBalance, "tokenBalance is insufficient");
            checkBalance(l2Token, amount1Desired, amount0Desired);
        } else {
            amount0Desired = tosAmount;
            amount1Desired = getQuoteAtTick(
                tick,
                uint128(tosAmount),
                tos,
                l2Token
                );

            require(amount1Desired <= tokenBalance, "tokenBalance is insufficient");
            checkBalance(l2Token, amount0Desired, amount1Desired);
        }

        uint256 amount0Min = amount0Desired * (100 - uint256(int256(acceptSlippagePrice))) / 100;
        uint256 amount1Min = amount1Desired * (100 - uint256(int256(acceptSlippagePrice))) / 100;

        if(poolInfo[l2Token].lpToken == 0)  initialMint(l2Token, amount0Desired, amount1Desired, amount0Min, amount1Min);
        else increaseLiquidity(l2Token, amount0Desired, amount1Desired, amount0Min, amount1Min);
    }


    /* ========== VIEW ========== */

    function getTickSpacing(uint24 _fee) public pure returns (int24 tickSpacings)
    {
        if(_fee == 100) tickSpacings = 2;
        else if(_fee == 500) tickSpacings = 10;
        else if(_fee == 3000) tickSpacings = 60;
        else if(_fee == 10000) tickSpacings = 200;
    }

    function acceptMinTick(int24 _tick, int24 _tickSpacings) public view returns (int24)
    {
        int24 _minTick = getMiniTick(_tickSpacings);
        int24 _acceptMinTick = _tick - (_tickSpacings * int24(uint24(acceptTickChangeInterval)));

        if(_minTick < _acceptMinTick) return _acceptMinTick;
        else return _minTick;
    }

    function acceptMaxTick(int24 _tick, int24 _tickSpacings) public view returns (int24)
    {
        int24 _maxTick = getMaxTick(_tickSpacings);
        int24 _acceptMinTick = _tick + (_tickSpacings * int24(uint24(acceptTickChangeInterval)));

        if(_maxTick < _acceptMinTick) return _maxTick;
        else return _acceptMinTick;
    }

    function getMiniTick(int24 tickSpacings) public pure returns (int24){
           return (TickMath.MIN_TICK / tickSpacings) * tickSpacings ;
    }

    function getMaxTick(int24 tickSpacings) public pure  returns (int24){
           return (TickMath.MAX_TICK / tickSpacings) * tickSpacings ;
    }

    function getQuoteAtTick(
        int24 tick,
        uint128 amountIn,
        address baseToken,
        address quoteToken
    ) public pure returns (uint256 amountOut) {
        return OracleLibrary.getQuoteAtTick(tick, amountIn, baseToken, quoteToken);
    }

    /* === ======= internal ========== */

    function increaseLiquidity(address l2Token, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min) internal
    {
        LibInitialLiquidityVault.PoolInfo storage info = poolInfo[l2Token];
        require(info.lpToken > 0, "It is not minted yet");

        (uint128 liquidity, uint256 amount0, uint256 amount1) = INonfungiblePositionManager(nonfungiblePositionManager).increaseLiquidity(
            INonfungiblePositionManager.IncreaseLiquidityParams(
                info.lpToken, amount0Desired, amount1Desired, amount0Min, amount1Min, block.timestamp));

        emit IncreasedLiquidityInVault(info.lpToken, liquidity, amount0, amount1);
    }


    function initialMint(address l2Token, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min) internal
    {
        LibInitialLiquidityVault.PoolInfo storage info = poolInfo[l2Token];

        require(info.lpToken == 0, "already minted");
        int24 tickLower = (TickMath.MIN_TICK / getTickSpacing(info.fee)) * getTickSpacing(info.fee) ;
        int24 tickUpper = (TickMath.MAX_TICK / getTickSpacing(info.fee)) * getTickSpacing(info.fee) ;

        (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        ) = INonfungiblePositionManager(nonfungiblePositionManager).mint(INonfungiblePositionManager.MintParams(
                IIUniswapV3Pool(info.pool).token0(),
                IIUniswapV3Pool(info.pool).token1(),
                info.fee, tickLower, tickUpper,
                amount0Desired, amount1Desired, amount0Min, amount1Min,
                address(this), block.timestamp
            )
        );

        require(tokenId > 0, "zero tokenId");

        info.lpToken = tokenId;

        emit InitialMintedInVault(l2Token, info.pool, tokenId, liquidity, amount0, amount1);
    }


    function checkBalance(address l2Token, uint256 tosBalance, uint256 tokenBalance) internal  {
        require(IERC20(tos).balanceOf(address(this)) >= tosBalance, "tos is insufficient.");
        require(IERC20(l2Token).balanceOf(address(this)) >= tokenBalance, "token is insufficient.");
         if(tosBalance > IERC20(tos).allowance(address(this), nonfungiblePositionManager) ) {
                require(IERC20(tos).approve(nonfungiblePositionManager, IERC20(tos).totalSupply()),"TOS approve fail");
        }

        if(tokenBalance > IERC20(l2Token).allowance(address(this), nonfungiblePositionManager) ) {
            require(IERC20(l2Token).approve(nonfungiblePositionManager, IERC20(l2Token).totalSupply()),"token approve fail");
        }
    }

    function viewVaultInfo(address l2Token) external view returns(LibInitialLiquidityVault.PoolInfo memory){

        return poolInfo[l2Token];

    }

}
