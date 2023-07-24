//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../proxy/Proxy.sol";
import "./L2PublicSaleVaultStorage.sol";

contract L2PublicSaleVaultProxy is Proxy, L2PublicSaleVaultStorage
{
    /* ========== onlyOwner ========== */
    //proxyContractOwner
    function setL2ProjectManager(address _l2ProjectManager)
        external nonZeroAddress(_l2ProjectManager) onlyOwner
    {
        require(l2ProjectManager != _l2ProjectManager, "same");
        l2ProjectManager = _l2ProjectManager;
    }

    //_setAddress = quoter, vestingFund, liquidityVault, uniswapRouter, lockTOS, tos, ton
    function initialize(
        address[7] calldata _setAddress
    )
        external 
        onlyOwner
    {
        quoter = _setAddress[0];
        vestingFund = _setAddress[1];
        liquidityVault = _setAddress[2];
        uniswapRouter = _setAddress[3];
        lockTOS = _setAddress[4];
        tos = _setAddress[5];
        ton = _setAddress[6];
    }

    function setMaxMinPercent(
        uint8 _min,
        uint8 _max
    )
        external
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
        external
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
        external 
        onlyOwner 
    {
        delayTime = _delay;
    }

}