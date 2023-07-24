//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../proxy/Proxy.sol";
import "./L2PublicSaleVaultStorage.sol";

contract L2PublicSaleVaultProxy is Proxy, L2PublicSaleVaultStorage
{
    /* ========== onlyOwner(proxyContractOwner) ========== */

    function setL2ProjectManager(address _l2ProjectManager)
        external nonZeroAddress(_l2ProjectManager) onlyOwner
    {
        require(l2ProjectManager != _l2ProjectManager, "same");
        l2ProjectManager = _l2ProjectManager;
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
        emit SetVaultAdmin(l2Token, _newAdmin);
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
        onlyL2ProjectManager
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
        onlyL2ProjectManager
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
        public
        onlyL2ProjectManager
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
        onlyL2ProjectManager 
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
        onlyL2ProjectManager 
    {
        require(delayTime != _delay, "same delayTime");
        delayTime = _delay;
    }

}