//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibPublicSaleVault } from "../../libraries/LibPublicSaleVault.sol";

contract L2PublicSaleVaultStorage {
    uint24 public constant poolFee = 3000;
    
    address public quoter;
    address public vestingFund;
    address public liquidityVault;
    address public uniswapRouter;
    
    address public lockTOS;
    address public tos;
    address public ton;

    //관리자가 설정하는 min,maxPer (changeTOS를 결정할 수 있는 범위)
    uint8 public minPer;    //현재는 소수점 자리수가 없이 사용되어서 uint8(0~255까지 범위)이 사용됨.
    uint8 public maxPer;

    //관리자가 설정하는 stanTier
    uint256 public stanTier1;     //최소 기준 Tier1 기준이 제일 작음
    uint256 public stanTier2;     //최소 기준 Tier2
    uint256 public stanTier3;     //최소 기준 Tier3
    uint256 public stanTier4;     //최소 기준 Tier4 기준이 제일 큼

    //관리자가 설정하는 changeTick
    int24 public changeTick;    //TON -> TOS로 변경할때 허용되는 Tick 범위

    //관리자가 설정하는 contract를 deploy 후 snapshot을 지정할 수 있는 최소 시간 간격
    uint256 public delayTime;

    //L2PublicSale을 manage하는 manager
    address public l2ProjectManager;
    
    bool internal free = true;
    
    //l2token이 기준이 된다. (l2token - tokenOwner)
    mapping(address => address) public vaultAdminOfToken;

    // l2token - timeInfo
    mapping(address => LibPublicSaleVault.TokenTimeManage) public timeInfo;

    // l2token - manageInfo
    mapping(address => LibPublicSaleVault.TokenSaleManage) public manageInfo;

    modifier onlyL2ProjectManager() {
        require(l2ProjectManager != address(0) && msg.sender == l2ProjectManager, "caller is not l2ProjectManager");
        _;
    }

    modifier onlyVaultAdminOfToken(address l2token) {
        require(vaultAdminOfToken[l2token] != address(0) && msg.sender == vaultAdminOfToken[l2token], "caller is not a vaultAdmin Of l2Token");
        _;
    }

    modifier nonZero(uint256 value) {
        require(value != 0, "Z1");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Z2");
        _;
    }

    modifier ifFree {
        require(free, "lock");
        free = false;
        _;
        free = true;
    }
}
