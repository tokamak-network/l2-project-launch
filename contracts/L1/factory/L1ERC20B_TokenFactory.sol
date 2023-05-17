// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

/* Contract Imports */
import { L1TokenFactory } from "./L1TokenFactory.sol";
import { ERC20B } from "../tokens/ERC20B.sol";

/**
 * @title L1ERC20B_TokenFactory
 * @dev
 */
contract L1ERC20B_TokenFactory is L1TokenFactory {

    event CreatedERC20B(address contractAddress, string name, string symbol, uint256 initialSupply, address owner);

    function create(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        address owner
    ) external override returns (address) {
        require(owner != address(0), "owner address is zero");

        require(bytes(name).length > 0, "name is empty");
        require(bytes(symbol).length > 0, "symbol is empty");

        ERC20B token = new ERC20B(name, symbol, initialSupply, owner);
        require(address(token) != address(0), "token zero");

        createdContracts[totalCreatedContracts] = ContractInfo(address(token), name, symbol);
        totalCreatedContracts++;

        emit CreatedERC20B(address(token), name, symbol, initialSupply, owner);

        return address(token);
    }

}