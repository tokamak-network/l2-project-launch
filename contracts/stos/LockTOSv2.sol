// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../common/AccessibleCommon.sol";
import "./LockTOSv2Storage.sol";

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/math/SignedSafeMath.sol";

import "../libraries/LibLockTOSv2.sol";
import "../interfaces/ILockTOSv2.sol";
import "../interfaces/ILockTOSv2Event.sol";
import "../interfaces/ITOS.sol";
import "hardhat/console.sol";

contract LockTOSv2 is LockTOSv2Storage, AccessibleCommon, IERC721, ILockTOSv2Event {
    // using SafeMath for uint256;
    using SafeCast for uint256;
    using SignedSafeMath for int256;


    /// @dev Check if a function is used or not
    modifier ifFree {
        require(free == 1, "LockId is already in use");
        free = 0;
        _;
        free = 1;
    }

    constructor(string memory _name, string memory _symbol) {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
        name = _name;
        name = _symbol;
    }


    /** onlyOwner  */
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

    function setMaxTime(uint256 _maxTime) external onlyOwner {
        maxTime = _maxTime;
    }

    /** external  */

    function transferFrom(address from, address to, uint256 tokenId) external virtual {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(msg.sender, tokenId), "transfer caller is not owner nor approved");

        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external virtual {
        safeTransferFrom(from, to, tokenId, "");
    }


    function transferFromUnlimited(address from, address to, uint256 amount) external virtual {
        address spender = msg.sender;
        require (spender == from || isApprovedForAll(from, spender), "not approved");

        _increaseUnlimitedAccount(from, amount, false, false);
        _increaseUnlimitedAccount(to, amount, true, false);

        emit TransferUnlimitedLock(from, to, amount);
    }

    function createLock(uint256 _value, uint256 _unlockWeeks)
        public
        returns (uint256 lockId)
    {
        require(_value > 0, "Value locked should be non-zero");
        require(_unlockWeeks > 0, "Unlock period less than a week");

        cumulativeEpochUnit = cumulativeEpochUnit + _unlockWeeks;
        cumulativeTOSAmount = cumulativeTOSAmount + _value;
        uint256 unlockTime = block.timestamp + (_unlockWeeks * epochUnit);
        unlockTime = unlockTime / epochUnit * epochUnit;
        require(
            unlockTime - block.timestamp <= maxTime,
            "Max unlock time is 3 years"
        );

        lockId = ++lockIdCounter;

        _deposit(msg.sender, lockId, _value, unlockTime, true, true);

        userLocksCheck[msg.sender][lockId] = true;
        userLocks[msg.sender].push(lockId);

        emit LockCreated(msg.sender, lockId, _value, unlockTime);
    }

    function increaseAmount(uint256 _lockId, uint256 _value) external {
        depositFor(msg.sender, _lockId, _value);
    }

    function increaseUnlockTime(uint256 _lockId, uint256 _unlockWeeks)
        external
    {
        require(_unlockWeeks > 0, "Unlock period less than a week");
        cumulativeEpochUnit = cumulativeEpochUnit + _unlockWeeks;

        LibLockTOSv2.LockedBalance memory lock = allLocks[_lockId];
        require(lock.owner == msg.sender, "lockId's owner is not caller");

        uint256 unlockTime = lock.end + (_unlockWeeks * epochUnit);
        unlockTime = unlockTime / epochUnit * epochUnit;
        require(
            unlockTime - block.timestamp < maxTime,
            "Max unlock time is 3 years"
        );
        require(lock.end > block.timestamp, "Lock time already finished");
        require(lock.end < unlockTime, "New lock time must be greater");
        require(lock.amount > 0, "No existing locked TOS");
        _deposit(msg.sender, _lockId, 0, unlockTime, true, false);

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

        LibLockTOSv2.LockedBalance memory lock = allLocks[_lockId];
        require(lock.owner == msg.sender, "lockId's owner is not caller");

        uint256 unlockTime = (lock.end + (_unlockWeeks * epochUnit)) / epochUnit * epochUnit;

        require(
            unlockTime - block.timestamp < maxTime,
            "Max unlock time is 3 years"
        );
        require(lock.end > block.timestamp, "Lock time already finished");
        require(lock.end < unlockTime, "New lock time must be greater");
        require(lock.amount > 0, "No existing locked TOS");

        if(_unlockWeeks > 0)
            cumulativeEpochUnit = cumulativeEpochUnit + _unlockWeeks;

        _deposit(msg.sender, _lockId, _value, unlockTime, true, true);

        emit LockIncreased(msg.sender, _lockId, _value, unlockTime);
    }

    function increaseUnlimitedLock(address account, uint256 amount)
        public nonZero(amount)
    {
        // caller 는 무조건 스테이커가 가능하게 하도록 수정되어야 함 .
        require(msg.sender == account, 'caller is not account');
        cumulativeTOSAmount = cumulativeTOSAmount + amount;

        _increaseUnlimitedAccount(account, amount, true, true);
        _increaseUnlimitedHistory(amount, true);
        // checkUniqueUser(account);

        emit IncreasedUnlimitedLock(msg.sender, account, amount);
    }

    function decreaseUnlimitedLock(address account, uint256 amount)
        public nonZero(amount)
    {
        // caller 는 무조건 스테이커가 가능하게 하도록 수정되어야 함 .
        require(msg.sender == account, 'caller is not account');

        _increaseUnlimitedAccount(account, amount, false, false);
        _increaseUnlimitedHistory(amount, false);

        /////////////////////////////////////////////////
        // 락아이디로 변경
        uint256 unlockTime = (block.timestamp + ((maxTime / epochUnit) * epochUnit)) / epochUnit * epochUnit;
        uint256 lockId = ++lockIdCounter;

        _deposit(account, lockId, amount, unlockTime, true, false);
        userLocksCheck[account][lockId] = true;
        userLocks[account].push(lockId);

        emit DecreasedUnlimitedLock(msg.sender, account, amount);
        emit LockCreated(account, lockId, amount, unlockTime);
    }

    function withdrawAll() external ifFree {
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

    function totalLockedAmountOf(address _addr) external view returns (uint256) {
        return totalLockedAmountOfLock(_addr) + balanceOfUnlimitedAmount(_addr);
    }


    /** public  */

    function approve(address to, uint256 tokenId) public virtual {
        address owner_ = ownerOf(tokenId);
        require(to != owner_, "approval to current owner");

        require(msg.sender == owner_ || isApprovedForAll(owner_, msg.sender),
            "approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(operator != msg.sender, "approve to caller");

        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual {
        require(_isApprovedOrOwner(msg.sender, tokenId), "transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }

    function depositFor(
        address _addr,
        uint256 _lockId,
        uint256 _value
    ) public {
        require(_value > 0, "Value locked should be non-zero");
        // require(userLocksCheck[_addr][_lockId], "it is not your lockId");
        LibLockTOSv2.LockedBalance memory lock = allLocks[_lockId];
        require(lock.owner == _addr, "lockId's owner is not addr");
        require(lock.withdrawalTime == 0, "Lock is withdrawn");
        require(lock.start > 0, "Lock does not exist");
        require(lock.end > block.timestamp, "Lock time is finished");

        cumulativeTOSAmount = cumulativeTOSAmount + _value;

        _deposit(_addr, _lockId, _value, 0, true, true);
        emit LockDeposited(msg.sender, _lockId, _value);
    }

    function withdraw(uint256 _lockId) public  ifFree {
        require(_lockId > 0, "_lockId is zero");
        _withdraw(_lockId);
    }

    /** view  */

    function ownerOf(uint256 tokenId) public view returns (address) {
        return allLocks[tokenId].owner;
    }

    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        require(_exists(tokenId), "nonexistent token");

        string memory _tokenURI = tokenURIs[tokenId];
        string memory base = baseURI;

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
    }

    function getApproved(uint256 tokenId) public view virtual returns (address) {
        require(_exists(tokenId), "LockIdNFT: approved query for nonexistent token");

        return _tokenApprovals[tokenId];
    }

    function totalSupply() external view returns (uint256) {
         return totalSupplyBalance() + totalSupplyUnlimited();
    }

    function totalSupplyAt(uint256 _timestamp)
        public
        view
        returns (uint256)
    {
        return totalSupplyBalanceAt(_timestamp) + totalSupplyUnlimitedAt(_timestamp);
    }

    function totalSupplyBalance()
        public
        view
        returns (uint256)
    {
        if (pointHistory.length == 0) return 0;

        LibLockTOSv2.Point memory point = _fillRecordGaps(
            pointHistory[pointHistory.length - 1],
            block.timestamp
        );

        int256 currentBias = point.slope * int256(block.timestamp - point.timestamp);
        return
            uint256(point.bias > currentBias ? point.bias-(currentBias) : int256(0)) / MULTIPLIER;
    }

    function totalSupplyBalanceAt(uint256 _timestamp)
        public
        view
        returns (uint256)
    {
        if (pointHistory.length == 0)  return 0;
        (bool success, LibLockTOSv2.Point memory point) = _findClosestPoint(pointHistory, _timestamp);
        if (!success)   return 0;

        point = _fillRecordGaps(point, _timestamp);
        int256 currentBias = point.slope * int256(_timestamp-point.timestamp);
        return
            uint256(point.bias > currentBias ? point.bias - currentBias : int256(0)) / MULTIPLIER;
    }

    function totalSupplyUnlimited()
        public
        view
        returns (uint256 amount)
    {
        // 마지막 포인트
        LibLockTOSv2.UnlimitedAmount memory pointLast = lastPointOfTimeIndexForUnlimited(
                        (indexOfTimesetForUnlimited.length != 0 ? indexOfTimesetForUnlimited[indexOfTimesetForUnlimited.length - 1]:0)
                    );
       amount = balanceOfUnlimitedAt(pointLast, block.timestamp);
    }

    function totalSupplyUnlimitedAt(uint256 _timestamp)
        public
        view
        returns (uint256 amount)
    {
        // 해당 타임에 맞는 타임인덱스
        (bool success, uint256 timeindex) = _findClosestUnlimitedTimeindex(_timestamp);
        if(!success) return 0;
        (bool success1, LibLockTOSv2.UnlimitedAmount memory point) = _findClosestUnlimitedPoint(unlimitedHistoryByWeek[timeindex], _timestamp);
        if(!success1) return 0;
        amount = balanceOfUnlimitedAt(point, _timestamp);
    }

    function balanceOfLock(uint256 _lockId)
        public
        view
        returns (uint256)
    {
        uint256 len = lockPointHistory[_lockId].length;
        if (len == 0) {
            return 0;
        }

        LibLockTOSv2.Point memory point = lockPointHistory[_lockId][len - 1];

        int256 currentBias = point.slope * int256(block.timestamp - point.timestamp);

        return
            uint256(point.bias > currentBias ? point.bias - currentBias : int256(0)) / MULTIPLIER;
    }

    function balanceOfLockAt(uint256 _lockId, uint256 _timestamp)
        public
        view
        returns (uint256)
    {
        (bool success, LibLockTOSv2.Point memory point) =
            _findClosestPoint(lockPointHistory[_lockId], _timestamp);
        if (!success) {
            return 0;
        }
        int256 currentBias = point.slope * int256(_timestamp-point.timestamp);
        return  uint256(point.bias > currentBias ? point.bias-currentBias : int256(0)) / MULTIPLIER;
    }



    function balanceOf(address _addr)
        public
        view
        returns (uint256 balance)
    {
        return balanceOfLock(_addr) + balanceOfUnlimited(_addr);
    }

    function balanceOfAt(address _addr, uint256 _timestamp)
        public
        view
        returns (uint256 balance)
    {
        return balanceOfLockAt(_addr, _timestamp) + balanceOfUnlimitedAt(_addr, _timestamp);
    }

    function balanceOfLock(address _addr)
        public
        view
        returns (uint256 balance)
    {
        uint256[] memory locks = userLocks[_addr];
        if (locks.length == 0) return 0;
        for (uint256 i = 0; i < locks.length; ++i) {
            balance = balance + balanceOfLock(locks[i]);
        }
    }

    function balanceOfLockAt(address _addr, uint256 _timestamp)
        public
        view
        returns (uint256 balance)
    {
        uint256[] memory locks = userLocks[_addr];
        if (locks.length == 0) return 0;
        for (uint256 i = 0; i < locks.length; ++i) {
            balance = balance + balanceOfLockAt(locks[i], _timestamp);
        }
    }

    function balanceOfUnlimited(address _addr)
        public
        view
        returns (uint256 balance)
    {
        uint256 len = unlimitedAmountByAccount[_addr].length;
        balance = (len == 0? 0: balanceOfUnlimitedAt(unlimitedAmountByAccount[_addr][len - 1], block.timestamp));

    }

    function balanceOfUnlimitedAt(address _addr, uint256 _timestamp)
        public
        view
        returns (uint256 balance)
    {
        (bool success, LibLockTOSv2.UnlimitedAmount memory point) = _findClosestUnlimitedPoint(unlimitedAmountByAccount[_addr], _timestamp);
        balance = (!success? 0: balanceOfUnlimitedAt(point, _timestamp));
    }

    function balanceOfUnlimitedAt(LibLockTOSv2.UnlimitedAmount memory point, uint256 timestamp)
        public
        view
        returns (uint256)
    {
        if(timestamp < point.timestamp || point.amount == 0) return 0;
        return (point.amount * MULTIPLIER / maxTime * maxTime / MULTIPLIER);
    }

    function balanceOfUnlimitedAmount(address _addr)
        public
        view
        returns (uint256 amount)
    {
        uint256 len = unlimitedAmountByAccount[_addr].length;
        amount = (len == 0? 0: unlimitedAmountByAccount[_addr][len - 1].amount);
    }

    function needCheckpoint() external view returns (bool need) {
        uint256 len = pointHistory.length;
        if (len == 0) {
            return true;
        }
        need = (block.timestamp - pointHistory[len - 1].timestamp) > epochUnit; // if the last record was within a week
    }

    function lastPointOfTimeIndexForUnlimited(uint256 _index) public view returns (LibLockTOSv2.UnlimitedAmount memory) {

        LibLockTOSv2.UnlimitedAmount[] memory points = unlimitedHistoryByWeek[_index];

        if (points.length != 0) {
            return LibLockTOSv2.UnlimitedAmount({
                timestamp: points[points.length-1].timestamp,
                amount: points[points.length-1].amount
            });
        }

        return LibLockTOSv2.UnlimitedAmount({
            timestamp: 0,
            amount: 0
        });
    }


    function nextTimeIndex(uint256 _stime) public view returns(uint256) {
        return (_stime +  epochUnit) / epochUnit * epochUnit;
    }

    function globalCheckpoint() external {
        _recordHistoryPoints();
    }

    function totalLockedAmountOfLock(address _addr) public view returns (uint256) {
        uint256 len = userLocks[_addr].length;
        uint256 stakedAmount = 0;
        for (uint256 i = 0; i < len; ++i) {
            uint256 lockId = userLocks[_addr][i];
            if (userLocksCheck[_addr][lockId]) {
                LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];
                stakedAmount = stakedAmount + lock.amount;
            }
        }
        return stakedAmount;
    }

    function withdrawableAmountOf(address _addr) external view returns (uint256) {
        uint256 len = userLocks[_addr].length;
        uint256 amount = 0;
        for(uint i = 0; i < len; i++){
            uint256 lockId = userLocks[_addr][i];
            if (userLocksCheck[_addr][lockId]) {
                LibLockTOSv2.LockedBalance memory lock = allLocks[lockId];
                if(lock.end <= block.timestamp && lock.amount > 0 && lock.withdrawalTime == 0) {
                    amount = amount + lock.amount;
                }
            }

        }
        return amount;
    }

    function locksInfo(uint256 _lockId)
        public
        view
        returns (LibLockTOSv2.LockedBalance memory   )
    {
        return allLocks[_lockId];
    }

    function locksOf(address _addr)
        public
        view
        returns (uint256[] memory)
    {
        return userLocks[_addr];
    }

    function withdrawableLocksOf(address _addr)  external view returns (uint256[] memory) {
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

    function pointHistoryOf(uint256 _lockId)
        public
        view
        returns (LibLockTOSv2.Point[] memory)
    {
        return lockPointHistory[_lockId];
    }


    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }

    // function currentStakedTotalTOS() external view returns (uint256) {
    //     return IERC20(tos).balanceOf(address(this));
    // }


    /** internal  */

    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId); // internal owner
    }


    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        require(_exists(tokenId), "LockIdNFT: operator query for nonexistent token");
        address owner_ = ownerOf(tokenId);
        return (spender == owner_ || getApproved(tokenId) == spender || isApprovedForAll(owner_, spender));
    }

    function isApprovedForAll(address owner_, address operator) public view virtual returns (bool) {
        return _operatorApprovals[owner_][operator];
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

        _deposit(to, newLockId, lock.amount, lock.end, false, false);

        userLocksCheck[to][newLockId] = true;
        userLocks[to].push(newLockId);
        // checkUniqueUser(to);

        emit Transfer(address(0), from, newLockId);
        emit Transfer(from, to, newLockId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        // LibLockTOSv2.LockedBalance memory token_ = allLocks[tokenId];
        address owner_ = allLocks[tokenId].owner;
        return owner_ != address(0);
    }

    function _increaseUnlimitedAccount(address account, uint256 amount, bool increasement, bool boolTransfer)
        internal {

        uint256 accountlen = unlimitedAmountByAccount[account].length;
        uint256 prevAmount = 0;
        if (accountlen != 0) {
            prevAmount = unlimitedAmountByAccount[account][accountlen-1].amount;
        }
        if(!increasement) {
            require(accountlen != 0, 'no unlimited amount');
            require(prevAmount >= amount, 'unlimitedAmount is insufficient');
        }

        LibLockTOSv2.UnlimitedAmount memory afterInfo = LibLockTOSv2.UnlimitedAmount({
                timestamp: uint32(block.timestamp),
                amount: (increasement? prevAmount+amount: prevAmount-amount)
        });

        unlimitedAmountByAccount[account].push(afterInfo);

        if(boolTransfer && amount != 0) {
            require(
                IERC20(tos).transferFrom(msg.sender, address(this), amount),
                "_increaseUnlimitedAccount transferFrom fail"
            );
        }
    }

    function _increaseUnlimitedHistory(uint256 amount, bool increasement) internal {
        uint256 nextTimeIndexOfTotalPoint = nextTimeIndex(block.timestamp);
        uint256 len = unlimitedHistoryByWeek[nextTimeIndexOfTotalPoint].length;
        LibLockTOSv2.UnlimitedAmount memory pointLast ; // 가장 최근의 point


        if (len == 0 ) {
            // 가장 최근 인덱스
            pointLast = lastPointOfTimeIndexForUnlimited(
                        (indexOfTimesetForUnlimited.length != 0 ? indexOfTimesetForUnlimited[indexOfTimesetForUnlimited.length - 1]:0)
                    );
        } else {
            pointLast = unlimitedHistoryByWeek[nextTimeIndexOfTotalPoint][len-1];
        }

        if(!increasement) require(pointLast.amount >= amount, 'insufficient unlimited amount');

        LibLockTOSv2.UnlimitedAmount memory pointNew = LibLockTOSv2.UnlimitedAmount({
            timestamp : uint32(block.timestamp),
            amount: pointLast.amount
        });

        if(increasement) pointNew.amount += amount;
        else pointNew.amount -= amount;
        unlimitedHistoryByWeek[nextTimeIndexOfTotalPoint].push(pointNew);

        if(!indexCheckOfTimesetForUnlimited[nextTimeIndexOfTotalPoint]) {
            indexCheckOfTimesetForUnlimited[nextTimeIndexOfTotalPoint] = true;
            indexOfTimesetForUnlimited.push(nextTimeIndexOfTotalPoint);
        }
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
            uint256 mid = (left + right) / 2;
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
        bool _boolCheckPoint,
        bool _tokenTransfer
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
        lockedNew.amount = lockedNew.amount  + _value;
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
        int256 userSlope =int256(lockedNew.amount * MULTIPLIER / maxTime);
        int256 userBias =userSlope * int256(lockedNew.end-block.timestamp);
        LibLockTOSv2.Point memory userPoint =
            LibLockTOSv2.Point({
                timestamp: block.timestamp,
                slope: userSlope,
                bias: userBias
            });
        lockPointHistory[_lockId].push(userPoint);

        // Transfer TOS
        if (_tokenTransfer && _value != 0)
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
            changeNew.slope = int256(lockedNew.amount * MULTIPLIER / maxTime);
            changeNew.bias = changeNew.slope * int256(lockedNew.end - timestamp);
            changeNew.changeTime = lockedNew.end;
        }
        if (lockedOld.end > timestamp && lockedOld.amount > 0) {
            changeOld.slope = int256(lockedOld.amount * MULTIPLIER / maxTime);
            changeOld.bias = changeOld.slope * int256(lockedOld.end - timestamp);
            changeOld.changeTime = lockedOld.end;
        }

        // Record history gaps
        LibLockTOSv2.Point memory currentWeekPoint = _recordHistoryPoints();
        currentWeekPoint.bias = currentWeekPoint.bias + (changeNew.bias - changeOld.bias);
        currentWeekPoint.slope = currentWeekPoint.slope + (changeNew.slope - changeOld.slope);
        currentWeekPoint.bias = currentWeekPoint.bias > int256(0)
            ? currentWeekPoint.bias
            : int256(0);
        currentWeekPoint.slope = currentWeekPoint.slope > int256(0)
            ? currentWeekPoint.slope
            : int256(0);
        pointHistory[pointHistory.length - 1] = currentWeekPoint;

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
        uint256 pointTimestampIterator = lastWeek.timestamp / epochUnit * epochUnit;

        // console.log('pointTimestampIterator %s', pointTimestampIterator );

        while (pointTimestampIterator != timestamp) {
            pointTimestampIterator = Math.min(pointTimestampIterator + epochUnit, timestamp);
            // console.log('pointTimestampIterator Math.min(timestamp) %s', pointTimestampIterator );
            int256 deltaSlope = slopeChanges[pointTimestampIterator];
            int256 deltaTime = int256(Math.min(pointTimestampIterator - lastWeek.timestamp, epochUnit));
            lastWeek.bias = lastWeek.bias - (lastWeek.slope * deltaTime);
            lastWeek.slope = lastWeek.slope + deltaSlope;
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
        uint256 pointTimestampIterator = week.timestamp / epochUnit * epochUnit;

        // console.log('_fillRecordGaps pointTimestampIterator %s', pointTimestampIterator );

        // console.log('week.slope' );
        // console.logInt(week.slope );
        // console.log('week.bias' );
        // console.logInt(week.bias );
        // console.log('week.timestamp %s', week.timestamp );

        while (pointTimestampIterator != timestamp) {
            pointTimestampIterator = Math.min(pointTimestampIterator + epochUnit, timestamp);

            // console.log('_fillRecordGaps min pointTimestampIterator %s', pointTimestampIterator );

            int256 deltaSlope = slopeChanges[pointTimestampIterator];
            int256 deltaTime = int256(Math.min(pointTimestampIterator - week.timestamp, epochUnit));

            // console.log('deltaSlope' );
            // console.logInt(deltaSlope );
            // console.log('deltaTime' );
            // console.logInt(deltaTime );

            week.bias = week.bias - (week.slope * deltaTime);
            // console.log('week.bias' );
            // console.logInt(week.bias );

            week.slope = week.slope + deltaSlope;
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
            deltaSlopeOld = deltaSlopeOld + (changeOld.slope);
            if (changeOld.changeTime == changeNew.changeTime) {
                deltaSlopeOld = deltaSlopeOld - (changeNew.slope);
            }
            slopeChanges[changeOld.changeTime] = deltaSlopeOld;
        }
        // console.log('--slopeChanges[changeOld.changeTime]');
        // console.logInt(slopeChanges[changeOld.changeTime]);
        if (
            changeNew.changeTime > block.timestamp &&
            changeNew.changeTime > changeOld.changeTime
        ) {
            deltaSlopeNew = deltaSlopeNew - (changeNew.slope);
            slopeChanges[changeNew.changeTime] = deltaSlopeNew;
        }
        // console.log('--slopeChanges[changeNew.changeTime]');
        // console.logInt(slopeChanges[changeNew.changeTime]);
    }


    function _findClosestUnlimitedPoint(
        LibLockTOSv2.UnlimitedAmount[] storage _history,
        uint256 _timestamp
    ) internal view returns(bool success, LibLockTOSv2.UnlimitedAmount memory point) {
        if (_history.length == 0) {
            return (false, point);
        }
        uint256 left = 0;
        uint256 right = _history.length;
        while (left + 1 < right) {
            uint256 mid = (left + right) / 2;
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

    function _findClosestUnlimitedTimeindex(
        uint256 _timestamp
    ) public view returns(bool success, uint256 timeindex) {
        uint256 totalLen = indexOfTimesetForUnlimited.length;
        uint256 timeIndexKey =  (_timestamp + epochUnit) * epochUnit / epochUnit ;

        if (totalLen == 0) {
            return (false, 0);
        }
        uint256 left = 0;
        uint256 right = totalLen;

        while (left + 1 < right) {
            uint256 mid = (left + right) / 2;
            if (indexOfTimesetForUnlimited[mid] <= timeIndexKey) {
                left = mid;
            } else {
                right = mid;
            }
        }

        if (indexOfTimesetForUnlimited[left] <= timeIndexKey) {
            return (true, indexOfTimesetForUnlimited[left]);
        }
        return (false, 0);
    }

}
