// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import { L2DividendPoolForStosStorage } from "./L2DividendPoolForStosStorage.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "../../libraries/LibDividend.sol";

import {IERC20} from "../../interfaces/IERC20.sol";
import "../../libraries/SafeERC20.sol";

interface IUniversalStos {

    function balanceOfAt(address account, uint256 _timestamp) external view returns (uint256);
    function totalSupplyAt(uint256 _timestamp) external view returns (uint256);

}

contract L2DividendPoolForStos is ProxyStorage, AccessibleCommon, L2DividendPoolForStosStorage {
    using SafeERC20 for IERC20;

    event Claimed(address indexed token, address indexed account, uint256 amount, uint256 epochNumber, uint256 timestamp);
    event Distributed(address indexed token, uint256 wekklyEpoch, uint256 amount);
    event Redistributed(address indexed token, uint256 oldEpoch, uint256 newEpoch, uint256 amount);

    modifier ifFree {
        require(!free, "already in use");
        free = true;
        _;
        free = false;
    }

    modifier nonZero(uint256 value) {
        require(value != 0, "zero value");
        _;
    }

    modifier nonZeroAddress(address addr) {
        require(addr != address(0), "zero address");
        _;
    }

    /* ========== onlyOwner ========== */

    function initialize(address _universalStos, uint256 _epochUnit) external onlyOwner {
        universalStos = _universalStos;
        epochUnit = _epochUnit;
    }

    /* ========== external  ========== */

    function claimBatch(address[] calldata _tokens) external {
        for (uint i = 0; i < _tokens.length; ++i) {
            claim(_tokens[i]);
        }
    }

    function claim(address _token) public {
        claimUpTo(_token, block.timestamp - epochUnit);
    }

    function claimUpTo(address _token, uint256 _timestamp) public {
        require(genesis[_token] != 0, "genesis is zero");
        require(block.timestamp >= genesis[_token] + epochUnit, "the first epoch");
        uint256 timestamp = Math.min(_timestamp, block.timestamp - epochUnit);
        uint256 weeklyEpoch = getWeeklyEpoch(_token, timestamp);

        uint256 amountToClaim = claimableForEpoches(
                _token,
                msg.sender,
                claimStartWeeklyEpoch[_token][msg.sender],
                weeklyEpoch);

        require(amountToClaim > 0, "no claimable amlount");
        LibDividend.Distribution storage distr = distributions[_token];
        require(distr.lastBalance >= amountToClaim, "insufficient balance");
        claimStartWeeklyEpoch[_token][msg.sender] = weeklyEpoch + 1;
        distr.lastBalance -= amountToClaim;

        IERC20(_token).safeTransfer(msg.sender, amountToClaim);
        emit Claimed(_token, msg.sender, amountToClaim, weeklyEpoch, _timestamp);
    }

    function _recordClaim(
        address _token,
        address account,
        uint256 _weeklyEpoch
    ) internal returns (uint256 amountToClaim) {

        amountToClaim = claimableForEpoches(
            _token,
            account,
            claimStartWeeklyEpoch[_token][account],
            _weeklyEpoch
        );

        require(amountToClaim > 0, "Amount to be claimed is zero");
        LibDividend.Distribution storage distr = distributions[_token];
        require(distr.lastBalance >= amountToClaim, "insufficient remained balance");

        claimStartWeeklyEpoch[_token][account] = _weeklyEpoch + 1;
        distr.lastBalance -= amountToClaim;
    }


    function distribute(address _token, uint256 _amount)
        external nonZero(_amount) nonZeroAddress(_token) ifFree
    {
        if (genesis[_token] == 0) genesis[_token] = block.timestamp / epochUnit * epochUnit;
        uint256 weeklyEpoch = getWeeklyEpoch(_token, block.timestamp);

        LibDividend.Distribution storage distr = distributions[_token];
        if (distr.exists == false) distributedTokens.push(_token);
        distr.exists = true;

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        distr.lastBalance = IERC20(_token).balanceOf(address(this));
        distr.totalDistribution += _amount;
        tokensPerWeek[_token][weeklyEpoch] += _amount;

        emit Distributed(_token, weeklyEpoch, _amount);
    }

    // 이전에 이미 배포했는데, 해당 스냅샷 시점에 총 금액이 없어서 에어드랍 받을 사람이 없는경우,..
    // 해당 에폭의 금액을 현재 에폭으로 가져올 수 있게 한다.
    function redistribute(address _token, uint256 _weeklyEpoch)
        external nonZeroAddress(_token) ifFree
    {
        uint256 currentEpoch = getWeeklyEpoch(_token, block.timestamp);
        require(_weeklyEpoch < currentEpoch, "It can only be set if it is the last epoch.");
        uint256 timestamp = genesis[_token] + (_weeklyEpoch * epochUnit) +  epochUnit;

        require(
            IUniversalStos(universalStos).totalSupplyAt(timestamp) == 0,
            "Token exists for that epoch"
        );

        uint256 amount = tokensPerWeek[_token][_weeklyEpoch];
        tokensPerWeek[_token][currentEpoch] += amount;
        tokensPerWeek[_token][_weeklyEpoch] = 0;

        emit Redistributed(_token, _weeklyEpoch, currentEpoch, amount);
    }


    function tokensPerWeekAt(address _token, uint256 _timestamp)
        external
        view
        returns (uint256 epochNumber, uint256 amount)
    {
        uint256 weeklyEpoch = getWeeklyEpoch(_token, _timestamp);
        return (weeklyEpoch, tokensPerWeek[_token][weeklyEpoch]);
    }

    /* ========== public  ========== */

    function getWeeklyEpoch(address _token, uint256 _timestamp)
        public
        view
        returns (uint256)
    {
        uint256 stime = genesis[_token];
        if (stime == 0) return 0;
        return _timestamp > stime ? (_timestamp - stime) / epochUnit : 0;
    }

    function getAvailableClaims(address _account)
        external view returns (address[] memory tokens, uint256[] memory claimableAmounts)
    {
        uint256[] memory amounts = new uint256[](distributedTokens.length);

        for (uint256 i = 0; i < distributedTokens.length; ++i) {
            amounts[i] = claimable(_account, distributedTokens[i]);
        }

        return (distributedTokens, amounts);
    }

    function claimable(address _account, address _token) public view returns (uint256) {

        uint256 stime = genesis[_token];
        if (stime == 0) return 0;

        uint256 endEpoch = getWeeklyEpoch(_token, block.timestamp - epochUnit);
        uint256 startEpoch = claimStartWeeklyEpoch[_token][_account];
        return claimableForEpoches(_account, _token, startEpoch, endEpoch);
    }


    function calculateClaimPerEpoch(
        address _account,
        uint256 _timestamp,
        uint256 _tokensPerWeek
    ) public view returns (uint256) {
        uint256 balance = IUniversalStos(universalStos).balanceOfAt(_account, _timestamp);
        uint256 supply = IUniversalStos(universalStos).totalSupplyAt(_timestamp);
        if (balance == 0 || supply == 0) return 0;
        return (_tokensPerWeek * balance / supply);
    }

    function getCurrentWeeklyEpochTimestamp(address _token) public view returns (uint256) {
        uint256 stime = genesis[_token];
        if (stime == 0) return 0;

        uint256 weeklyEpoch = getWeeklyEpoch(_token, block.timestamp);
        return (stime + (weeklyEpoch * epochUnit) + epochUnit);
    }

    /* ========== internal  ========== */

    function claimableForEpoches(
        address _token,
        address _account,
        uint256 startEpoch,
        uint256 endEpoch
    ) internal view returns (uint256 amountToClaim) {
        if (startEpoch > endEpoch) return 0;
        uint256 stime = genesis[_token];
        uint256 epochIterator = startEpoch;
        while (startEpoch <= endEpoch) {
            if (tokensPerWeek[_token][epochIterator] != 0 && stime != 0) {
                amountToClaim += calculateClaimPerEpoch(
                    _account,
                    stime + (epochIterator * epochUnit) + epochUnit,
                    tokensPerWeek[_token][epochIterator]);
            }
            epochIterator++;
        }
    }

}
