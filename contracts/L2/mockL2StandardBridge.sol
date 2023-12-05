//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../libraries/SafeERC20.sol";

contract mockL2StandardBridge {
    using SafeERC20 for IERC20;

    function withdrawTo(
        address _l2Token,
        address _to,
        uint256 _amount,
        uint32 _l1Gas,
        bytes calldata _data
    ) external virtual {
        IERC20(_l2Token).safeTransfer(_to,_amount);
    }
}