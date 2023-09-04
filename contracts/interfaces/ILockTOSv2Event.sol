//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface ILockTOSv2Event {

 event LockCreated(
        address account,
        uint256 lockId,
        uint256 value,
        uint256 unlockTime
    );
    event LockAmountIncreased(address account, uint256 lockId, uint256 value);
    event LockUnlockTimeIncreased(
        address account,
        uint256 lockId,
        uint256 unlockTime
    );
    event LockIncreased(address account, uint256 lockId, uint256 value, uint256 unlockTime);
    event LockDeposited(address account, uint256 lockId, uint256 value);
    event LockWithdrawn(address account, uint256 lockId, uint256 value);
    event IncreasedUnlimitedLock(address caller, address account, uint256 amount);
    event DecreasedUnlimitedLock(address caller, address account, uint256 amount);
    event TransferUnlimitedLock(address from, address to, uint256 amount);

}
