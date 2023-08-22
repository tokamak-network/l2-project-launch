// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../proxy/ProxyStorage2.sol";
import "./L1StosInL2Storage.sol";
import "hardhat/console.sol";

contract L1StosInL2 is ProxyStorage2, L1StosInL2Storage {
    // using SafeMath for uint256;
    using Address for address;
    using Strings for uint256;

    modifier nonZero(uint256 _val) {
        require(_val != 0, "zero value");
        _;
    }

    constructor (address managerAddress) {
        _manager = managerAddress;
    }

}
