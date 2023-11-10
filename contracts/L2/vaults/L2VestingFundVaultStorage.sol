// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title L2VestingFundVaultStorage
 * @dev
 */
contract L2VestingFundVaultStorage {

    bool internal free = true;
    address public l2ProjectManager;
    // address public initializer;

    address public publicSaleVault;

    address public tonToken;
    address public tosToken;
    address public uniswapV3Factory;

    // address public projectToken;

    // // l2token - projectToken
    // mapping(address => address) public projectToken;

    // l2token - tokenOwner
    mapping(address => address) public vaultAdminOfToken;

    // l2token - receivedAddress
    mapping(address => address) public receivedAddress;
    
    // l2token - fee
    mapping(address => uint24) public fees;          

    // l2token - settingCheck
    mapping(address => bool) public settingChecks;

    // l2token - claimTimes
    mapping(address => uint256[]) public claimTimes;            

    // l2token - claimPercents
    mapping(address => uint256[]) public claimAmounts;

    // l2token - totalAllocatedAmount
    mapping(address => uint256) public totalAllocatedAmount;
    
    // l2token - totalClaimsAmount
    mapping(address => uint256) public totalClaimsAmount;

    // l2token - totalClaimCounts
    mapping(address => uint256) public totalClaimCounts;

    // l2token - nowClaimRound
    mapping(address => uint256) public nowClaimRound;


    event SetVaultAdmin(
        address l2Token, 
        address newAdmin
    );
    
    event SetInitializer(
        address newInitializer
    );

    event Initialized(
        uint256 claimCounts,
        uint256[] claimTimes,
        uint256[] claimAmounts
    );

    
    event Claimed(
        address l2Token, 
        address to, 
        uint256 amount
    );

    event Funded(
        address from,
        uint256 amount
    );

    modifier onlyL2ProjectManager() {
        require(l2ProjectManager != address(0) && msg.sender == l2ProjectManager, "caller is not l2ProjectManager");
        _;
    }

    modifier onlyVaultAdminOfToken(address l2token) {
        require(vaultAdminOfToken[l2token] != address(0) && msg.sender == vaultAdminOfToken[l2token], "caller is not a vaultAdmin Of l2Token");
        _;
    }

    // modifier onlyInitializerOrVaultAdmin(address l2token) {
    //     require(vaultAdminOfToken[l2token] != address(0) &&
    //         ( msg.sender == initializer || msg.sender == vaultAdminOfToken[l2token]),
    //         "caller is not a vaultAdmin Of l2Token");
    //     _;
    // }

    modifier onlyL2PublicSaleVault() {
        require(publicSaleVault != address(0) && msg.sender == publicSaleVault, "caller is not publicSaleVault");
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