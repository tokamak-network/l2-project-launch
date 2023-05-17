// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

/* Contract Imports */
import { L1TokenFactory } from "./L1TokenFactory.sol";
import { ERC20D } from "../tokens/ERC20D.sol";

/**
 * @title L1ERC20D_TokenFactory
 * @dev
 */
contract L1ERC20D_TokenFactory is L1TokenFactory {

    event CreatedERC20D(address contractAddress, string name, string symbol, uint256 initialSupply, address owner);

    function create(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        address owner
    ) external override returns (address) {
        require(owner != address(0), "owner address is zero");

        require(bytes(name).length > 0, "name is empty");
        require(bytes(symbol).length > 0, "symbol is empty");

        ERC20D token = new ERC20D(name, symbol, initialSupply, owner);
        require(address(token) != address(0), "token zero");

        createdContracts[totalCreatedContracts] = ContractInfo(address(token), name, symbol);
        totalCreatedContracts++;

        emit CreatedERC20D(address(token), name, symbol, initialSupply, owner);

        return address(token);
    }

}