// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../libraries/SafeERC20.sol";

import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import { L2PublicSaleVaultStorage } from "./L2PublicSaleVaultStorage.sol";
import "../../libraries/LibPublicSaleVault.sol";

import "../interfaces/ISwapRouter.sol";

import "hardhat/console.sol";

interface IILockTOS {
    function balanceOfAt(address _addr, uint256 _timestamp)
        external
        view
        returns (uint256 balance);
}

interface IIVestingPublicFundAction {
    function funding(address l2token) external payable;
}

interface IIL2ERC20Bridge {
    function withdrawTo(
        address _l2Token,
        address _to,
        uint256 _amount,
        uint32 _l1Gas,
        bytes calldata _data
    ) external;
}

contract L2PublicSaleVault is 
    ProxyStorage,
    AccessibleCommon, 
    L2PublicSaleVaultStorage 
{
    using SafeERC20 for IERC20;

    /* ========== USING BUYER ========== */
    function addWhiteList(
        address _l2token
    ) 
        external 
    {
        LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];
        require(
            block.timestamp >= timeInfos.whiteListStartTime,
            "not whitelistTime"
        );
        require(
            block.timestamp < timeInfos.whiteListEndTime,
            "end whitelistTime"
        );
        uint8 tier = calculTier(_l2token,msg.sender);
        //if tier 0 is don't have sTOS
        require(tier >= 1, "need to more sTOS");
        // LibPublicSale.UserInfoEx storage userEx = usersEx[msg.sender];
        LibPublicSaleVault.UserInfo1rd storage user1rds = user1rd[_l2token][msg.sender];
        
        require(user1rds.join != true, "already attended");

        whitelists[_l2token].push(msg.sender);

        user1rds.join = true;
        user1rds.tier = tier;

        tiersWhiteList[_l2token][tier] = tiersWhiteList[_l2token][tier]+(1);

        if (tier == 4) {
            tiersCalculAccount[_l2token][4] = tiersCalculAccount[_l2token][4]+(1);
            tiersCalculAccount[_l2token][3] = tiersCalculAccount[_l2token][3]+(1);
            tiersCalculAccount[_l2token][2] = tiersCalculAccount[_l2token][2]+(1);
            tiersCalculAccount[_l2token][1] = tiersCalculAccount[_l2token][1]+(1);
        } else if (tier == 3) {
            tiersCalculAccount[_l2token][3] = tiersCalculAccount[_l2token][3]+(1);
            tiersCalculAccount[_l2token][2] = tiersCalculAccount[_l2token][2]+(1);
            tiersCalculAccount[_l2token][1] = tiersCalculAccount[_l2token][1]+(1);
        } else if (tier == 2) {
            tiersCalculAccount[_l2token][2] = tiersCalculAccount[_l2token][2]+(1);
            tiersCalculAccount[_l2token][1] = tiersCalculAccount[_l2token][1]+(1);
        } else if (tier == 1) {
            tiersCalculAccount[_l2token][1] = tiersCalculAccount[_l2token][1]+(1);
        }
        

        emit AddedWhiteList(_l2token, msg.sender, tier);
    }

    function round1Sale(
        address _l2token
    )
        public
        payable
    {
        LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];

        require(
            block.timestamp >= timeInfos.round1StartTime,
            "not round1SaleTime"
        );
        require(
            block.timestamp < timeInfos.round1EndTime,
            "end round1SaleTime"
        );
        LibPublicSaleVault.UserInfo1rd storage user1rds = user1rd[_l2token][msg.sender];
        require(user1rds.join == true, "no whitelist");
        uint8 tier = calculTier(_l2token, msg.sender);
        uint256 tokenSaleAmount = calculSaleToken(_l2token, msg.value);
        uint256 salePossible = calcul1RoundAmount(_l2token, msg.sender);

        require(
            salePossible >= user1rds.saleAmount+(tokenSaleAmount),
            "don't over buy"
        );

        LibPublicSaleVault.TokenSaleInfo storage saleInfos = saleInfo[_l2token];
        if (user1rds.payAmount == 0) {
            saleInfos.total1rdUsers = saleInfos.total1rdUsers+(1);
            saleInfos.totalUsers = saleInfos.totalUsers+(1);
            tiers1stAccount[_l2token][tier] = tiers1stAccount[_l2token][tier]+(1);
        }

        user1rds.payAmount = user1rds.payAmount+(msg.value);
        user1rds.saleAmount = user1rds.saleAmount+(tokenSaleAmount);

        saleInfos.total1rdTONAmount = saleInfos.total1rdTONAmount+(msg.value);
        saleInfos.total1rdSaleAmount = saleInfos.total1rdSaleAmount+(tokenSaleAmount);

        // console.log("msg.sender.balance :", msg.sender.balance);
        // console.log("msg.sender :", msg.sender);
        // console.log("msg.value :", msg.value);

        // require(msg.sender.balance >= msg.value, "Don't have TON");
        // payable(address(this)).transfer(msg.value);
        payable(address(this)).call{value: msg.value};

        emit ExclusiveSaled(_l2token, msg.sender, msg.value);
    }

    function round2Sale(
        address _l2token
    )   
        public
        payable
    {
        LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];
        require(
            block.timestamp >= timeInfos.round2StartTime,
            "not depositTime"
        );
        require(
            block.timestamp < timeInfos.round2EndTime,
            "end depositTime"
        );

        LibPublicSaleVault.UserInfo2rd storage user2rds = user2rd[_l2token][msg.sender];
        LibPublicSaleVault.TokenSaleInfo storage saleInfos = saleInfo[_l2token];

        if (!user2rds.join) {
            depositors[_l2token].push(msg.sender);
            user2rds.join = true;

            saleInfos.total2rdUsers = saleInfos.total2rdUsers+(1);
            LibPublicSaleVault.UserInfo1rd memory user1rds = user1rd[_l2token][msg.sender];
            if (user1rds.payAmount == 0) saleInfos.totalUsers = saleInfos.totalUsers+(1);
        }

        user2rds.depositAmount = user2rds.depositAmount+(msg.value);
        totalDepositAmount[_l2token] = totalDepositAmount[_l2token] + (msg.value);

        // console.log("msg.sender.balance :", msg.sender.balance);
        // console.log("msg.sender :", msg.sender);
        // console.log("msg.value :", msg.value);

        // require(msg.sender.balance >= msg.value, "Don't have TON");
        payable(address(this)).call{value: msg.value};

        emit Deposited(_l2token, msg.sender, msg.value);
    }

    function claim(
        address _l2token
    ) 
        external 
    {
        // console.log("address(this).balance :", address(this).balance);
        LibPublicSaleVault.TokenSaleClaim memory claimInfos = claimInfo[_l2token];
        require(
            block.timestamp >= claimInfos.firstClaimTime,
            "not claimTime"
        );
        LibPublicSaleVault.UserInfo2rd storage user2rds = user2rd[_l2token][msg.sender];
        LibPublicSaleVault.UserClaim storage userClaims = userClaim[_l2token][msg.sender];
        uint256 hardcapcut = hardcapCalcul(_l2token);
        if (hardcapcut == 0) {
            //hardcap을 넘지 못하였을 때
            require(userClaims.refund != true, "already getRefund");
            LibPublicSaleVault.UserInfo1rd storage user1rds = user1rd[_l2token][msg.sender];
            uint256 refundTON = user1rds.payAmount+(user2rds.depositAmount);
            userClaims.refund = true;
            userClaims.refundAmount = refundTON;
            payable(msg.sender).call{value: refundTON};
            // IERC20(ton).safeTransfer(msg.sender, refundTON);

            emit Refunded(_l2token, msg.sender, refundTON);
        } else {
            //hardcap을 넘었을때
            (uint256 reward, uint256 realSaleAmount, uint256 refundAmount) = calculClaimAmount(_l2token, msg.sender, 0);
            require(
                realSaleAmount > 0,
                "no purchase amount"
            );
            require(reward > 0, "no reward");
            require(
                (realSaleAmount-userClaims.claimAmount) >= reward,
                "already getAllreward"
            );
            require(
                IERC20(_l2token).balanceOf(address(this)) >= reward,
                "dont have saleToken"
            );

            userClaims.claimAmount = userClaims.claimAmount+reward;

            IERC20(_l2token).safeTransfer(msg.sender, reward);
            LibPublicSaleVault.TokenSaleInfo storage saleInfos = saleInfo[_l2token];

            if (!userClaims.refund && user2rds.join) {
                saleInfos.total2rdUsersClaim = saleInfos.total2rdUsersClaim+(1);
                userClaims.refund = true;
            }

            if (refundAmount > 0 && userClaims.refundAmount == 0){
                // require(refundAmount <= IERC20(ton).balanceOf(address(this)), "dont have refund ton");
                require(refundAmount <= address(this).balance, "dont have refund ton");
                userClaims.refundAmount = refundAmount;
                // IERC20(ton).safeTransfer(msg.sender, refundAmount);
                payable(msg.sender).call{value: refundAmount};

                emit Refunded(_l2token, msg.sender, refundAmount);
            }

            emit Claimed(_l2token, msg.sender, reward);
        }
    }

    function depositWithdraw(
        address _l2token
    ) 
        external
        payable
    {
        LibPublicSaleVault.TokenSaleManage storage manageInfos = manageInfo[_l2token];
        require(manageInfos.adminWithdraw != true && manageInfos.exchangeTOS == true, "need the exchangeWTONtoTOS");

        LibPublicSaleVault.TokenSaleInfo storage saleInfos = saleInfo[_l2token];
        uint256 liquidityTON = hardcapCalcul(_l2token);
        uint256 getAmount = saleInfos.total1rdTONAmount+(totalOpenPurchasedAmount(_l2token))-(liquidityTON);
        
        require(getAmount <= address(this).balance, "haven't token");        

        manageInfos.adminWithdraw = true;
        uint256 burnAmount = manageInfos.set1rdTokenAmount+(manageInfos.set2rdTokenAmount)-(totalOpenSaleAmount(_l2token))-(saleInfos.total1rdSaleAmount);
        console.log(burnAmount);
        if (burnAmount != 0) {
            IIL2ERC20Bridge(l2Bridge).withdrawTo(_l2token, l1burnVault, burnAmount, 0, '0x');
        }
        
        // IERC20(ton).approve(address(vestingFund), getAmount + 10 ether);
        IIVestingPublicFundAction(vestingFund).funding{value: getAmount}(_l2token);
        

        emit DepositWithdrawal(_l2token, msg.sender, getAmount, liquidityTON);
    }

    //amountIn은 TON단위
    function exchangeWTONtoTOS(
        address _l2token,
        uint256 amountIn
    ) 
        external
        payable
        nonZero(amountIn)
    {
        LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];
        LibPublicSaleVault.TokenSaleManage storage manageInfos = manageInfo[_l2token];
        require(block.timestamp > timeInfos.round2EndTime, "need to end the depositTime");

        uint256 liquidityTON = hardcapCalcul(_l2token);
        require(liquidityTON > 0, "don't pass the hardCap");
        if (manageInfos.exchangeTOS == false) {
            require(liquidityTON >= amountIn, "amountIn over");
            manageInfos.remainTON = liquidityTON;
            manageInfos.exchangeTOS = true;
        } else {
            require(manageInfos.remainTON >= amountIn, "amountIn over");
        }

        address poolAddress = LibPublicSaleVault.getPoolAddress(ton,tos);
        // console.log("WETH-TOS PoolAddress :",poolAddress);

        (uint160 sqrtPriceX96, int24 tick,,,,,) =  IIUniswapV3Pool(poolAddress).slot0();
        require(sqrtPriceX96 > 0, "pool not initial");

        int24 timeWeightedAverageTick = OracleLibrary.consult(poolAddress, 120);
        require(
            tick < LibPublicSaleVault.acceptMaxTick(timeWeightedAverageTick, 60, 2),
            "over changed tick range."
        );

        (uint256 amountOutMinimum, , uint160 sqrtPriceLimitX96)
            = LibPublicSaleVault.limitPrameters(amountIn, poolAddress, ton, tos, manageInfos.changeTick);

        (,bytes memory result) = address(quoter).call(
            abi.encodeWithSignature(
                "quoteExactInputSingle(address,address,uint24,uint256,uint160)", 
                ton,tos,poolFee,amountIn,0
            )
        );
        uint256 amountOutMinimum2 = parseRevertReason(result);
        amountOutMinimum2 = amountOutMinimum2 * 995 / 1000; //slippage 0.5% apply

        //quoter 값이 더 크다면 quoter값이 minimum값으로 사용됨
        //quoter 값이 더 작으면 priceImpact가 더크게 작용하니 거래는 실패해야함

        // console.log("amountOutMinimum :", amountOutMinimum);
        // console.log("amountOutMinimum2 ", amountOutMinimum2);

        require(amountOutMinimum2 >= amountOutMinimum, "priceImpact over");
        address l2token = _l2token;
        uint256 _amountIn = amountIn;
        manageInfos.remainTON = manageInfos.remainTON - _amountIn;
        
        _WETH.deposit{value: _amountIn}();
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: ton,
                tokenOut: tos,
                fee: poolFee,
                recipient: liquidityVault,
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: amountOutMinimum2,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            });
        uint256 amountOut = ISwapRouter(uniswapRouter).exactInputSingle(params);
        // (bool sucess, bytes memory data) = payable(uniswapRouter).call{value: _amountIn}(result);

        emit ExchangeSwap(l2token, msg.sender, _amountIn ,amountOut);
    }


    /* ========== INTERNAL ========== */

    // function _calculTONTransferAmount(
    //     address _l2token,
    //     address _sender,
    //     uint256 _amount
    // )
    //     internal
    //     nonZeroAddress(_l2token)
    //     nonZeroAddress(_sender)
    //     nonZero(_amount)
    // {
    //     LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];
    //     uint256 tonAllowance = IERC20(ton).allowance(_sender, address(this));
    //     uint256 tonBalance = IERC20(ton).balanceOf(_sender);
    //     // uint256 tonBalance = _sender.balance;

    //     require(tonAllowance >= _amount && tonBalance >= _amount, "ton exceeds allowance");
    //     IERC20(ton).safeTransferFrom(_sender, address(this), _amount);
    //     payable(address(this)).call{value: _amount}("");

    //     if (block.timestamp < timeInfos.round1EndTime) {
    //         emit ExclusiveSaled(_l2token, _sender, _amount);
    //     } else {
    //         emit Deposited(_l2token, _sender, _amount);
    //     }
    // }

    /* ========== PRIVATE ========== */

   function parseRevertReason(bytes memory reason) private pure returns (uint256) {
        if (reason.length != 32) {
            if (reason.length < 68) revert('Unexpected error');
            assembly {
                reason := add(reason, 0x04)
            }
            revert(abi.decode(reason, (string)));
        }
        return abi.decode(reason, (uint256));
    }

    /* ========== VIEW ========== */

    function hardcapCalcul(
        address _l2token
    ) 
        public 
        view 
        returns (uint256)
    {
        LibPublicSaleVault.TokenSaleInfo memory saleInfos = saleInfo[_l2token];
        LibPublicSaleVault.TokenSaleManage memory manageInfos = manageInfo[_l2token];
        uint256 totalPurchaseTONamount = saleInfos.total1rdTONAmount+(totalOpenPurchasedAmount(_l2token));
        uint256 calculAmount;
        if (totalPurchaseTONamount >= manageInfos.hardCap) {
            return calculAmount = totalPurchaseTONamount*(manageInfos.changeTOS)/(100);
        } else {
            return 0;
        }
    }

    function calculSaleToken(
        address _l2token,
        uint256 _amount
    )
        public
        view
        returns (uint256)
    {
        LibPublicSaleVault.TokenSaleManage memory manageInfos = manageInfo[_l2token];
        uint256 tokenSaleAmount =
            _amount*(manageInfos.tonPrice)/(manageInfos.saleTokenPrice);
        return tokenSaleAmount;
    }

    function calculPayToken(
        address _l2token,
        uint256 _amount
    )
        public
        view
        returns (uint256)
    {
        LibPublicSaleVault.TokenSaleManage memory manageInfos = manageInfo[_l2token];
        uint256 tokenPayAmount = _amount*(manageInfos.saleTokenPrice)/(manageInfos.tonPrice);
        return tokenPayAmount;
    }

    function calculTier(
        address _l2token,
        address _account 
    )
        public
        view
        nonZeroAddress(address(lockTOS))
        nonZero(tiers[_l2token][1])
        nonZero(tiers[_l2token][2])
        nonZero(tiers[_l2token][3])
        nonZero(tiers[_l2token][4])
        returns (uint8)
    {
        LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];
        uint256 sTOSBalance = IILockTOS(lockTOS).balanceOfAt(_account, timeInfos.snapshot);      //IILockTOS interface 추가 필요
        uint8 tier;
        if (sTOSBalance >= tiers[_l2token][1] && sTOSBalance < tiers[_l2token][2]) {
            tier = 1;
        } else if (sTOSBalance >= tiers[_l2token][2] && sTOSBalance < tiers[_l2token][3]) {
            tier = 2;
        } else if (sTOSBalance >= tiers[_l2token][3] && sTOSBalance < tiers[_l2token][4]) {
            tier = 3;
        } else if (sTOSBalance >= tiers[_l2token][4]) {
            tier = 4;
        } else if (sTOSBalance < tiers[_l2token][1]) {
            tier = 0;
        }
        return tier;
    }

    function calculTierAmount(
        address _l2token,
        address _account,
        uint8 tier 
    )
        public
        view
        returns (uint256)
    {
        LibPublicSaleVault.UserInfo1rd memory user1rds = user1rd[_l2token][_account];
        LibPublicSaleVault.TokenSaleManage memory manageInfos = manageInfo[_l2token];
        uint256 salePossible;
        // uint8 tier = calculTier(_l2token,_account);

        if (user1rds.join == true && tier > 0) {
            salePossible =
                manageInfos.set1rdTokenAmount
                    *(tiersPercents[_l2token][tier])
                    /(tiersCalculAccount[_l2token][tier])
                    /(10000);
            return salePossible;
        } else if (tier > 0) {
            uint256 tierAccount = tiersCalculAccount[_l2token][tier]+(1);
            salePossible =
                manageInfos.set1rdTokenAmount
                    *(tiersPercents[_l2token][tier])
                    /(tierAccount)
                    /(10000);
            return salePossible;
        } else {
            return 0;
        }
    }

    function calcul1RoundAmount(
        address _l2token,
        address _account
    )
        public
        view
        returns (uint256)
    {
        uint8 tier = calculTier(_l2token,_account);
        uint256 salePossible;
        if (tier > 0) {
            for (uint8 i = tier; i >0; i--) {
                salePossible = salePossible + calculTierAmount(_l2token,_account,i);
            }
            return salePossible;
        } else {
            return 0;
        }
    }

    function calculOpenSaleAmount(
        address _l2token,
        address _account, 
        uint256 _amount
    )
        public
        view
        returns (uint256)
    {
        LibPublicSaleVault.UserInfo2rd memory user2rds = user2rd[_l2token][_account];
        uint256 depositAmount = user2rds.depositAmount+(_amount);
        uint256 openSalePossible =
            totalExpectOpenSaleAmountView(_l2token)
                *(depositAmount)
                /(totalDepositAmount[_l2token]+_amount);
        return openSalePossible;
    }

    function currentRound(
        address _l2token
    ) 
        public 
        view 
        returns (uint256 round) 
    {
        LibPublicSaleVault.TokenSaleClaim memory claimInfos = claimInfo[_l2token];
        if(claimInfos.firstClaimTime > block.timestamp) round = 0;
        if(claimInfos.firstClaimTime <= block.timestamp && block.timestamp < claimInfos.secondClaimTime) {
            round = 1;
        } else if(claimInfos.secondClaimTime <= block.timestamp) {
            round = (block.timestamp - claimInfos.secondClaimTime) / claimInfos.claimInterval + 2;
        }
        if (round > claimInfos.totalClaimCounts) round = claimInfos.totalClaimCounts;

        // if (block.timestamp >= claimTimes[_l2token][claimInfos.totalClaimCounts-1]) {
        //     return claimInfos.totalClaimCounts;
        // }
        // for (uint256 i = 0; i < claimInfos.totalClaimCounts; i++) {
        //     if (block.timestamp < claimTimes[_l2token][i]) {
        //         return i;
        //     }
        // }
    }

    function calculClaimAmount(
        address _l2token,
        address _account, 
        uint256 _round
    )
        public
        view
        returns (uint256 _reward, uint256 _totalClaim, uint256 _refundAmount)
    {
        LibPublicSaleVault.TokenSaleClaim memory claimInfos = claimInfo[_l2token];
        if (block.timestamp < claimInfos.firstClaimTime) return (0, 0, 0);
        if (_round > claimInfos.totalClaimCounts) return (0, 0, 0);

        LibPublicSaleVault.UserClaim memory userClaims = userClaim[_l2token][_account];
        (, uint256 realSaleAmount, uint256 refundAmount) = totalSaleUserAmount(_l2token,_account);  

        if (realSaleAmount == 0 ) return (0, 0, 0);
        if (userClaims.claimAmount >= realSaleAmount) return (0, 0, 0);   

        uint256 curRound = currentRound(_l2token);

        uint256 amount;
        if (claimInfos.totalClaimCounts == curRound && _round == 0) {
            amount = realSaleAmount-userClaims.claimAmount;
            return (amount, realSaleAmount, refundAmount);
        }

        if(_round == 0) {
            if(curRound == 0) {
                return (amount, realSaleAmount, refundAmount);
            } else {
                amount = realSaleAmount*(claimInfos.firstClaimPercent)/(10000);
                amount = (amount + ((realSaleAmount - amount)/(claimInfos.totalClaimCounts-1) * (curRound -1))) - userClaims.claimAmount;
                return (amount, realSaleAmount, refundAmount);
            }
        } else if (_round == 1) {
            amount = realSaleAmount*(claimInfos.firstClaimPercent)/(10000);
            return (amount, realSaleAmount, refundAmount);
        } else {
            amount = realSaleAmount*(claimInfos.firstClaimPercent)/(10000);
            amount = (amount + ((realSaleAmount - amount)/(claimInfos.totalClaimCounts-1) * (_round -1))) - userClaims.claimAmount;
            return (amount, realSaleAmount, refundAmount);
        }

        // if(_round == 0) {
        //     amount = realSaleAmount*(claimPercents[_l2token][(round-1)])/(10000);
        //     amount = amount-(userClaims.claimAmount);
        //     return (amount, realSaleAmount, refundAmount);
        // } else if(_round == 1) {
        //     amount = realSaleAmount*(claimPercents[_l2token][0])/(10000);
        //     return (amount, realSaleAmount, refundAmount);
        // } else {
        //     uint256 roundPercent = claimPercents[_l2token][_round-(1)]-(claimPercents[_l2token][_round-(2)]);
        //     amount = realSaleAmount*(roundPercent)/(10000);
        //     return (amount, realSaleAmount, refundAmount);
        // }
    }

    function totalSaleUserAmount(
        address _l2token,
        address user
    ) 
        public 
        view 
        returns (uint256 _realPayAmount, uint256 _realSaleAmount, uint256 _refundAmount) 
    {
        LibPublicSaleVault.UserInfo1rd memory user1rds = user1rd[_l2token][user];

        if (user1rds.join) {
            (uint256 realPayAmount, uint256 realSaleAmount, uint256 refundAmount) = openSaleUserAmount(_l2token,user);
            return ( realPayAmount+(user1rds.payAmount), realSaleAmount+(user1rds.saleAmount), refundAmount);
        } else {
            return openSaleUserAmount(_l2token,user);
        }
    }

    function openSaleUserAmount(
        address _l2token,
        address user
    ) 
        public
        view 
        returns (uint256 _realPayAmount, uint256 _realSaleAmount, uint256 _refundAmount) 
    {
        LibPublicSaleVault.UserInfo2rd memory user2rds = user2rd[_l2token][user];

        if (!user2rds.join || user2rds.depositAmount == 0) return (0, 0, 0);

        uint256 openSalePossible = calculOpenSaleAmount(_l2token, user, 0);
        uint256 realPayAmount = calculPayToken(_l2token,openSalePossible);
        uint256 depositAmount = user2rds.depositAmount;
        uint256 realSaleAmount = 0;
        uint256 returnAmount = 0;

        if (realPayAmount < depositAmount) {
            returnAmount = depositAmount-(realPayAmount);
            realSaleAmount = calculSaleToken(_l2token,realPayAmount);
        } else {
            realPayAmount = user2rds.depositAmount;
            realSaleAmount = calculSaleToken(_l2token,depositAmount);
        }

        return (realPayAmount, realSaleAmount, returnAmount);
    }

    function totalOpenSaleAmount(
        address _l2token
    ) 
        public
        view 
        returns (uint256)
    {
        uint256 _calculSaleToken = calculSaleToken(_l2token,totalDepositAmount[_l2token]);
        uint256 _totalAmount = totalExpectOpenSaleAmountView(_l2token);

        if (_calculSaleToken < _totalAmount) return _calculSaleToken;
        else return _totalAmount;
    }

    function totalOpenPurchasedAmount(
        address _l2token
    ) 
        public 
        view 
        returns (uint256)
    {
        uint256 _calculSaleToken = calculSaleToken(_l2token,totalDepositAmount[_l2token]);
        uint256 _totalAmount = totalExpectOpenSaleAmountView(_l2token);
        if (_calculSaleToken < _totalAmount) return totalDepositAmount[_l2token];
        else return  calculPayToken(_l2token,_totalAmount);
    }

    function totalWhitelists(
        address _l2token
    ) 
        external 
        view 
        returns (uint256) 
    {
        return whitelists[_l2token].length;
    }

    function totalExpectOpenSaleAmountView(
        address _l2token
    )
        public
        view
        returns(uint256)
    {
        LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];
        LibPublicSaleVault.TokenSaleManage memory manageInfos = manageInfo[_l2token];
        if (block.timestamp < timeInfos.round1EndTime) return manageInfos.set1rdTokenAmount;
        else return manageInfos.set2rdTokenAmount+(totalRound1NonSaleAmount(_l2token));
    }

    function totalRound1NonSaleAmount(
        address _l2token
    )
        public
        view
        returns(uint256)
    {
        LibPublicSaleVault.TokenSaleInfo memory saleInfos = saleInfo[_l2token];
        LibPublicSaleVault.TokenSaleManage memory manageInfos = manageInfo[_l2token];
        return manageInfos.set1rdTokenAmount-saleInfos.total1rdSaleAmount;
    }

}