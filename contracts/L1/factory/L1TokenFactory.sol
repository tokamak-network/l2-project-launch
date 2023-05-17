// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/IERC20Factory.sol";

/**
 * @title L1TokenFactory
 * @dev
 */
abstract contract L1TokenFactory is IERC20Factory {

    struct ContractInfo {
        address contractAddress;
        string name;
        string symbol;
    }

    /// @dev Total number of contracts created
    uint256 public totalCreatedContracts ;

    /// @dev Contract information by index
    mapping(uint256 => ContractInfo) public createdContracts;

    /// @dev constructor of ERC20AFactory
    constructor() {
        totalCreatedContracts = 0;
    }

    function create(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        address owner
    ) external override virtual returns (address);

    /// @inheritdoc IERC20Factory
    function lastestCreated() external view override returns (address contractAddress, string memory name, string memory symbol){
        if(totalCreatedContracts > 0){
            return (createdContracts[totalCreatedContracts-1].contractAddress, createdContracts[totalCreatedContracts-1].name, createdContracts[totalCreatedContracts-1].symbol );
        }else {
            return (address(0), '', '');
        }
    }

    /// @inheritdoc IERC20Factory
    function getContracts(uint256 _index) external view override returns (address contractAddress, string memory name, string memory symbol){
        if(_index < totalCreatedContracts){
            return (createdContracts[_index].contractAddress, createdContracts[_index].name, createdContracts[_index].symbol);
        }else {
            return (address(0), '', '');
        }
    }

}