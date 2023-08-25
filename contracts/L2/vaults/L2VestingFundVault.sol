//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../libraries/SafeERC20.sol";

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
    using SafeERC20 for IERC20;


    ///@dev constructor
    constructor() {

    }

    // function changeAddr(
    //     address _token,
    //     address _tosToken,
    //     address _receivedAddress,
    //     address _publicSaleVaultAddress,
    //     address _projectToken,
    //     uint24 _fee
    // )
    //     external 
    //     onlyL2ProjectManager
    //     nonZeroAddress(_token)
    //     nonZeroAddress(_tosToken)
    //     nonZeroAddress(_receivedAddress)
    //     nonZeroAddress(_publicSaleVaultAddress)
    //     nonZeroAddress(_projectToken)
    // {
    //     token = _token;
    //     tosToken = _tosToken;
    //     receivedAddress = _receivedAddress;
    //     publicSaleVaultAddress = _publicSaleVaultAddress;
    //     projectToken = _projectToken;
    //     fee = _fee;
    // }

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

    }

    function claim(
        address _l2Token
    ) 
        public 
    {
        require(currentSqrtPriceX96() != 0, "pool's current sqrtPriceX96 is zero.");

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
        require(currentSqrtPriceX96() != 0, "pool's current sqrtPriceX96 is zero.");
        require(claimTimes.length != 0, "set up a claim round for vesting");

        require(msg.sender == publicSaleVault, "caller is not publicSaleVault.");
        require(IERC20(tonToken).allowance(publicSaleVault, address(this)) >= amount, "funding: insufficient allowance");

        totalAllocatedAmount[_l2Token] += amount;
        IERC20(tonToken).transferFrom(publicSaleVault, address(this), amount);

        emit Funded(msg.sender, amount);

        uint256 curRound = currentRound();

        if (curRound > 0 && calculClaimAmount(curRound) > 0 && totalAllocatedAmount[_l2Token] > totalClaimsAmount[_l2Token]) {
            _claim();
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
        if(block.timestamp < claimTimes[0]){
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

    function isL2ProjectManager(address account) public view returns (bool) {
        return (account != address(0) && l2ProjectManager == account);
    }

    function isVaultAdmin(address l2Token, address account) public view returns (bool) {
        return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    }

}