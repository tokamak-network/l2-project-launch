//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { ProxyStorage } from "../../proxy/ProxyStorage.sol";
import { AccessibleCommon } from "../../common/AccessibleCommon.sol";
import { L2VestingFundVaultStorage } from "./L2VestingFundVaultStorage.sol";

import { LibVestingFundVault } from "../../libraries/LibVestingFundVault.sol";

// import "hardhat/console.sol";

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
    // using SafeERC20 for IERC20;


    ///@dev constructor
    constructor() {

    }

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
        uint256 _claimCounts,
        uint256 _firstClaimPercents,
        uint256 _firstClaimTime,
        uint256 _secondClaimTime,
        uint256 _roundInterval
    )
        external
        onlyOwner
    {
        _initialize(
            _l2Token,
            _claimCounts,
            _firstClaimPercents,
            _firstClaimTime,
            _secondClaimTime,
            _roundInterval
        );

        if(settingChecks[_l2Token] != true) settingChecks[_l2Token] = true;
    }

    function initialize(
        address _l2Token,
        address _receivedAddress,
        uint256 _claimCounts,
        uint256 _firstClaimPercents,
        uint256 _firstClaimTime,
        uint256 _secondClaimTime,
        uint256 _roundInterval,
        uint24 _fee
    )
        external
        nonZeroAddress(_l2Token)
        nonZeroAddress(_receivedAddress)
        // onlyVaultAdminOfToken(_l2Token)
        onlyL2PublicSale
    {

        require(settingChecks[_l2Token] != true, "Already initalized");
        receivedAddress[_l2Token] = _receivedAddress;
        fees[_l2Token] = _fee;

        _initialize(
            _l2Token,
            _claimCounts,
            _firstClaimPercents,
            _firstClaimTime,
            _secondClaimTime,
            _roundInterval
        );

        settingChecks[_l2Token] = true;
    }

    function _initialize(
        address _l2Token,
        uint256 _claimCounts,
        uint256 _firstClaimPercents,
        uint256 _firstClaimTime,
        uint256 _secondClaimTime,
        uint256 _roundInterval
    )
        internal
    {

        require(_claimCounts != 0,
                "claimCounts must be greater than zero");

        LibVestingFundVault.VaultInfo storage info = vaultInfo[_l2Token];
        info.totalClaimCount = _claimCounts;
        info.firstClaimPercents = _firstClaimPercents;
        info.firstClaimTime = _firstClaimTime;
        info.secondClaimTime = _secondClaimTime;
        info.roundInterval = _roundInterval;

        emit InitializedL2VestingFundVault(_l2Token, _claimCounts, _firstClaimPercents, _firstClaimTime, _secondClaimTime, _roundInterval);
    }

    function claim(
        address _l2Token
    )
        public
        payable
    {
        // require(currentSqrtPriceX96(_l2Token) != 0, "pool's current sqrtPriceX96 is zero.");
        LibVestingFundVault.VaultInfo memory info = vaultInfo[_l2Token];
        require(info.firstClaimTime != 0 && block.timestamp > info.firstClaimTime, "Vault: not started yet");
        require(totalAllocatedAmount[_l2Token] > totalClaimsAmount[_l2Token],"Vault: already All get");
        _claim(_l2Token);
    }

    function _claim(
        address _l2Token
    )
        internal
    {
        uint256 curRound = currentRound(_l2Token);
        uint256 amount = calculClaimAmount(_l2Token);
        require(amount > 0, "claimable amount is zero");
        require(address(this).balance >= amount,"Vault: insufficient balance");
        require(remainAmount(_l2Token) >= amount,"Vault: over remain balance");

        nowClaimRound[_l2Token] = curRound;
        totalClaimsAmount[_l2Token] = totalClaimsAmount[_l2Token] + amount;

        // IERC20(tonToken).transfer(receivedAddress[_l2Token], amount);
        payable(receivedAddress[_l2Token]).call{value: amount};

        emit Claimed(msg.sender, receivedAddress[_l2Token], amount);
    }

    function funding(
        address _l2Token
    )
        external
        payable
        onlyL2PublicSale
    {
        // require(currentSqrtPriceX96(_l2Token) != 0, "pool's current sqrtPriceX96 is zero.");
        LibVestingFundVault.VaultInfo memory info = vaultInfo[_l2Token];
        require(info.totalClaimCount != 0, "set up a claim round for vesting");

        require(msg.sender == publicSaleVault, "caller is not publicSaleVault.");
        // require(IERC20(tonToken).allowance(publicSaleVault, address(this)) >= amount, "funding: insufficient allowance");
        totalAllocatedAmount[_l2Token] += msg.value;

        // IERC20(tonToken).transferFrom(publicSaleVault, address(this), amount);

        emit Funded(msg.sender, msg.value);

        uint256 curRound = currentRound(_l2Token);

        if (curRound > 0 && calculClaimAmount(_l2Token) > 0 && totalAllocatedAmount[_l2Token] > totalClaimsAmount[_l2Token]) {
            _claim(_l2Token);
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
        LibVestingFundVault.VaultInfo memory info = vaultInfo[_l2Token];
        if(info.firstClaimTime == 0) return 0;
        if(info.firstClaimTime > block.timestamp) return 0;
        if(info.firstClaimTime != 0 && info.firstClaimTime <= block.timestamp && block.timestamp < info.secondClaimTime) {
            round = 1;
        } else if(info.secondClaimTime <= block.timestamp) {
            round = (block.timestamp - info.secondClaimTime) / info.roundInterval + 2;
        }
        if (round > info.totalClaimCount) round = info.totalClaimCount;
    }

    function calculClaimAmount(
        address _l2Token
    )
        public
        view
        returns (uint256 amount)
    {
        uint256 curRound = currentRound(_l2Token);
        if (curRound == 0) return 0;

        LibVestingFundVault.VaultInfo memory info = vaultInfo[_l2Token];
        if(nowClaimRound[_l2Token] < curRound) {
            if (curRound == 1) {
                amount = totalAllocatedAmount[_l2Token]*info.firstClaimPercents/(10000) - totalClaimsAmount[_l2Token];
            } else if (curRound < info.totalClaimCount) {
                amount = totalAllocatedAmount[_l2Token]*info.firstClaimPercents/(10000);
                amount = (amount + ((totalAllocatedAmount[_l2Token] - amount)/(info.totalClaimCount-1) * (curRound -1))) - totalClaimsAmount[_l2Token];
            } else {
                amount = totalAllocatedAmount[_l2Token] - totalClaimsAmount[_l2Token];
            }
        }
    }

    function remainAmount(
        address _l2Token
    )
        public
        view
        returns (uint256 amount)
    {
        return totalAllocatedAmount[_l2Token] - totalClaimsAmount[_l2Token];
    }

    function getPoolAddress(
        address _l2Token
    )
        public
        view
        returns (address pool)
    {
        //L2에서는 변경되어야함
        bytes32 POOL_INIT_CODE_HASH = 0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

        if (tosToken == address(0) || _l2Token == address(0) || fees[_l2Token] == 0
            || uniswapV3Factory == address(0) )  return address(0);

        address token0 = tosToken;
        address token1 = _l2Token;
        if (tosToken > _l2Token) {
            token0 = _l2Token;
            token1 = tosToken;
        }

        pool = address(
            uint160(
            uint256(
                keccak256(
                    abi.encodePacked(
                        hex'ff',
                        uniswapV3Factory,
                        keccak256(abi.encode(token0, token1, fees[_l2Token])),
                        POOL_INIT_CODE_HASH
                    )
                )
            ))
        );
    }

    function currentSqrtPriceX96(
        address _l2Token
    )
        public
        view
        returns (uint160 sqrtPriceX96)
    {
        sqrtPriceX96 = 0;
        address pool = getPoolAddress(_l2Token);
        // console.log("pool", pool);
        if (pool != address(0) && isContract(pool)) {
            // (,tick,,,,,) = IIUniswapV3Pool(pool).slot0();
            (sqrtPriceX96,,,,,,) = IIUniswapV3Pool(pool).slot0();
        }
    }

    function isContract(address _addr) public view returns (bool _isContract) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    // function availableInitializer(
    //     address _l2Token,
    //     address _addr
    // )
    //     external
    //     view
    //     returns (bool result)
    // {
    //     if (!settingCheck && (_addr == receivedAddress || isAdmin(_addr))) result = true;
    // }

    // function isL2PublicSale(address account) public view returns (bool) {
    //     return (account != address(0) && publicSaleVault == account);
    // }

    function isVaultAdmin(address l2Token, address account) public view returns (bool) {
        return (account != address(0) && vaultAdminOfToken[l2Token] == account);
    }

}