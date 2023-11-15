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
        onlyOwner 
    {
        tonToken = _tonToken;
        tosToken = _tosToken;
        publicSaleVault = _publicSaleVault;
        uniswapV3Factory = _uniswapV3Factory;
    }
    
    /* ========== only L2ProjectManager ========== */
    
    function setVaultAdmin(
        address l2Token,
        address _newAdmin
    )
        external 
        nonZeroAddress(l2Token) 
        nonZeroAddress(_newAdmin) 
        onlyL2PublicSale
    {
        require(vaultAdminOfToken[l2Token] != _newAdmin, "same");
        vaultAdminOfToken[l2Token] = _newAdmin;
        emit SetVaultAdmin(l2Token, _newAdmin);
    }

    /* ========== only VaultAdmin Of Token ========== */

    /* ========== Anyone can vault admin of token ========== */

    /* ========== VIEW ========== */

    // function isVaultAdmin(address l2Token, address account) public view returns (bool) {
    //     return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    // }


    /* === ======= internal ========== */
}