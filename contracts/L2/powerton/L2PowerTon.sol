// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "../../libraries/BytesLib.sol";

import "../../proxy/ProxyStorage2.sol";
import "./L2PowerTonStorage.sol";

// import "hardhat/console.sol";

interface IL2DividendPoolForStos {
    function distribute(address token, uint256 amount) external ;
}

interface IUniversalStos {
    function totalSupply() external view returns (uint256 amount);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256 amount);
}

contract L2PowerTon is ProxyStorage2, L2PowerTonStorage {
    using BytesLib for bytes;
    address constant NativeTonAddress = address(0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000);

    modifier nonZero(uint256 _val) {
        require(_val != 0, "zero value");
        _;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "not owner");
        _;
    }

    function initialize(
        address _l2DividendPoolForStos,
        address _universalStos
    ) external onlyOwner {
        l2DividendPoolForStos = _l2DividendPoolForStos;
        universalStos = _universalStos;
    }

    function setL2DividendPoolForStos(address _l2DividendPoolForStos) external onlyOwner {
        require(l2DividendPoolForStos != _l2DividendPoolForStos, "same");
        l2DividendPoolForStos = _l2DividendPoolForStos;
    }

    /*** Public ***/

    /// distribute the token that this contract is holding
    /// @param token token address to dividend
    function distribute(address token) public {
        uint256 stosTotal = IUniversalStos(universalStos).totalSupply();

        if (stosTotal != 0) {
            if (token != NativeTonAddress) {
                uint256 amount = IERC20(token).balanceOf(address(this));
                require (amount > 1 ether, "balance is less than 1 ether.");
                IL2DividendPoolForStos(l2DividendPoolForStos).distribute(token, amount);
            } else {
                uint256 amount = address(this).balance;
                require (amount != 0, "zero balance");
                bytes memory callData = abi.encodeWithSelector(
                    IL2DividendPoolForStos.distribute.selector,
                    token,
                    amount);
                (bool success,) = l2DividendPoolForStos.call{value:amount}(callData);
                require(success, "fail distribute");
            }
        }
    }

}
