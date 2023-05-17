// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/* Contract Imports */
import { L1TokenFactory } from "./L1TokenFactory.sol";
import { ERC20C } from "../tokens/ERC20C.sol";

/**
 * @title L1ERC20C_TokenFactory
 * @dev
 */
contract L1ERC20C_TokenFactory is L1TokenFactory {

    event CreatedERC20C(address contractAddress, string name, string symbol, uint256 initialSupply, address to);

    function create(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        address owner
    ) external override returns (address) {
        require(owner != address(0), "owner address is zero");
        require(initialSupply != 0, "ERC20C is non mintable, so initialSupply must be greater than zero.");

        require(bytes(name).length > 0, "name is empty");
        require(bytes(symbol).length > 0, "symbol is empty");

        ERC20C token = new ERC20C(name, symbol, initialSupply, owner);
        require(address(token) != address(0), "token zero");

        createdContracts[totalCreatedContracts] = ContractInfo(address(token), name, symbol);
        totalCreatedContracts++;

        emit CreatedERC20C(address(token), name, symbol, initialSupply, owner);

        return address(token);
    }

}