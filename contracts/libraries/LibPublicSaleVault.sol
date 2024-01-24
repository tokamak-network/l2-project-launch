// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./TickMath.sol";
import "./OracleLibrary.sol";

import "hardhat/console.sol";

interface IIUniswapV3Factory {
    function getPool(address,address,uint24) external view returns (address);
}

interface IIUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);

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

}

/**
 * @title LibPublicSaleVault
 */
library LibPublicSaleVault {

    struct TokenTimeManage {
        uint256 deployTime;
        uint256 snapshot;
        uint256 whiteListStartTime;
        uint256 whiteListEndTime;
        uint256 round1StartTime;
        uint256 round1EndTime;
        uint256 round2StartTime;
        uint256 round2EndTime;
    }

    struct TokenSaleManage {
        uint256 set1rdTokenAmount;      //1round에 token을 판매할 양
        uint256 set2rdTokenAmount;      //2round에 token을 판매할 양
        uint256 saleTokenPrice;
        uint256 tonPrice;
        uint256 hardCap;                //softcap 수량 (판매 최저 하한선)
        uint256 changeTOS;              //TON -> TOS로 변경하는 %
        uint256 remainTON;              //TON -> TOS로 변경할 남은 TON
        int24 changeTick;             //TON -> TOS로 변경할때 허용되는 Tick 범위
        bool exchangeTOS;               //TON -> TOS로 변경하였는지 체크
        bool adminWithdraw;             //withdraw함수를 실행하였는지 체크
    }

    struct TokenSaleClaim {
        uint256 totalClaimCounts;       //총 클레임 수
        uint256 firstClaimPercent;      //초기 클레임 percents
        uint256 firstClaimTime;         //첫번째 claim 시간
        uint256 secondClaimTime;        //두번째 claim 시간
        uint256 claimInterval;          //클레임 간격 (epochtime)
    }

    struct TokenSaleInfo {
        uint256 total1rdSaleAmount;      //Token을 판매한 양
        uint256 total1rdTONAmount;       //Token판매로 받은 TON양
        uint256 totalUsers;             //전체 세일 참여자 (라운드1,라운드2 포함, 유니크)
        uint256 total1rdUsers;       //라운드 1 참여자
        uint256 total2rdUsers;       //라운드 2 참여자
        uint256 total2rdUsersClaim;  //라운드 2 참여자중 claim한사람
    }


    struct UserInfo1rd {
        bool join;
        uint8 tier;
        uint256 payAmount;
        uint256 saleAmount;
    }

    struct UserInfo2rd {
        bool join;
        uint256 depositAmount;
    }

    struct UserClaim {
        bool refund;
        uint256 claimAmount;
        uint256 refundAmount;
        uint256 latestClaimedRound;     //마지막 claim 라운드
    }

    function getQuoteAtTick(
        int24 tick,
        uint128 amountIn,
        address baseToken,
        address quoteToken
    ) public pure returns (uint256 amountOut) {
        return OracleLibrary.getQuoteAtTick(tick, amountIn, baseToken, quoteToken);
    }

    function getPoolAddress(address _wton, address _tos) public view returns(address) {
        // address factory = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        address factory = 0x755Ba335013C07CE35C9A2dd5746617Ac4c6c799;
        return IIUniswapV3Factory(factory).getPool(_wton, _tos, 3000);
    }

    function getTimeWeightTick(address _pool,uint32 _period) public view returns (int24) {
        return OracleLibrary.consult(_pool, _period);
    }

    function getTokenOrder(address _pool) public view returns(address,address,int24) {
        address token0 = IIUniswapV3Pool(_pool).token0();
        address token1 = IIUniswapV3Pool(_pool).token1();
        (,int24 nowtick,,,,,) = IIUniswapV3Pool(_pool).slot0();
        return (token0, token1,nowtick);
    }

    function getMiniTick(int24 tickSpacings) public pure returns (int24){
        return (TickMath.MIN_TICK / tickSpacings) * tickSpacings ;
    }

    function getMaxTick(int24 tickSpacings) public pure  returns (int24){
        return (TickMath.MAX_TICK / tickSpacings) * tickSpacings ;
    }

    function acceptMinTick(int24 _tick, int24 _tickSpacings, int24 _acceptTickInterval) public pure returns (int24) {
        int24 _minTick = getMiniTick(_tickSpacings);
        int24 _acceptMinTick = _tick - (_tickSpacings * _acceptTickInterval);

        if(_minTick < _acceptMinTick) return _acceptMinTick;
        else return _minTick;
    }

    function acceptMaxTick(int24 _tick, int24 _tickSpacings, int24 _acceptTickInterval) public pure returns (int24) {
        int24 _maxTick = getMaxTick(_tickSpacings);
        int24 _acceptMinTick = _tick + (_tickSpacings * _acceptTickInterval);

        if(_maxTick < _acceptMinTick) return _maxTick;
        else return _acceptMinTick;
    }
    
    function limitPrameters(
        uint256 amountIn,
        address _pool,
        address token0,
        address token1,
        int24 acceptTickCounts
    ) public view returns  (uint256 amountOutMinimum, uint256 priceLimit, uint160 sqrtPriceX96Limit) {
        IIUniswapV3Pool pool = IIUniswapV3Pool(_pool);
        (, int24 tick,,,,,) =  pool.slot0();
        int24 _tick = tick;
        if(token0 < token1) {
            _tick = tick - acceptTickCounts * 60;
            if(_tick < TickMath.MIN_TICK ) _tick =  TickMath.MIN_TICK ;
        } else {
            _tick = tick + acceptTickCounts * 60;
            if(_tick > TickMath.MAX_TICK ) _tick =  TickMath.MAX_TICK ;
        }
        address token1_ = token1;
        address token0_ = token0;
        return (
              getQuoteAtTick(
                _tick,
                uint128(amountIn),
                token0_,
                token1_
                ),
             getQuoteAtTick(
                _tick,
                uint128(10**27),
                token0_,
                token1_
             ),
             TickMath.getSqrtRatioAtTick(_tick)
        );
    }

    function _decodeApproveData(
        bytes memory data
    ) public pure returns (uint256 approveData) {
        assembly {
            approveData := mload(add(data, 0x20))
        }
    }
}