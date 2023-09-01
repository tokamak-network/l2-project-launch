// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../common/AccessibleCommon.sol";
import "./LockTOSv2Storage.sol";

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/math/SignedSafeMath.sol";

import "../libraries/LibLockTOSv2.sol";
import "../interfaces/ILockTOSv2.sol";
import "../interfaces/ITOS.sol";
import "hardhat/console.sol";

contract LockTOSv2 is LockTOSv2Storage, AccessibleCommon, ILockTOSv2 {
    using SafeMath for uint256;
    using SafeCast for uint256;
    using SignedSafeMath for int256;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    event Approval(address from, address to, uint256 tokenId);

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

    /// @dev Check if a function is used or not
    modifier ifFree {
        require(free == 1, "LockId is already in use");
        free = 0;
        _;
        free = 1;
    }

    constructor() {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
        lockIdCounter = 0;
        cumulativeEpochUnit = 0;
        cumulativeTOSAmount = 0;
    }

    function initialize(
        address _tos,
        uint256 _epochUnit,
        uint256 _maxTime
    ) external onlyOwner {
        require(tos == address(0), "Already initialized");
        tos = _tos;
        epochUnit = _epochUnit;
        maxTime = _maxTime;
    }

    /// @inheritdoc ILockTOSv2
    function setMaxTime(uint256 _maxTime) external override onlyOwner {
        maxTime = _maxTime;
    }

    /// @inheritdoc ILockTOSv2
    function needCheckpoint() external override view returns (bool need) {
        uint256 len = pointHistory.length;
        if (len == 0) {
            return true;
        }
        need = (block.timestamp - pointHistory[len - 1].timestamp) > epochUnit; // if the last record was within a week
    }

    /// @inheritdoc ILockTOSv2
    function increaseAmount(uint256 _lockId, uint256 _value) external override {
        depositFor(msg.sender, _lockId, _value);
    }

    /// @inheritdoc ILockTOSv2
    function allHolders() external override view returns (address[] memory) {
        return uniqueUsers;
    }

    /// @inheritdoc ILockTOSv2
    function activeHolders() external override view returns (address[] memory) {
        bool[] memory activeCheck = new bool[](uniqueUsers.length);
        uint256 activeSize = 0;
        for (uint256 i = 0; i < uniqueUsers.length; ++i) {
            uint256[] memory activeLocks = activeLocksOf(uniqueUsers[i]);
            if (activeLocks.length > 0) {
                activeSize++;
                activeCheck[i] = true;
            }
        }

        address[] memory activeUsers = new address[](activeSize);
        uint256 j = 0;
        for (uint256 i = 0; i < uniqueUsers.length; ++i) {
            if (activeCheck[i]) {
                activeUsers[j++] = uniqueUsers[i];
            }
        }
        return activeUsers;
    }

    /// @inheritdoc ILockTOSv2
    function createLockWithPermit(
        uint256 _value,
        uint256 _unlockWeeks,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override returns (uint256 lockId) {
        ITOS(tos).permit(
            msg.sender,
            address(this),
            _value,
            _deadline,
            _v,
            _r,
            _s
        );
        lockId = createLock(_value, _unlockWeeks);
    }

    function approve(address to, uint256 tokenId) public virtual {
        address owner_ = ownerOf(tokenId);
        require(to != owner_, "approval to current owner");

        require(msg.sender == owner_ || isApprovedForAll(owner_, msg.sender),
            "approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId); // internal owner
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(msg.sender, tokenId), "transfer caller is not owner nor approved");

        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual {
        require(_isApprovedOrOwner(msg.sender, tokenId), "transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        require(_exists(tokenId), "LockIdNFT: operator query for nonexistent token");
        address owner_ = ownerOf(tokenId);
        return (spender == owner_ || getApproved(tokenId) == spender || isApprovedForAll(owner_, spender));
    }

    function isApprovedForAll(address owner_, address operator) public view virtual returns (bool) {
        return _operatorApprovals[owner_][operator];
    }

    function getApproved(uint256 tokenId) public view virtual returns (address) {
        require(_exists(tokenId), "LockIdNFT: approved query for nonexistent token");

        return _tokenApprovals[tokenId];
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal virtual {
        _transfer(from, to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        // require(ownerOf(tokenId) == from, "ProjectToken: transfer of token that is not own");
        require(to != address(0), "to is zero address");

        // 기본정보 수정
        LibLockTOSv2.LockedBalance memory lock = allLocks[tokenId];
        require(lock.owner == from, "transfer of token that is not own");
        require(lock.withdrawalTime == 0, "It is withdrawn already.");
        require(lock.end > block.timestamp, "Lock time is finished");

        allLocks[tokenId].withdrawalTime = block.timestamp;
        allLocks[tokenId].owner = address(0);
        allLocks[tokenId].start = 0;
        allLocks[tokenId].end = 0;
        allLocks[tokenId].amount = 0;

        LibLockTOSv2.Point memory userPoint =
            LibLockTOSv2.Point({
                timestamp: block.timestamp,
                slope: 0,
                bias: 0
            });
        lockPointHistory[tokenId].push(userPoint);

        // 새로 락업아이디 추가 .
        uint256 newLockId = ++lockIdCounter;

        _deposit(to, newLockId, lock.amount, lock.end, false);

        userLocksCheck[to][newLockId] = true;
        userLocks[to].push(newLockId);

        emit Transfer(address(0), from, newLockId);
        emit Transfer(from, to, newLockId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        // LibLockTOSv2.LockedBalance memory token_ = allLocks[tokenId];
        address owner_ = allLocks[tokenId].owner;
        return owner_ != address(0);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return allLocks[tokenId].owner;
    }

    /// @inheritdoc ILockTOSv2
    function increaseUnlockTime(uint256 _lockId, uint256 _unlockWeeks)
        external
        override
    {
        require(_unlockWeeks > 0, "Unlock period less than a week");
        cumulativeEpochUnit = cumulativeEpochUnit.add(_unlockWeeks);

        // bool check = userLocksCheck[msg.sender][_lockId];
        // require(check, "it is not your lockId");
        LibLockTOSv2.LockedBalance memory lock = allLocks[_lockId];
        require(lock.owner == msg.sender, "lockId's owner is not caller");

        uint256 unlockTime = lock.end.add(_unlockWeeks.mul(epochUnit));
        unlockTime = unlockTime.div(epochUnit).mul(epochUnit);
        require(
            unlockTime - block.timestamp < maxTime,
            "Max unlock time is 3 years"
        );
        require(lock.end > block.timestamp, "Lock time already finished");
        require(lock.end < unlockTime, "New lock time must be greater");
        require(lock.amount > 0, "No existing locked TOS");
        _deposit(msg.sender, _lockId, 0, unlockTime, true);

        emit LockUnlockTimeIncreased(msg.sender, _lockId, unlockTime);
    }

    function increaseLock(
        address _addr,
        uint256 _lockId,
        uint256 _value,
        uint256 _unlockWeeks)
        external
    {
        require(_value > 0 || _unlockWeeks > 0, "Unlock period less than a week");
        require(_addr == msg.sender, "sender is not addr");

        // LibLockTOSv2.LockedBalance memory lock = userLocksCheck[msg.sender][_lockId];
        // bool isOwner = userLocksCheck[msg.sender][_lockId];
        // require(isOwner, "lockId's owner is not caller");

        LibLockTOSv2.LockedBalance memory lock = allLocks[_lockId];
        require(lock.owner == msg.sender, "lockId's owner is not caller");

        uint256 unlockTime = lock.end.add(_unlockWeeks.mul(epochUnit));
        unlockTime = unlockTime.div(epochUnit).mul(epochUnit);
        require(
            unlockTime - block.timestamp < maxTime,
            "Max unlock time is 3 years"
        );
        require(lock.end > block.timestamp, "Lock time already finished");
        require(lock.end < unlockTime, "New lock time must be greater");
        require(lock.amount > 0, "No existing locked TOS");

        if(_unlockWeeks > 0)
            cumulativeEpochUnit = cumulativeEpochUnit.add(_unlockWeeks);

        _deposit(msg.sender, _lockId, _value, unlockTime, true);

        emit LockIncreased(msg.sender, _lockId, _value, unlockTime);
    }

    /// @inheritdoc ILockTOSv2
    function withdrawAll() external override ifFree {
        uint256[] storage locks = userLocks[msg.sender];
        if (locks.length == 0) {
            return;
        }

        for (uint256 i = 0; i < locks.length; i++) {
            LibLockTOSv2.LockedBalance memory lock = allLocks[locks[i]];
            if (
                lock.withdrawalTime == 0 &&
                locks[i] > 0 &&
                lock.amount > 0 &&
                lock.start > 0 &&
                lock.end > 0 &&
                lock.end < block.timestamp &&
                lock.owner == msg.sender
            ) {
                _withdraw(locks[i]);
            }
        }
    }

    /// @inheritdoc ILockTOSv2
    function globalCheckpoint() external override {
        _recordHistoryPoints();
    }

    /// @inheritdoc ILockTOSv2
    function withdraw(uint256 _lockId) public override ifFree {
        require(_lockId > 0, "_lockId is zero");
        _withdraw(_lockId);
    }

    /// @dev Send staked amount back to user
    function _withdraw(uint256 _lockId) internal {

        // require(userLocksCheck[msg.sender][_lockId], "it is not your lockId");
        LibLockTOSv2.LockedBalance memory lockedOld = allLocks[_lockId];
        require(lockedOld.owner == msg.sender, "lockId's owner is not caller");
        require(lockedOld.withdrawalTime == 0, "Already withdrawn");
        require(lockedOld.start > 0, "Lock does not exist");
        require(lockedOld.end < block.timestamp, "Lock time not finished");
        require(lockedOld.amount > 0, "No amount to withdraw");

        LibLockTOSv2.LockedBalance memory lockedNew =
            LibLockTOSv2.LockedBalance({
                amount: 0,
                start: 0,
                end: 0,
                owner: address(0),
                withdrawalTime: block.timestamp
            });

        // Checkpoint
        _checkpoint(lockedNew, lockedOld);

        // Transfer TOS back
        uint256 amount = lockedOld.amount;
        // userLocksCheck[lockedOld.owner][_lockId] = true;
        allLocks[_lockId] = lockedNew;
        userLocksCheck[lockedOld.owner][_lockId] = false;

        IERC20(tos).transfer(msg.sender, amount);
        emit LockWithdrawn(msg.sender, _lockId, amount);
    }

    /// @inheritdoc ILockTOSv2
    function createLock(uint256 _value, uint256 _unlockWeeks)
        public
        override
        returns (uint256 lockId)
    {
        require(_value > 0, "Value locked should be non-zero");
        require(_unlockWeeks > 0, "Unlock period less than a week");

        cumulativeEpochUnit = cumulativeEpochUnit.add(_unlockWeeks);
        cumulativeTOSAmount = cumulativeTOSAmount.add(_value);
        uint256 unlockTime = block.timestamp.add(_unlockWeeks.mul(epochUnit));
        unlockTime = unlockTime.div(epochUnit).mul(epochUnit);
        require(
            unlockTime - block.timestamp <= maxTime,
            "Max unlock time is 3 years"
        );

        if (userLocks[msg.sender].length == 0) { // check if user for the first time
            uniqueUsers.push(msg.sender);
        }

        lockIdCounter = lockIdCounter.add(1);
        lockId = lockIdCounter;
        // console.log("lockId %s", lockId);

        _deposit(msg.sender, lockId, _value, unlockTime, true);

        userLocksCheck[msg.sender][lockId] = true;
        userLocks[msg.sender].push(lockId);

        emit LockCreated(msg.sender, lockId, _value, unlockTime);
    }

    /// @inheritdoc ILockTOSv2
    function depositFor(
        address _addr,
        uint256 _lockId,
        uint256 _value
    ) public override {
        require(_value > 0, "Value locked should be non-zero");
        // require(userLocksCheck[_addr][_lockId], "it is not your lockId");
        LibLockTOSv2.LockedBalance memory lock = allLocks[_lockId];
        require(lock.owner == _addr, "lockId's owner is not addr");
        require(lock.withdrawalTime == 0, "Lock is withdrawn");
        require(lock.start > 0, "Lock does not exist");
        require(lock.end > block.timestamp, "Lock time is finished");

        cumulativeTOSAmount = cumulativeTOSAmount.add(_value);

        _deposit(_addr, _lockId, _value, 0, true);
        emit LockDeposited(msg.sender, _lockId, _value);
    }

    /// @inheritdoc ILockTOSv2
    function totalSupplyAt(uint256 _timestamp)
        public
        view
        override
        returns (uint256)
    {
        if (pointHistory.length == 0) {
            return 0;
        }
        // console.log('-------------------totalSupplyAt _timestamp %s', _timestamp);
        (bool success, LibLockTOSv2.Point memory point) =
            _findClosestPoint(pointHistory, _timestamp);
        if (!success) {
            return 0;
        }

        point = _fillRecordGaps(point, _timestamp);
        int256 currentBias =
            point.slope * (_timestamp.sub(point.timestamp).toInt256());
        return
            uint256(point.bias > currentBias ? point.bias - currentBias : int256(0))
                .div(MULTIPLIER);
    }

    /// @inheritdoc ILockTOSv2
    function totalLockedAmountOf(address _addr) external view override returns (uint256) {
        uint256 len = userLocks[_addr].length;
        uint256 stakedAmount = 0;
        for (uint256 i = 0; i < len; ++i) {
            uint256 lockId = userLocks[_addr][i];
            if (userLocksCheck[_addr][lockId]) {
                LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];
                stakedAmount = stakedAmount.add(lock.amount);
            }
        }
        return stakedAmount;
    }

    /// @inheritdoc ILockTOSv2
    function withdrawableAmountOf(address _addr) external view override returns (uint256) {
        uint256 len = userLocks[_addr].length;
        uint256 amount = 0;
        for(uint i = 0; i < len; i++){
            uint256 lockId = userLocks[_addr][i];
            if (userLocksCheck[_addr][lockId]) {
                LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];
                if(lock.end <= block.timestamp && lock.amount > 0 && lock.withdrawalTime == 0) {
                    amount = amount.add(lock.amount);
                }
            }

        }
        return amount;
    }

    /// @inheritdoc ILockTOSv2
    function totalSupply() external view override returns (uint256) {
        if (pointHistory.length == 0) {
            return 0;
        }

        // console.log('-------------------totalSupply timestamp %s', block.timestamp);
        LibLockTOSv2.Point memory point = _fillRecordGaps(
            pointHistory[pointHistory.length - 1],
            block.timestamp
        );
        // console.log('totalSupply _fillRecordGaps point.timestamp %s' ,  point.timestamp);

        int256 currentBias =
            point.slope.mul(block.timestamp.sub(point.timestamp).toInt256());
        return
            uint256(point.bias > currentBias ? point.bias.sub(currentBias) : int256(0))
                .div(MULTIPLIER);
    }

    /// @inheritdoc ILockTOSv2
    function balanceOfLockAt(uint256 _lockId, uint256 _timestamp)
        public
        view
        override
        returns (uint256)
    {
        (bool success, LibLockTOSv2.Point memory point) =
            _findClosestPoint(lockPointHistory[_lockId], _timestamp);
        if (!success) {
            return 0;
        }
        int256 currentBias =
            point.slope.mul(_timestamp.sub(point.timestamp).toInt256());
        return
            uint256(point.bias > currentBias ? point.bias.sub(currentBias) : int256(0))
                .div(MULTIPLIER);
    }

    /// @inheritdoc ILockTOSv2
    function balanceOfLock(uint256 _lockId)
        public
        view
        override
        returns (uint256)
    {
        uint256 len = lockPointHistory[_lockId].length;
        if (len == 0) {
            return 0;
        }

        LibLockTOSv2.Point memory point = lockPointHistory[_lockId][len - 1];
        // console.log('balanceOfLock %s',  _lockId);
        // console.log('balanceOfLock point.slope');
        // console.logInt(point.slope);
        // console.log('balanceOfLock point.bias');
        // console.logInt(point.bias);
        // console.log('balanceOfLock point.timestamp');
        // console.log(point.timestamp);
        // console.log('block.timestamp %s', block.timestamp);


        int256 currentBias =
            point.slope.mul(block.timestamp.sub(point.timestamp).toInt256());

        // console.log('balanceOfLock currentBias');
        // console.logInt(currentBias);
        // uint256 bal = uint256(point.bias > currentBias ? point.bias.sub(currentBias) : int256(0));
        // console.log('balanceOfLock currentBias %s', bal);
        return
            uint256(point.bias > currentBias ? point.bias.sub(currentBias) : int256(0))
                .div(MULTIPLIER);
    }

    /// @inheritdoc ILockTOSv2
    function balanceOfAt(address _addr, uint256 _timestamp)
        public
        view
        override
        returns (uint256 balance)
    {
        uint256[] memory locks = userLocks[_addr];
        if (locks.length == 0) return 0;
        for (uint256 i = 0; i < locks.length; ++i) {
            balance = balance.add(balanceOfLockAt(locks[i], _timestamp));
        }
    }

    /// @inheritdoc ILockTOSv2
    function balanceOf(address _addr)
        public
        view
        override
        returns (uint256 balance)
    {
        uint256[] memory locks = userLocks[_addr];
        if (locks.length == 0) return 0;
        for (uint256 i = 0; i < locks.length; ++i) {
            balance = balance.add(balanceOfLock(locks[i]));
        }
    }

    /// @inheritdoc ILockTOSv2
    function locksInfo(uint256 _lockId)
        public
        view
        override
        returns (
            uint256 start,
            uint256 end,
            uint256 amount
        )
    {
        return (
            allLocks[_lockId].start,
            allLocks[_lockId].end,
            allLocks[_lockId].amount
        );
    }

    /// @inheritdoc ILockTOSv2
    function locksOf(address _addr)
        public
        view
        override
        returns (uint256[] memory)
    {
        return userLocks[_addr];
    }

    /// @inheritdoc ILockTOSv2
    function withdrawableLocksOf(address _addr)  external view override returns (uint256[] memory) {
        uint256 len = userLocks[_addr].length;
        uint256 size = 0;
        for(uint i = 0; i < len; i++){
            uint256 lockId = userLocks[_addr][i];
            LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];
            if(lock.end <= block.timestamp && lock.amount > 0 && lock.withdrawalTime == 0) {
                size++;
            }
        }

        uint256[] memory withdrawable = new uint256[](size);
        size = 0;
        for(uint i = 0; i < len; i++) {
            uint256 lockId = userLocks[_addr][i];
            LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];
            if(lock.end <= block.timestamp && lock.amount > 0 && lock.withdrawalTime == 0) {
                withdrawable[size++] = lockId;
            }
        }
        return withdrawable;
    }

    /// @inheritdoc ILockTOSv2
    function activeLocksOf(address _addr)
        public
        view
        override
        returns (uint256[] memory)
    {
        uint256 len = userLocks[_addr].length;
        uint256 _size = 0;
        for(uint i = 0; i < len; i++){
            uint256 lockId = userLocks[_addr][i];

            LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];

            if(lock.end > block.timestamp) {
                _size++;
            }
        }

        uint256[] memory activeLocks = new uint256[](_size);
        _size = 0;
        for(uint i = 0; i < len; i++) {
            uint256 lockId = userLocks[_addr][i];

            LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];
            if(lock.end > block.timestamp) {
                activeLocks[_size++] = lockId;
            }
        }
        return activeLocks;
    }

    /// @inheritdoc ILockTOSv2
    function pointHistoryOf(uint256 _lockId)
        public
        view
        override
        returns (LibLockTOSv2.Point[] memory)
    {
        return lockPointHistory[_lockId];
    }

    /// @dev Finds closest point
    function _findClosestPoint(
        LibLockTOSv2.Point[] storage _history,
        uint256 _timestamp
    ) internal view returns (bool success, LibLockTOSv2.Point memory point) {
        if (_history.length == 0) {
            return (false, point);
        }

        uint256 left = 0;
        uint256 right = _history.length;
        while (left + 1 < right) {
            uint256 mid = left.add(right).div(2);
            if (_history[mid].timestamp <= _timestamp) {
                left = mid;
            } else {
                right = mid;
            }
        }

        if (_history[left].timestamp <= _timestamp) {
            return (true, _history[left]);
        }
        return (false, point);
    }

    /// @dev Deposit
    function _deposit(
        address _addr,
        uint256 _lockId,
        uint256 _value,
        uint256 _unlockTime,
        bool _boolCheckPoint
    ) internal ifFree {

        LibLockTOSv2.LockedBalance memory lockedOld = allLocks[_lockId];
        LibLockTOSv2.LockedBalance memory lockedNew =
            LibLockTOSv2.LockedBalance({
                amount: lockedOld.amount,
                start: lockedOld.start,
                end: lockedOld.end,
                owner: _addr,
                withdrawalTime: 0
            });

        // Make new lock
        lockedNew.amount = lockedNew.amount.add(_value);
        if (_unlockTime > 0) {
            lockedNew.end = _unlockTime;
        }
        if (lockedNew.start == 0) {
            lockedNew.start = block.timestamp;
        }

        // Checkpoint
        if (_boolCheckPoint) _checkpoint(lockedNew, lockedOld);

        // Save new lock
        allLocks[_lockId] = lockedNew;

        // Save user point,
        int256 userSlope =
            lockedNew.amount.mul(MULTIPLIER).div(maxTime).toInt256();
        int256 userBias =
            userSlope.mul(lockedNew.end.sub(block.timestamp).toInt256());
        LibLockTOSv2.Point memory userPoint =
            LibLockTOSv2.Point({
                timestamp: block.timestamp,
                slope: userSlope,
                bias: userBias
            });
        lockPointHistory[_lockId].push(userPoint);

        // Transfer TOS
        if (_boolCheckPoint && _value != 0)
            require(
                IERC20(tos).transferFrom(msg.sender, address(this), _value),
                "LockTOS: fail transferFrom"
            );
    }

    /// @dev Checkpoint
    function _checkpoint(
        LibLockTOSv2.LockedBalance memory lockedNew,
        LibLockTOSv2.LockedBalance memory lockedOld
    ) internal {
        uint256 timestamp = block.timestamp;
        LibLockTOSv2.SlopeChange memory changeNew =
            LibLockTOSv2.SlopeChange({slope: 0, bias: 0, changeTime: 0});
        LibLockTOSv2.SlopeChange memory changeOld =
            LibLockTOSv2.SlopeChange({slope: 0, bias: 0, changeTime: 0});

        // Initialize slope changes
        if (lockedNew.end > timestamp && lockedNew.amount > 0) {
            changeNew.slope = lockedNew
                .amount
                .mul(MULTIPLIER)
                .div(maxTime)
                .toInt256();
            changeNew.bias = changeNew.slope
                .mul(lockedNew.end.sub(timestamp).toInt256());
            changeNew.changeTime = lockedNew.end;
        }
        if (lockedOld.end > timestamp && lockedOld.amount > 0) {
            changeOld.slope = lockedOld
                .amount
                .mul(MULTIPLIER)
                .div(maxTime)
                .toInt256();
            changeOld.bias = changeOld.slope
                .mul(lockedOld.end.sub(timestamp).toInt256());
            changeOld.changeTime = lockedOld.end;
        }

        // Record history gaps
        LibLockTOSv2.Point memory currentWeekPoint = _recordHistoryPoints();
        currentWeekPoint.bias = currentWeekPoint.bias.add(
            changeNew.bias.sub(changeOld.bias)
        );
        currentWeekPoint.slope = currentWeekPoint.slope.add(
            changeNew.slope.sub(changeOld.slope)
        );
        currentWeekPoint.bias = currentWeekPoint.bias > int256(0)
            ? currentWeekPoint.bias
            : int256(0);
        currentWeekPoint.slope = currentWeekPoint.slope > int256(0)
            ? currentWeekPoint.slope
            : int256(0);
        pointHistory[pointHistory.length - 1] = currentWeekPoint;
        // console.log("pointHistory  index %s", pointHistory.length - 1);
        // console.log("bias");
        // console.logInt(currentWeekPoint.bias);
        // console.log("slope");
        // console.logInt(currentWeekPoint.slope);
        // console.log("pointHistory.timestamp %s", currentWeekPoint.timestamp);

        // Update slope changes
        _updateSlopeChanges(changeNew, changeOld);
    }

    /// @dev Fill the gaps
    function _recordHistoryPoints()
        internal
        returns (LibLockTOSv2.Point memory lastWeek)
    {
        uint256 timestamp = block.timestamp;
        // console.log('_recordHistoryPoints timestamp %s', timestamp );
        if (pointHistory.length > 0) {
            lastWeek = pointHistory[pointHistory.length - 1];
        } else {
            lastWeek = LibLockTOSv2.Point({
                bias: 0,
                slope: 0,
                timestamp: timestamp
            });
        }
        // console.log('_recordHistoryPoints pointHistory.length %s', pointHistory.length );

        // Iterate through all past unrecoreded weeks and record
        uint256 pointTimestampIterator =
            lastWeek.timestamp.div(epochUnit).mul(epochUnit);

        // console.log('pointTimestampIterator %s', pointTimestampIterator );

        while (pointTimestampIterator != timestamp) {
            pointTimestampIterator = Math.min(
                pointTimestampIterator.add(epochUnit),
                timestamp
            );
            // console.log('pointTimestampIterator Math.min(timestamp) %s', pointTimestampIterator );
            int256 deltaSlope = slopeChanges[pointTimestampIterator];
            int256 deltaTime =
                Math.min(pointTimestampIterator.sub(lastWeek.timestamp), epochUnit).toInt256();
            lastWeek.bias = lastWeek.bias.sub(lastWeek.slope.mul(deltaTime));
            lastWeek.slope = lastWeek.slope.add(deltaSlope);
            lastWeek.bias = lastWeek.bias > 0 ? lastWeek.bias : int256(0);
            lastWeek.slope = lastWeek.slope > 0 ? lastWeek.slope : int256(0);
            lastWeek.timestamp = pointTimestampIterator;

            // console.log('pointHistory.push lastWeek.timestamp %s', lastWeek.timestamp );
            pointHistory.push(lastWeek);
        }
        // console.log('pointHistory.length %s', pointHistory.length );
        // console.log('lastWeek %s', lastWeek.timestamp );

        return lastWeek;
    }

    /// @dev Fills the record gaps
    function _fillRecordGaps(LibLockTOSv2.Point memory week, uint256 timestamp)
        internal
        view
        returns (LibLockTOSv2.Point memory)
    {
        // console.log('_fillRecordGaps timestamp %s', timestamp );

        // Iterate through all past unrecoreded weeks
        uint256 pointTimestampIterator =
            week.timestamp.div(epochUnit).mul(epochUnit);

        // console.log('_fillRecordGaps pointTimestampIterator %s', pointTimestampIterator );

        // console.log('week.slope' );
        // console.logInt(week.slope );
        // console.log('week.bias' );
        // console.logInt(week.bias );
        // console.log('week.timestamp %s', week.timestamp );

        while (pointTimestampIterator != timestamp) {
            pointTimestampIterator = Math.min(
                pointTimestampIterator.add(epochUnit),
                timestamp
            );

            // console.log('_fillRecordGaps min pointTimestampIterator %s', pointTimestampIterator );

            int256 deltaSlope = slopeChanges[pointTimestampIterator];
            int256 deltaTime =
                Math.min(pointTimestampIterator.sub(week.timestamp), epochUnit).toInt256();

            // console.log('deltaSlope' );
            // console.logInt(deltaSlope );
            // console.log('deltaTime' );
            // console.logInt(deltaTime );

            week.bias = week.bias.sub(week.slope.mul(deltaTime));
            // console.log('week.bias' );
            // console.logInt(week.bias );

            week.slope = week.slope.add(deltaSlope);
            // console.log('week.slope' );
            // console.logInt(week.slope );

            week.bias = week.bias > 0 ? week.bias : int256(0);
            week.slope = week.slope > 0 ? week.slope : int256(0);
            week.timestamp = pointTimestampIterator;

            // console.log('week.timestamp %s', week.timestamp );
        }
        return week;
    }

    /// @dev Update slope changes
    function _updateSlopeChanges(
        LibLockTOSv2.SlopeChange memory changeNew,
        LibLockTOSv2.SlopeChange memory changeOld
    ) internal {
        // console.log('_updateSlopeChanges');
        // console.log('changeNew.changeTime %s', changeNew.changeTime);
        // console.log('changeOld.changeTime %s', changeOld.changeTime);

        int256 deltaSlopeNew = slopeChanges[changeNew.changeTime];
        // console.log('slopeChanges[changeNew.changeTime] ');
        // console.logInt(deltaSlopeNew);
        int256 deltaSlopeOld = slopeChanges[changeOld.changeTime];
        // console.log('slopeChanges[changeOld.changeTime] ');
        // console.logInt(deltaSlopeOld);

        if (changeOld.changeTime > block.timestamp) {
            deltaSlopeOld = deltaSlopeOld.add(changeOld.slope);
            if (changeOld.changeTime == changeNew.changeTime) {
                deltaSlopeOld = deltaSlopeOld.sub(changeNew.slope);
            }
            slopeChanges[changeOld.changeTime] = deltaSlopeOld;
        }
        // console.log('--slopeChanges[changeOld.changeTime]');
        // console.logInt(slopeChanges[changeOld.changeTime]);
        if (
            changeNew.changeTime > block.timestamp &&
            changeNew.changeTime > changeOld.changeTime
        ) {
            deltaSlopeNew = deltaSlopeNew.sub(changeNew.slope);
            slopeChanges[changeNew.changeTime] = deltaSlopeNew;
        }
        // console.log('--slopeChanges[changeNew.changeTime]');
        // console.logInt(slopeChanges[changeNew.changeTime]);
    }

    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }

    function currentStakedTotalTOS() external view returns (uint256) {
        return IERC20(tos).balanceOf(address(this));
    }

}
