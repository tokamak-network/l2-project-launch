//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../proxy/Proxy3.sol";
import "./L2PublicSaleVaultStorage.sol";

import "../../libraries/SafeERC20.sol";
// import '../../libraries/LibProject.sol';

import "hardhat/console.sol";

contract L2PublicSaleVaultProxy is Proxy3, L2PublicSaleVaultStorage
{
    using SafeERC20 for IERC20;

    /* ========== onlyOwner(proxyContractOwner) ========== */

    /* ========== only L2ProjectManager ========== */

    /* ========== only VaultAdmin ========== */

    /* ========== VIEW ========== */

}