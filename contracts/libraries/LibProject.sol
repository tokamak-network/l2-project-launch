// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface AddressManagerI {
    function getAddress(string memory _name) external view returns (address);
}

/**
 * @title LibProject
 */
library LibProject {

    enum TOKEN_TYPE {
        ERC20_A,
        ERC20_B,
        ERC20_C,
        ERC20_D,
        NONE
    }

    enum L2_TYPE {
        TOKAMAL_OPTIMISM,
        TOKAMAL_ZKEVM,
        NONE
    }

    struct ProjectInfo {
        address projectOwner;
        address tokenOwner;
        address l1Token;
        address l2Token;
        address addressManager;
        uint256 initialTotalSupply;
        uint8 tokenType;
        uint8 l2Type;
        string projectName;
    }

    struct L2Info {
        address l2TokenFactory;
        address l2ProjectManager;
        uint32 depositMinGasLimit;
        uint32 sendMsgMinGasLimit;
    }

    struct L2ProjectInfo {
        uint256 projectId;
        address projectOwner;
        address l1Token;
        address l2Token;
        string projectName;
    }

    struct TokamakVaults {
        InitalParameterPublicSaleVault publicSaleParams;
        InitalParameterInitialLiquidityVault initialVaultParams;
        InitalParameterLiquidityRewardVault rewardParams;
        InitalParameterScheduleVault tosAirdropParams;
        InitalParameterScheduleVault tonAirdropParams;
    }

    struct InitalParameterPublicSale {
        InitalParameterPublicSaleVault vaultParams;
        InitalParameterPublicSaleClaim claimParams;
        InitalParameterVestingFundVault vestingParma;
    }

    struct InitalParameterPublicSaleVault {
        uint256 stosTier1;
        uint256 stosTier2;
        uint256 stosTier3;
        uint256 stosTier4;
        uint256 tier1Percents;
        uint256 tier2Percents;
        uint256 tier3Percents;
        uint256 tier4Percents;
        uint256 total1roundSaleAmount;
        uint256 total2roundSaleAmount;
        uint256 saleTokenPrice;
        uint256 payTokenPrice;
        uint256 hardcapAmount;
        uint256 changeTOSPercent;
        uint256 startWhiteTime;
        uint256 endWhiteTime;
        uint256 start1roundTime;
        uint256 end1roundTime;
        uint256 snapshotTime;
        uint256 start2roundTime;
        uint256 end2roundTime;
    }

    struct InitalParameterPublicSaleClaim {
        uint256 claimCounts;
        uint256 firstClaimPercent;
        uint256 firstClaimTime;
        uint256 secondClaimTime;
        uint256 roundInterval;
    }

    struct InitalParameterVestingFundVault {
        address receiveAddress;
        uint256 totalClaimCount;
        uint256 firstClaimPercent;
        uint256 firstClaimTime;
        uint256 secondClaimTime;
        uint256 roundIntervalTime;
        uint24 fee;
    }

    // struct InitalParameterPublicSaleClaim {
    //     uint256[] claimTimes;
    //     uint256[] claimPercents;
    // }

    struct InitalParameterInitialLiquidityVault {
        uint256 totalAllocatedAmount;
        uint256 tosPrice;
        uint256 tokenPrice;
        uint256 initSqrtPrice;
        uint256 startTime;
        uint16 fee;
    }

    struct InitalParameterLiquidityRewardVault {
        address poolAddress;
        InitalParameterScheduleVault params;
    }

    struct InitalParameterScheduleVault {
        uint256 totalAllocatedAmount;
        uint256 totalClaimCount;
        uint256 firstClaimAmount;
        uint32 firstClaimTime;
        uint32 secondClaimTime;
        uint32 roundIntervalTime;
    }

    struct InitalParameterNonScheduleVault {
        uint256 totalAllocatedAmount;
    }


    // function decodeVautlts(DistributeVault[] memory vaults)
    //     public pure returns (bytes memory data)
    // {
    //     for(uint256 i = 0; i < vaults.length; i++){
    //         data = abi.encodePacked(data, vaults[i].vaultNumber, vaults[i].amount);
    //     }
    // }

    function getL1CommunicationMessenger(address addressManager) external view returns(address _address) {
        if (addressManager == address(0)) return address(0);
        try
            AddressManagerI(addressManager).getAddress('Proxy__OVM_L1CrossDomainMessenger') returns (address a) {
                _address = a;
        } catch (bytes memory ) {
            _address = address(0);
        }
    }

    function getL1Bridge(address addressManager) external view returns(address _address) {
        if (addressManager == address(0)) return address(0);
        try
            AddressManagerI(addressManager).getAddress('Proxy__OVM_L1StandardBridge') returns (address a) {
                _address = a;
        } catch (bytes memory ) {
            _address = address(0);
        }
    }

    function validateTokamakVaults(TokamakVaults memory tokamakVaults)
    public pure returns (bool boolValidate, uint256 totalAmount) {

        if ( (tokamakVaults.publicSaleParams.total1roundSaleAmount + tokamakVaults.publicSaleParams.total2roundSaleAmount) == 0 ||
            tokamakVaults.initialVaultParams.totalAllocatedAmount == 0 ||
            tokamakVaults.rewardParams.params.totalAllocatedAmount == 0 ||
            tokamakVaults.tosAirdropParams.totalAllocatedAmount == 0 ||
            tokamakVaults.tonAirdropParams.totalAllocatedAmount == 0
        ) return (boolValidate, totalAmount);

        if (tokamakVaults.initialVaultParams.tosPrice == 0 ||
            tokamakVaults.initialVaultParams.tokenPrice == 0 ||
            tokamakVaults.initialVaultParams.initSqrtPrice == 0 ||
            tokamakVaults.initialVaultParams.startTime == 0 ||
            tokamakVaults.initialVaultParams.fee == 0) return (boolValidate, totalAmount);

        if (tokamakVaults.rewardParams.poolAddress == address(0) ||
            tokamakVaults.rewardParams.params.totalClaimCount == 0 ||
            tokamakVaults.rewardParams.params.firstClaimAmount == 0 ||
            tokamakVaults.rewardParams.params.firstClaimTime == 0 ||
            tokamakVaults.rewardParams.params.secondClaimTime == 0 ||
            tokamakVaults.rewardParams.params.roundIntervalTime == 0
            ) return (boolValidate, totalAmount);

        if (tokamakVaults.tosAirdropParams.totalClaimCount == 0 ||
            tokamakVaults.tosAirdropParams.firstClaimAmount == 0 ||
            tokamakVaults.tosAirdropParams.firstClaimTime == 0 ||
            tokamakVaults.tosAirdropParams.secondClaimTime == 0 ||
            tokamakVaults.tosAirdropParams.roundIntervalTime == 0
            ) return (boolValidate, totalAmount);

        if (tokamakVaults.tonAirdropParams.totalClaimCount == 0 ||
            tokamakVaults.tonAirdropParams.firstClaimAmount == 0 ||
            tokamakVaults.tonAirdropParams.firstClaimTime == 0 ||
            tokamakVaults.tonAirdropParams.secondClaimTime == 0 ||
            tokamakVaults.tonAirdropParams.roundIntervalTime == 0
            ) return (boolValidate, totalAmount);

        boolValidate = true;
        totalAmount = (tokamakVaults.publicSaleParams.total1roundSaleAmount + tokamakVaults.publicSaleParams.total2roundSaleAmount) +
                    tokamakVaults.initialVaultParams.totalAllocatedAmount +
                    tokamakVaults.rewardParams.params.totalAllocatedAmount +
                    tokamakVaults.tosAirdropParams.totalAllocatedAmount +
                    tokamakVaults.tonAirdropParams.totalAllocatedAmount ;

    }

    function validateScheduleVault(
        InitalParameterScheduleVault[] memory customs
    ) public pure returns (bool boolValidate, uint256 totalAmount) {

        if (customs.length != 0) {
            for(uint256 i = 0; i < customs.length; i++){
                if (customs[i].totalAllocatedAmount == 0 ||
                    customs[i].totalClaimCount == 0 ||
                    customs[i].firstClaimAmount == 0 ||
                    customs[i].firstClaimTime == 0 ||
                    customs[i].secondClaimTime == 0 ||
                    customs[i].roundIntervalTime == 0
                    ) return (boolValidate, totalAmount);

                totalAmount += customs[i].totalAllocatedAmount;
            }
            boolValidate = true;
        }
    }

    function validateNonScheduleVault(
        InitalParameterNonScheduleVault[] memory customs
    ) public pure returns (bool boolValidate, uint256 totalAmount) {

        if (customs.length != 0) {
            for(uint256 i =0 ; i < customs.length; i++){
                if (customs[i].totalAllocatedAmount == 0) return (boolValidate, totalAmount);
                totalAmount += customs[i].totalAllocatedAmount;
            }
            boolValidate = true;
        }
    }

}