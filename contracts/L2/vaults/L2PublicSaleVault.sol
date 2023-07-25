// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../libraries/SafeERC20.sol";

import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import { L2PublicSaleVaultStorage } from "./L2PublicSaleVaultStorage.sol";
import { LibPublicSaleVault } from "../../libraries/LibPublicSaleVault.sol";

interface IILockTOS {
    function balanceOfAt(address _addr, uint256 _timestamp)
        external
        view
        returns (uint256 balance);
}

contract L2PublicSaleVault is 
    ProxyStorage,
    AccessibleCommon, 
    L2PublicSaleVaultStorage 
{
    using SafeERC20 for IERC20;

    /* ========== only VaultAdmin ========== */

    function vaultInitialize(
        address _l2token,
        uint256[8] calldata _Tier,
        uint256[7] calldata _amount,
        uint256[8] calldata _time,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimPercents
    ) 
        external
        onlyVaultAdminOfToken(_l2token) 
    {   
        setTier(
            _l2token, 
            _Tier[0], 
            _Tier[1], 
            _Tier[2], 
            _Tier[3]
        );
        
        setTierPercents(
            _l2token, 
            _Tier[4], 
            _Tier[5], 
            _Tier[6], 
            _Tier[7]
        );

        setAllAmount(
            _l2token,
            _amount[0],
            _amount[1],
            _amount[2],
            _amount[3],
            _amount[4],
            _amount[5],
            _amount[6]
        );

        set1RoundTime(
            _l2token,
            _time[1],
            _time[2],
            _time[3],
            _time[4]
        );

        set2RoundTime(
            _l2token,
            _time[0],
            _time[5],
            _time[6] 
        );

        setClaimTime(
            _l2token,
            _time[7],
            _claimTimes,
            _claimPercents
        );
    }

    function setTier(
        address _l2token,
        uint256 _tier1,
        uint256 _tier2,
        uint256 _tier3,
        uint256 _tier4
    )
        public
        onlyVaultAdminOfToken(_l2token)
        nonZero(_tier1)
        nonZero(_tier2)
        nonZero(_tier3)
        nonZero(_tier4)
        beforeStartAddWhiteTime(_l2token)
    {
        if(tiers[_l2token][1] != 0) {
            require(isL2ProjectManager(), "only DAO");
        }
        tiers[_l2token][1] = _tier1;
        tiers[_l2token][2] = _tier2;
        tiers[_l2token][3] = _tier3;
        tiers[_l2token][4] = _tier4;
    } 

    function setTierPercents(
        address _l2token,
        uint256 _tier1Percents,
        uint256 _tier2Percents,
        uint256 _tier3Percents,
        uint256 _tier4Percents
    )
        public
        onlyVaultAdminOfToken(_l2token)
        nonZero(_tier1Percents)
        nonZero(_tier2Percents)
        nonZero(_tier3Percents)
        nonZero(_tier4Percents)
        beforeStartAddWhiteTime(_l2token)
    {
        if(tiersPercents[_l2token][1] != 0) {
            require(isL2ProjectManager(), "only DAO");
        }
        require(
            _tier1Percents+(_tier2Percents)+(_tier3Percents)+(_tier4Percents) == 10000,
            "Sum need 10000"
        );
        tiersPercents[_l2token][1] = _tier1Percents;
        tiersPercents[_l2token][2] = _tier2Percents;
        tiersPercents[_l2token][3] = _tier3Percents;
        tiersPercents[_l2token][4] = _tier4Percents;
    }

    function setAllAmount(
        address _l2token,
        uint256 _totalExpectSaleAmount,
        uint256 _totalExpectOpenSaleAmount,
        uint256 _saleTokenPrice,
        uint256 _payTokenPrice,
        uint256 _hardcapAmount,
        uint256 _changePercent,
        uint256 _changeTick
    )
        public
        onlyVaultAdminOfToken(_l2token)
        beforeStartAddWhiteTime(_l2token)
    {
        uint256 balance = IERC20(_l2token).balanceOf(address(this));
        require((_totalExpectSaleAmount + _totalExpectOpenSaleAmount) <= balance && 1 ether <= balance, "amount err");
        require(_changePercent <= maxPer && _changePercent >= minPer,"need to set min,max");
        require((_totalExpectSaleAmount+(_totalExpectOpenSaleAmount)) >= (_hardcapAmount*(_payTokenPrice)/(_saleTokenPrice)), "over hardcap");
        
        LibPublicSaleVault.TokenSaleManage storage manageInfos = manageInfo[_l2token];
        
        if(manageInfos.set1rdTokenAmount != 0) {
            require(isL2ProjectManager(), "only DAO");
        }
        
        manageInfos.set1rdTokenAmount = _totalExpectSaleAmount;
        manageInfos.set2rdTokenAmount = _totalExpectOpenSaleAmount;
        manageInfos.saleTokenPrice = _saleTokenPrice;
        manageInfos.tonPrice = _payTokenPrice;
        manageInfos.hardCap = _hardcapAmount;
        manageInfos.changeTOS = _changePercent;
        manageInfos.changeTick = _changeTick;
        // if(changeTick == 0) {
        //     changeTick = 18;
        // }
    }

    function set1RoundTime(
        address _l2token,
        uint256 _startAddWhiteTime,
        uint256 _endAddWhiteTime,
        uint256 _startExclusiveTime,
        uint256 _endExclusiveTime
    )
        public
        onlyVaultAdminOfToken(_l2token)
        nonZero(_startAddWhiteTime)
        nonZero(_endAddWhiteTime)
        nonZero(_startExclusiveTime)
        nonZero(_endExclusiveTime)
        beforeStartAddWhiteTime(_l2token)
    {
        LibPublicSaleVault.TokenTimeManage storage timeInfos = timeInfo[_l2token];
        require(
            (_startAddWhiteTime < _endAddWhiteTime) &&
            (_endAddWhiteTime < _startExclusiveTime) &&
            (_startExclusiveTime < _endExclusiveTime),
            "RoundTime err"
        );

        if(timeInfos.deployTime != 0) {
            require(isL2ProjectManager(), "only DAO");
        } else {
            timeInfos.deployTime = block.timestamp;
        }

        require((timeInfos.deployTime + delayTime) < _startAddWhiteTime, "snapshot need later");

        timeInfos.whiteListStartTime = _startAddWhiteTime;
        timeInfos.whiteListEndTime = _endAddWhiteTime;
        timeInfos.round1StartTime = _startExclusiveTime;
        timeInfos.round1EndTime = _endExclusiveTime;
    }

    function set2RoundTime(
        address _l2token,
        uint256 _snapshot,
        uint256 _startDepositTime,
        uint256 _endDepositTime
    )
        public
        onlyVaultAdminOfToken(_l2token)
        nonZero(_snapshot)
        nonZero(_startDepositTime)
        nonZero(_endDepositTime)
        beforeStartAddWhiteTime(_l2token)
    {
        LibPublicSaleVault.TokenTimeManage storage timeInfos = timeInfo[_l2token];
         if(timeInfos.snapshot != 0) {
            require(isL2ProjectManager(), "only DAO");
        }

        require(
            (_startDepositTime < _endDepositTime),
            "Round2time err"
        );

        timeInfos.snapshot = _snapshot;
        timeInfos.round2StartTime = _startDepositTime;
        timeInfos.round2EndTime = _startDepositTime;    
    }

    function setClaimTime(
        address _l2token,
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimPercents
    )
        public
        onlyVaultAdminOfToken(_l2token)
        nonZero(_claimCounts)
        beforeStartAddWhiteTime(_l2token)
    {
        LibPublicSaleVault.TokenSaleClaim storage claimInfos = claimInfo[_l2token];
        if(claimInfos.totalClaimCounts != 0) {
            require(isL2ProjectManager(), "only DAO");
            delete claimTimes[_l2token];
            delete claimPercents[_l2token];
        }
        
        claimInfos.totalClaimCounts = _claimCounts;
        uint256 i = 0;
        uint256 y = 0;
        for (i = 0; i < _claimCounts; i++) {
            claimTimes[_l2token].push(_claimTimes[i]);
            if (i != 0){
                require(claimTimes[_l2token][i-1] < claimTimes[_l2token][i], "claimtime err");
            }
            y = y + _claimPercents[i];
            claimPercents[_l2token].push(y);
        }

        require(y == 10000, "claimPercents err");
    }

    /* ========== USING BUYER ========== */

    /* ========== VIEW ========== */

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
        address _account 
    )
        public
        view
        returns (uint256)
    {
        LibPublicSaleVault.UserInfo1rd memory user1rds = user1rd[_l2token][_account];
        LibPublicSaleVault.TokenSaleManage memory manageInfos = manageInfo[_l2token];
        uint8 tier = calculTier(_account,_l2token);
        if (user1rds.join == true && tier > 0) {
            uint256 salePossible =
                manageInfos.set1rdTokenAmount
                    *(tiersPercents[_l2token][tier])
                    /(tiers1stAccount[_l2token][tier])
                    /(10000);
            return salePossible;
        } else if (tier > 0) {
            uint256 tierAccount = tiers1stAccount[_l2token][tier]+(1);
            uint256 salePossible =
                manageInfos.set1rdTokenAmount
                    *(tiersPercents[_l2token][tier])
                    /(tierAccount)
                    /(10000);
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
        if (block.timestamp >= claimTimes[_l2token][claimInfos.totalClaimCounts-1]) {
            return claimInfos.totalClaimCounts;
        }
        for (uint256 i = 0; i < claimInfos.totalClaimCounts; i++) {
            if (block.timestamp < claimTimes[_l2token][i]) {
                return i;
            }
        }
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
        // LibPublicSaleVault.TokenTimeManage memory timeInfos = timeInfo[_l2token];
        LibPublicSaleVault.TokenSaleClaim memory claimInfos = claimInfo[_l2token];
        if (block.timestamp < claimTimes[_l2token][0]) return (0, 0, 0);
        if (_round > claimInfos.totalClaimCounts) return (0, 0, 0);

        LibPublicSaleVault.UserClaim memory userClaims = userClaim[_l2token][_account];
        (, uint256 realSaleAmount, uint256 refundAmount) = totalSaleUserAmount(_l2token,_account);  

        if (realSaleAmount == 0 ) return (0, 0, 0);
        if (userClaims.claimAmount >= realSaleAmount) return (0, 0, 0);   

        uint256 round = currentRound(_l2token);

        uint256 amount;
        if (claimInfos.totalClaimCounts == round && _round == 0) {
            amount = realSaleAmount-userClaims.claimAmount;
            return (amount, realSaleAmount, refundAmount);
        }

        if(_round == 0) {
            amount = realSaleAmount*(claimPercents[_l2token][(round-1)])/(10000);
            amount = amount-(userClaims.claimAmount);
            return (amount, realSaleAmount, refundAmount);
        } else if(_round == 1) {
            amount = realSaleAmount*(claimPercents[_l2token][0])/(10000);
            return (amount, realSaleAmount, refundAmount);
        } else {
            uint256 roundPercent = claimPercents[_l2token][_round-(1)]-(claimPercents[_l2token][_round-(2)]);
            amount = realSaleAmount*(roundPercent)/(10000);
            return (amount, realSaleAmount, refundAmount);
        }
    }

    function totalSaleUserAmount(
        address _l2token,
        address user
    ) 
        public 
        view 
        returns (uint256 _realPayAmount, uint256 _realSaleAmount, uint256 _refundAmount) 
    {
        // LibPublicSale.UserInfoEx memory userEx = usersEx[user];
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
        // LibPublicSale.UserInfoOpen memory userOpen = usersOpen[user];

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


    function isL2ProjectManager() public view returns (bool) {
        return (l2ProjectManager != address(0) && msg.sender == l2ProjectManager);
    }

    function isVaultAdmin(address l2Token, address account) public view returns (bool) {
        return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    }

    //address(0)이면 해당 l2Token에 대해서 admin이 설정되지 않앗음 -> projectManager로 부터 판매허용이 안떨어졌음
    //address(0)가 아니면 l2Token에 대해서 admin이 설정되었으므로 판매허용이 떨어졌음
    function isL2Token(address l2Token) public view returns (bool) {
        return (vaultAdminOfToken[l2Token] != address(0));
    }

}