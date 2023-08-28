//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import { L2VestingFundVaultStorage } from "./L2VestingFundVaultStorage.sol";

import "hardhat/console.sol";

interface IIUniswapV3Pool {
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

contract L2VestingFundVault is 
    ProxyStorage,
    AccessibleCommon, 
    L2VestingFundVaultStorage 
{
    // using SafeERC20 for IERC20;


    ///@dev constructor
    constructor() {

    }

    function changeReceivedAddress(
        address _l2Token,
        address _receivedAddress
    )
        external
        nonZeroAddress(_receivedAddress)
    {
        require(msg.sender == receivedAddress[_l2Token] || isVaultAdmin(_l2Token,msg.sender), "caller is not receivedAddress or vaultAdmin");
        receivedAddress[_l2Token] = _receivedAddress;
    }


    function ownerSetting(
        address _l2Token,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    )
        external
        onlyL2ProjectManager
    {
        if(settingChecks[_l2Token] == true) {
            delete claimTimes[_l2Token];
            delete claimAmounts[_l2Token];
        }
        
        _initialize(
            _l2Token,
            _claimTimes,
            _claimAmounts
        );

        if(settingChecks[_l2Token] != true) settingChecks[_l2Token] = true;
    }

    function initialize(
        address _l2Token,
        address _receivedAddress,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts,
        uint24 _fee
    )
        external
        nonZeroAddress(_l2Token)
        nonZeroAddress(_receivedAddress)
    {
        require(settingChecks[_l2Token] != true, "Already initalized");
        
        receivedAddress[_l2Token] = _receivedAddress;
        fees[_l2Token] = _fee;

        _initialize(
            _l2Token,
            _claimTimes,
            _claimAmounts
        );

        settingChecks[_l2Token] = true;
    }

    function _initialize(
        address _l2Token,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    )
        internal
    {
        require(_claimTimes.length != 0,
                "claimCounts must be greater than zero");

        require(_claimTimes.length == _claimAmounts.length,
                "_claimTimes and _claimAmounts length do not match");

        uint256 _claimCounts = _claimTimes.length;

        require(_claimAmounts[_claimCounts-1] == 100, "Final claimAmounts is not 100%");

        uint256 i = 0;
        for (i = 1; i < _claimCounts; i++) {
            require(_claimTimes[i-1] > block.timestamp && _claimTimes[i] > _claimTimes[i-1], "claimTimes should not be decreasing");
            require(_claimAmounts[i] > _claimAmounts[i-1], "claimAmounts should not be decreasing");
        }

        totalClaimCounts[_l2Token] = _claimCounts;

        claimTimes[_l2Token] = new uint256[](_claimCounts);
        claimAmounts[_l2Token] = new uint256[](_claimCounts);

        for(i = 0; i < _claimCounts; i++) {
            claimTimes[_l2Token][i] = _claimTimes[i];
            claimAmounts[_l2Token][i] = _claimAmounts[i];
        }

        emit Initialized(_claimCounts, _claimTimes, _claimAmounts);
    }

    function claim(
        address _l2Token
    ) 
        public 
    {
        require(currentSqrtPriceX96(_l2Token) != 0, "pool's current sqrtPriceX96 is zero.");

        require(claimTimes[_l2Token][0] != 0 && block.timestamp > claimTimes[_l2Token][0], "Vault: not started yet");
        require(totalAllocatedAmount[_l2Token] > totalClaimsAmount[_l2Token],"Vault: already All get");
        _claim(_l2Token);
    }

    function _claim(
        address _l2Token
    ) 
        internal
    {
        uint256 curRound = currentRound(_l2Token);
        uint256 amount = calculClaimAmount(_l2Token,curRound);
        require(amount > 0, "claimable amount is zero");
        require(IERC20(tonToken).balanceOf(address(this)) >= amount,"Vault: insufficient balance");
        require(remainAmount(_l2Token) >= amount,"Vault: over remain balance");

        nowClaimRound[_l2Token] = curRound;
        totalClaimsAmount[_l2Token] = totalClaimsAmount[_l2Token] + amount;

        IERC20(tonToken).transfer(receivedAddress[_l2Token], amount);

        emit Claimed(msg.sender, receivedAddress[_l2Token], amount);
    }

    function funding(
        address _l2Token,
        uint256 amount
    ) 
        external
    {
        require(currentSqrtPriceX96(_l2Token) != 0, "pool's current sqrtPriceX96 is zero.");
        require(claimTimes[_l2Token].length != 0, "set up a claim round for vesting");

        require(msg.sender == publicSaleVault, "caller is not publicSaleVault.");
        require(IERC20(tonToken).allowance(publicSaleVault, address(this)) >= amount, "funding: insufficient allowance");

        totalAllocatedAmount[_l2Token] += amount;
        IERC20(tonToken).transferFrom(publicSaleVault, address(this), amount);

        emit Funded(msg.sender, amount);

        uint256 curRound = currentRound(_l2Token);

        if (curRound > 0 && calculClaimAmount(_l2Token,curRound) > 0 && totalAllocatedAmount[_l2Token] > totalClaimsAmount[_l2Token]) {
            _claim(_l2Token);
        }
    }

    /* === ======= internal ========== */


    /* ========== VIEW ========== */

    function currentRound(
        address _l2Token
    ) 
        public 
        view 
        returns (uint256 round) 
    {
        if(claimTimes[_l2Token].length == 0) return 0;
        if(block.timestamp < claimTimes[_l2Token][0]){
            round = 0;
        }
        if (block.timestamp >= claimTimes[_l2Token][totalClaimCounts[_l2Token]-1]) {
            round = totalClaimCounts[_l2Token];
        }

        for(uint256 i = 0; i < totalClaimCounts[_l2Token]; i++) {
            if(claimTimes[_l2Token][i] <= block.timestamp) {
                round = i+1;
            } else {
                break;
            }
        }
    }

    function calculClaimAmount(
        address _l2Token,    
        uint256 _round
    ) 
        public 
        view 
        returns (uint256 amount) 
    {
        if (currentRound(_l2Token) == 0) return 0;
        if (totalClaimCounts[_l2Token] == 0 || totalAllocatedAmount[_l2Token] == 0) return 0;
        if (totalClaimCounts[_l2Token] == _round) {
            amount = totalAllocatedAmount[_l2Token] - totalClaimsAmount[_l2Token];
        } else {
            amount = (totalAllocatedAmount[_l2Token] * claimAmounts[_l2Token][_round-1] / 100) - totalClaimsAmount[_l2Token];
        }
    }

    function remainAmount(
        address _l2Token
    )
        public
        view
        returns (uint256 amount)
    {
        return totalAllocatedAmount[_l2Token] - totalClaimsAmount[_l2Token];
    }

    function getPoolAddress(
        address _l2Token
    ) 
        public 
        view 
        returns (address pool)
    {
        //L2에서는 변경되어야함
        bytes32 POOL_INIT_CODE_HASH = 0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

        if (tosToken == address(0) || _l2Token == address(0) || fees[_l2Token] == 0
            || uniswapV3Factory == address(0) )  return address(0);

        address token0 = tosToken;
        address token1 = _l2Token;
        if (tosToken > _l2Token) {
            token0 = _l2Token;
            token1 = tosToken;
        }

        pool = address(
            uint160(
            uint256(
                keccak256(
                    abi.encodePacked(
                        hex'ff',
                        uniswapV3Factory,
                        keccak256(abi.encode(token0, token1, fees[_l2Token])),
                        POOL_INIT_CODE_HASH
                    )
                )
            ))
        );
    }

    function currentSqrtPriceX96(
        address _l2Token
    ) 
        public 
        view 
        returns (uint160 sqrtPriceX96)
    {
        sqrtPriceX96 = 0;
        address pool = getPoolAddress(_l2Token);
        if (pool != address(0) && isContract(pool)) {
            // (,tick,,,,,) = IIUniswapV3Pool(pool).slot0();
            (sqrtPriceX96,,,,,,) = IIUniswapV3Pool(pool).slot0();
        }
    }

    function isContract(address _addr) public view returns (bool _isContract) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    // function availableInitializer(
    //     address _l2Token,
    //     address _addr
    // ) 
    //     external 
    //     view 
    //     returns (bool result) 
    // {
    //     if (!settingCheck && (_addr == receivedAddress || isAdmin(_addr))) result = true;
    // }

    function isL2ProjectManager(address account) public view returns (bool) {
        return (account != address(0) && l2ProjectManager == account);
    }

    function isVaultAdmin(address l2Token, address account) public view returns (bool) {
        return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    }

}