// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import { LibProject } from "../libraries/LibProject.sol";

/**
 * @title L1ProjectManagerStorage
 * @dev
 */
contract L1ProjectManagerStorage {

    bool internal free = true;

    uint256 public projectCount;

    // TOKEN_TYPE - l1TokenFactory
    mapping(uint8 => address) public l1TokenFactory;

    // projectIndex - ProjectInfo
    mapping(uint256 => LibProject.ProjectInfo) public projects;

    // l1TokenAddress - projectIndex
    mapping(address => uint256) public projectTokens;

    // l2type - l2TokenFactory
    mapping(uint8 => LibProject.L2Info) public l2Info;

    // 기본 볼트 주소 번호 및  배포정보 보내기
    // publicSale, initialLiquidity, daoVault, tosAirdrop, tonAirdrop,
    // 1,           2,               3,          4,        5


    modifier onlyProjectOwner(uint256 projectid) {
        require(projects[projectid].projectOwner != address(0) &&
            msg.sender == projects[projectid].projectOwner, "caller is not projectOwner.");
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