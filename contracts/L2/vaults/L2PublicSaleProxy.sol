//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

// import "../../proxy/Proxy.sol";
import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import "./L2PublicSaleVaultStorage.sol";

import "../../libraries/SafeERC20.sol";
import '../../libraries/LibProject.sol';

// import "hardhat/console.sol";

interface IVestingFund {
    function publicSaleVault() external view returns(address);
    function isVaultAdmin(address l2Token, address account) external view returns (bool);
    function setVaultAdmin(address l2Token, address newAdmin) external;
    function initialize(
        address l2Token,
        address receivedAddress,
        uint256 claimCounts,
        uint256 firstClaimPercents,
        uint256 firstClaimTime,
        uint256 secondClaimTime,
        uint256 roundInterval,
        uint24 fee
    )
        external;
}

contract L2PublicSaleProxy is
    ProxyStorage,
    AccessibleCommon,
    L2PublicSaleVaultStorage
{
    using SafeERC20 for IERC20;

    /* ========== onlyOwner(proxyContractOwner) ========== */

    function setL2ProjectManager(address _l2ProjectManager)
        external nonZeroAddress(_l2ProjectManager) onlyOwner
    {
        require(l2ProjectManager != _l2ProjectManager, "same");
        l2ProjectManager = _l2ProjectManager;
    }

    function setBurnBridge(
        address _l2Bridge,
        address _l1burnVault
    )
        external
        onlyOwner
    {
        require(l2Bridge != _l2Bridge && l1burnVault != _l1burnVault, "same addr");
        l2Bridge = _l2Bridge;
        l1burnVault = _l1burnVault;
    }

    //_setAddress = quoter, vestingFund, liquidityVault, uniswapRouter, lockTOS, tos, ton
    function initialize(
        address[7] calldata _setAddress,
        uint8 _min,
        uint8 _max,
        uint256 _tier1,
        uint256 _tier2,
        uint256 _tier3,
        uint256 _tier4,
        uint256 _delayTime
    )
        external
        onlyOwner
    {
        setAddress(_setAddress);
        setMaxMinPercent(_min,_max);
        setSTOSstandard(_tier1,_tier2,_tier3,_tier4);
        setDelayTime(_delayTime);
    }

    function setAddress(
        address[7] calldata _setAddress
    )
        public
        onlyOwner
    {
        quoter = _setAddress[0];
        vestingFund = _setAddress[1];
        liquidityVault = _setAddress[2];
        uniswapRouter = _setAddress[3];
        lockTOS = _setAddress[4];
        tos = _setAddress[5];
        ton = _setAddress[6];
        _WETH = IWETH(ton);

        IERC20(ton).approve(
            address(uniswapRouter),
            type(uint256).max
        );

        // IERC20(wton).approve(
        //     address(uniswapRouter),
        //     type(uint256).max
        // );

        // IERC20(ton).approve(
        //     wton,
        //     type(uint256).max
        // );
    }

    function setMaxMinPercent(
        uint8 _min,
        uint8 _max
    )
        public
        onlyOwner
    {
        require(_min < _max, "need min < max");
        minPer = _min;
        maxPer = _max;
    }

    function setSTOSstandard(
        uint256 _tier1,
        uint256 _tier2,
        uint256 _tier3,
        uint256 _tier4
    )
        public
        onlyOwner
    {
        require(
            (_tier1 < _tier2) &&
            (_tier2 < _tier3) &&
            (_tier3 < _tier4),
            "tier set error"
        );
        stanTier1 = _tier1;
        stanTier2 = _tier2;
        stanTier3 = _tier3;
        stanTier4 = _tier4;
    }

    function setDelayTime(
        uint256 _delay
    )
        public
        onlyOwner
    {
        require(delayTime != _delay, "same delayTime");
        delayTime = _delay;
    }

    /* ========== only L2ProjectManager ========== */

    function setVaultAdmin(
        address l2Token,
        address _newAdmin
    )
        external nonZeroAddress(l2Token) nonZeroAddress(_newAdmin) onlyL2ProjectManager
    {
        require(vaultAdminOfToken[l2Token] != _newAdmin, "same");
        vaultAdminOfToken[l2Token] = _newAdmin;
        if(!IVestingFund(vestingFund).isVaultAdmin(l2Token, _newAdmin))  IVestingFund(vestingFund).setVaultAdmin(l2Token,_newAdmin);
        emit SetVaultAdmin(l2Token, _newAdmin);
    }

    /* ========== only VaultAdmin ========== */

    function vaultInitialize(
        address _l2token,
        LibProject.InitalParameterPublicSaleVault memory params,
        LibProject.InitalParameterPublicSaleClaim memory params2,
        LibProject.InitalParameterVestingFundVault memory params3
    )
        external
        onlyVaultAdminOfToken(_l2token)
    {
         require(
            (params.startWhiteTime < params.endWhiteTime) &&
            (params.endWhiteTime < params.start1roundTime) &&
            (params.start1roundTime < params.end1roundTime) &&
            (params.end1roundTime < params.start2roundTime) &&
            (params.start2roundTime < params.end2roundTime),
            "RoundTime err"
        );

        require(
            (params.end2roundTime < params2.firstClaimTime) &&
            (params2.firstClaimTime < params2.secondClaimTime),
            "claimTime err"
        );

        require(
            (params.end2roundTime < params3.firstClaimTime) &&
            (params3.firstClaimTime < params3.secondClaimTime),
            "VestingClaimTime err"
        );

        setTier(
            _l2token,
            params.stosTier1,
            params.stosTier2,
            params.stosTier3,
            params.stosTier4
        );

        setTierPercents(
            _l2token,
            params.tier1Percents,
            params.tier2Percents,
            params.tier3Percents,
            params.tier4Percents
        );

        setAllAmount(
            _l2token,
            params.total1roundSaleAmount,
            params.total2roundSaleAmount,
            params.saleTokenPrice,
            params.payTokenPrice,
            params.hardcapAmount,
            params.changeTOSPercent,
            0
        );

        set1RoundTime(
            _l2token,
            params.startWhiteTime,
            params.endWhiteTime,
            params.start1roundTime,
            params.end1roundTime
        );

        set2RoundTime(
            _l2token,
            params.snapshotTime,
            params.start2roundTime,
            params.end2roundTime
        );

        setClaimTime(
            _l2token,
            params2.claimCounts,
            params2.firstClaimPercent,
            params2.firstClaimTime,
            params2.secondClaimTime,
            params2.roundInterval
        );

        IVestingFund(vestingFund).initialize(
            _l2token,
            params3.receiveAddress,
            params3.totalClaimCount,
            params3.firstClaimPercent,
            params3.firstClaimTime,
            params3.secondClaimTime,
            params3.roundIntervalTime,
            params3.fee
        );

        IERC20(_l2token).approve(
            address(l2Bridge),
            type(uint256).max
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
        require(
            (stanTier1 <= _tier1) &&
            (stanTier2 <= _tier2) &&
            (stanTier3 <= _tier3) &&
            (stanTier4 <= _tier4),
            "Tier set error"
        );

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
        if(balance == 0) {
            IERC20(_l2token).safeTransferFrom(l2ProjectManager, address(this), (_totalExpectSaleAmount+_totalExpectOpenSaleAmount) );
            balance = IERC20(_l2token).balanceOf(address(this));
        }

        require((_totalExpectSaleAmount + _totalExpectOpenSaleAmount) <= balance && 1 ether <= balance, "not input token");
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
        // manageInfos.changeTick = changeTick;
        if(manageInfos.changeTick == 0) {
            manageInfos.changeTick = 18;
        }
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
        // require(
        //     (_startAddWhiteTime < _endAddWhiteTime) &&
        //     (_endAddWhiteTime < _startExclusiveTime) &&
        //     (_startExclusiveTime < _endExclusiveTime),
        //     "RoundTime err"
        // );

        if(timeInfos.deployTime != 0) {
            require(isL2ProjectManager(), "only DAO");
        } else {
            timeInfos.deployTime = block.timestamp;
        }
        // console.log("timeInfos.deployTime :", timeInfos.deployTime);
        // console.log("delayTime :", delayTime);
        // console.log("_startAddWhiteTime :", _startAddWhiteTime);
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

        // require(
        //     (_startDepositTime < _endDepositTime),
        //     "Round2time err"
        // );

        timeInfos.snapshot = _snapshot;
        timeInfos.round2StartTime = _startDepositTime;
        timeInfos.round2EndTime = _endDepositTime;
    }

    function setClaimTime(
        address _l2token,
        uint256 _claimCounts,
        uint256 _firstClaimPercents,
        uint256 _firstClaimTime,
        uint256 _secondClaimTime,
        uint256 _roundInterval
    )
        public
        onlyVaultAdminOfToken(_l2token)
        nonZero(_claimCounts)
        beforeStartAddWhiteTime(_l2token)
    {
        LibPublicSaleVault.TokenSaleClaim storage claimInfos = claimInfo[_l2token];
        // require(_firstClaimTime != 0, "firstclaimTime value err");
        // require(_firstClaimTime > block.number, "first claim time passed");
        if(claimInfos.totalClaimCounts != 0) {
            require(isL2ProjectManager(), "only DAO");
        }

        claimInfos.totalClaimCounts = _claimCounts;
        claimInfos.firstClaimPercent = _firstClaimPercents;
        claimInfos.firstClaimTime = _firstClaimTime;
        claimInfos.secondClaimTime = _secondClaimTime;
        claimInfos.claimInterval = _roundInterval;
    }

    /* ========== VIEW ========== */

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