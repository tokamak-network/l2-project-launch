// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/* Contract Imports */
import { L1TokenFactory } from "./L1TokenFactory.sol";
import { ERC20A } from "../tokens/ERC20A.sol";

/**
 * @title L1ERC20A_TokenFactory
 * @dev
 */
contract L1ERC20A_TokenFactory is L1TokenFactory {

    event CreatedERC20A(address contractAddress, string name, string symbol, uint256 initialSupply, address to);

    function create(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        address to
    ) external override returns (address) {
        require(to != address(0), "to address is zero");
        require(initialSupply != 0, "ERC20A is non mintable, so initialSupply must be greater than zero.");

        require(bytes(name).length > 0, "name is empty");
        require(bytes(symbol).length > 0, "symbol is empty");

        ERC20A token = new ERC20A(name, symbol, initialSupply, to);
        require(address(token) != address(0), "token zero");

        createdContracts[totalCreatedContracts] = ContractInfo(address(token), name, symbol);
        totalCreatedContracts++;

        emit CreatedERC20A(address(token), name, symbol, initialSupply, to);

        return address(token);
    }


}