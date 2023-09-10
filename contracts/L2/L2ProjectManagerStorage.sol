// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import { LibProject } from "../libraries/LibProject.sol";

/**
 * @title L2ProjectManagerStorage
 * @dev
 */
contract L2ProjectManagerStorage {

    bool internal free = true;
    address public l1ProjectManager;
    address public l2TokenFactory;
    address public l2CrossDomainMessenger;

    // 토큰별로 대표되는 볼트
    address public publicSaleVault;
    address public initialLiquidityVault;
    address public liquidityRewardVault;
    address public tonAirdropVault;
    address public tosAirdropVault;
    address public marketingVault; // customScheduleVault
    address public teamVault; // customScheduleVault
    address public daoVault;    // customNonScheduleVault

    // l2token - L2ProjectInfo
    mapping(address => LibProject.L2ProjectInfo) public projects;

    // l1token - l2token
    mapping(address => address) public tokenMaps;

}
