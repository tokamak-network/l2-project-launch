//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


contract L2PublicSaleVaultStorage {
    uint24 public constant poolFee = 3000;
    
    address public quoter;
    address public vestingFund;
    address public liquidityVault;
    
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

    //관리자가 설정하는 contract를 deploy 후 snapshot을 지정할 수 있는 최소 시간 간격
    uint256 public delayTime;
    
}
