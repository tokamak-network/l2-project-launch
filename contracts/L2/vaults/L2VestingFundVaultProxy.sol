//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../proxy/Proxy.sol";
import "./L2VestingFundVaultStorage.sol";


import "hardhat/console.sol";

contract L2VestingFundVaultProxy is Proxy, L2VestingFundVaultStorage
{
    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    /* ========== onlyOwner ========== */
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

    function setBaseInfoProxy(
        address _tonToken,
        address _tosToken,
        address _publicSaleVault,
        address _uniswapV3Factory
    ) 
        external 
        nonZeroAddress(_tonToken)
        nonZeroAddress(_tosToken)
        nonZeroAddress(_publicSaleVault)
        nonZeroAddress(_uniswapV3Factory)
        onlyL2ProjectManager 
    {
        tonToken = _tonToken;
        tosToken = _tosToken;
        publicSaleVault = _publicSaleVault;
        uniswapV3Factory = _uniswapV3Factory;
    }


    /* ========== only VaultAdmin Of Token ========== */

    /* ========== Anyone can vault admin of token ========== */

    /* ========== VIEW ========== */

    function isVaultAdmin(address l2Token, address account) public view returns (bool) {
        return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    }


    /* === ======= internal ========== */
}