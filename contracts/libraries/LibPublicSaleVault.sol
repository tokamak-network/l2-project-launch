// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title LibPublicSaleVault
 */
library LibPublicSaleVault {

    struct TokenTimeManage {
        uint256 deployTime;
        uint256 snapshot;
        uint256 whiteListStartTime;
        uint256 whiteListEndTime;
        uint256 round1StartTime;
        uint256 round1EndTime;
        uint256 round2StartTime;
        uint256 round2EndTime;
        uint256 claimTime;
    }

    struct TokenSaleManage {
        uint256 total1stSaleAmount;      //Token을 판매한 양
        uint256 total1stTONAmount;       //Token판매로 받은 TON양
        uint256 total2rdDepositAmount;
        uint256 set1stTokenAmount;
        uint256 set2rdTokenAmount;
        uint256 saleTokenPrice;
        uint256 tonPrice;
        uint256 claimInterval;          //클레임 간격 (epochtime)
        uint256 claimPeriod;            //클레임 횟수
        uint256 claimFirst;             //초기 클레임 percents
        uint256 totalClaimCounts;       //총 클레임 수
        uint256 hardCap;                //softcap 수량 (판매 최저 하한선)
        uint256 changeTOS;              //TON -> TOS로 변경하는 %
        bool exchangeTOS;               //TON -> TOS로 변경하였는지 체크
        bool adminWithdraw;             //withdraw함수를 실행하였는지 체크
    }

    struct TokenSaleInfo {
        uint256 totalUsers;             //전체 세일 참여자 (라운드1,라운드2 포함, 유니크)
        uint256 totalRound1Users;       //라운드 1 참여자
        uint256 totalRound2Users;       //라운드 2 참여자
        uint256 totalRound2UsersClaim;  //라운드 2 참여자중 claim한사람
    }

}