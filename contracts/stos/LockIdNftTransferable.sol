// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../proxy/ProxyStorage2.sol";
import "./LockIdNFTStorage.sol";
import "./LockIdStorage1.sol";
import "hardhat/console.sol";

contract LockIdNftTransferable is ProxyStorage2, LockIdNFTStorage, LockIdStorage1, IERC721, IERC721Metadata, IERC721Enumerable {
    // using SafeMath for uint256;
    using Address for address;
    using Strings for uint256;

    event LockCreated(address account, uint256 lockId, uint256 amount, uint256 unlockTime);
    event LockDeposited(address account, uint256 lockId, uint256 value);
    event IncreasedLock(address account, uint256 lockId, uint256 value, uint256 unlockTime);
    event IncreasedUnlimitedLock(address account, uint256 amount);
    event DecreasedUnlimitedLock(address account, uint256 amount);
    event TransferUnlimitedLock(address from, address to, uint256 amount);
    event TransferLock(address from, address to, uint256 oldLockId, uint256 tokenId, uint256 amount, uint256 end);

    modifier nonZero(uint256 _val) {
        require(_val != 0, "zero value");
        _;
    }

    constructor (
        string memory name_,
        string memory symbol_,
        address managerAddress,
        uint256 epochUnit_,
        uint256 maxTime_,
        address tosAddress
        ) {

        _manager = managerAddress;
        _name = name_;
        _symbol = symbol_;
        epochUnit = epochUnit_;
        maxTime = maxTime_;
        tos = tosAddress;
    }

    /*** External onlyManager ***/

    // function setBaseURI(string memory baseURI_) public onlyManager ifFree virtual {
    //    _setBaseURI(baseURI_);
    // }

    // function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyManager ifFree virtual {
    //    _setTokenURI(tokenId, _tokenURI);
    // }

    // function setTokenURI(uint256[] memory tokenIds, string[] memory _tokenURIs) public onlyManager ifFree virtual {
    //     require(tokenIds.length != 0 && tokenIds.length == _tokenURIs.length, "wrong length");
    //     for(uint256 i = 0; i < tokenIds.length; i++){
    //         _setTokenURI(tokenIds[i], _tokenURIs[i]);
    //     }
    // }

    /*** External ***/

    // function createLock(uint256 _amount, uint256 _unlockWeeks)
    //     public nonZero(_amount) nonZero(_unlockWeeks)
    //     returns (uint256 lockId)
    // {
    //     uint256 unlockTime = (block.timestamp + (_unlockWeeks * epochUnit)) / epochUnit * epochUnit;
    //     require(unlockTime - block.timestamp <= maxTime, "Max unlock time is exceeded" );

    //     lockId = ++maxTokenId;
    //     _safeMint(msg.sender, lockId);
    //     _createLock(msg.sender, lockId, _amount, unlockTime);

    //     emit LockCreated(msg.sender, lockId, _amount, unlockTime);
    // }


    function addLockPeriod(uint256 howManyWeeks) public onlyManager ifFree virtual {
        require(!existedLockPeriod[howManyWeeks], "existed LockPeriod");
        existedLockPeriod[howManyWeeks] = true;
        lockPeriod.push(howManyWeeks);
    }


    function createLock(uint256 _amount, uint256 _unlockWeeks)
        public nonZero(_amount) nonZero(_unlockWeeks) ifFree
        returns (uint256 lockId)
    {
        uint256 unlockTime = (block.timestamp + (_unlockWeeks * epochUnit)) / epochUnit * epochUnit;
        require(unlockTime - block.timestamp <= maxTime, "Max unlock time is exceeded" );
        console.log('unlockTime %s', unlockTime);

        lockId = ++maxTokenId;
        _createLock(msg.sender, lockId, _amount, _unlockWeeks, unlockTime, true);
        _safeMint(msg.sender, lockId);
        emit LockCreated(msg.sender, lockId, _amount, unlockTime);
    }

    function depositFor(
        address _addr,
        uint256 _lockId,
        uint256 _value
    ) public nonZero(_value) {
        require(_exists(_lockId), "nonexistent token");
        require(_tokenOwner[_lockId] == _addr && _addr != address(0), "not owner");

        LibLockIdTransferable.LockedInfo memory lock = lockIdInfos[_lockId];
        require(lock.withdrawalTime == 0, "It is withdrawn already.");
        require(lock.end > block.timestamp, "Lock time is finished");

        _addInLock(_addr, _lockId, _value, lock.unlockWeeks, lock.end, true);

        emit LockDeposited(msg.sender, _lockId, _value);
    }

    function increaseLock(
        address _addr,
        uint256 _lockId,
        uint256 _unlockWeeks
    ) public {
        require(_unlockWeeks != 0, "zero value");
        require(_exists(_lockId), "nonexistent token");
        require(_tokenOwner[_lockId] == _addr && _addr != address(0), "not owner");

        LibLockIdTransferable.LockedInfo memory lock = lockIdInfos[_lockId];
        require(lock.start > 0, "not exist");
        require(lock.withdrawalTime == 0, "It is withdrawn already.");
        require(lock.end > block.timestamp, "Lock time is finished");
        uint256 unlockTime = 0;
        if (_unlockWeeks > 0) {
            if (lockIdInfos[_lockId].unlockWeeks != _unlockWeeks) lockIdInfos[_lockId].unlockWeeks = _unlockWeeks;
            unlockTime = (block.timestamp + (_unlockWeeks * epochUnit)) / epochUnit * epochUnit;
            require(unlockTime - block.timestamp < maxTime, "Max unlock time is exceeded");
        }
        _addInLock(_addr, _lockId, 0, lock.unlockWeeks, unlockTime, true);
        emit IncreasedLock(msg.sender, _lockId, 0, unlockTime);
    }

    // function increaseUnlimitedLock(address account, uint256 amount)
    //     public nonZero(amount)
    // {
    //     // caller 는 무조건 스테이커가 가능하게 하도록 수정되어야 함 .
    //     _increaseUnlimitedAccount(account, amount, true);
    //     _increaseUnlimitedHistory(amount, true);

    //     emit IncreasedUnlimitedLock(msg.sender, amount);
    // }

    // function decreaseUnlimitedLock(address account, uint256 amount)
    //     public nonZero(amount)
    // {
    //     // caller 는 무조건 스테이커가 가능하게 하도록 수정되어야 함 .
    //     _increaseUnlimitedAccount(account, amount, false);
    //     _increaseUnlimitedHistory(amount, false);

    //     /////////////////////////////////////////////////
    //     // 락아이디로 변경
    //     uint256 unlockTime = (block.timestamp + ((maxTime / epochUnit) * epochUnit)) / epochUnit * epochUnit;
    //     uint256 lockId = ++maxTokenId;
    //     _safeMint(msg.sender, lockId);
    //     // _deposit(msg.sender, lockId, amount, unlockTime, true, false);

    //     emit DecreasedUnlimitedLock(msg.sender, amount);
    //     emit LockCreated(msg.sender, lockId, amount, unlockTime);
    // }

    // function _increaseUnlimitedAccount(address account, uint256 amount, bool increasement)
    //     internal {

    //     uint256 accountlen = unlimitedAmountByAccount[account].length;
    //     uint256 prevAmount = 0;
    //     if (accountlen != 0) {
    //         prevAmount = unlimitedAmountByAccount[account][accountlen-1].amount;
    //     }
    //     if(!increasement) {
    //         require(accountlen != 0, 'no unlimited amount');
    //         require(prevAmount >= amount, 'unlimitedAmount is insufficient');
    //     }
    //     LibLockIdTransferable.UnlimitedAmount memory afterInfo = LibLockIdTransferable.UnlimitedAmount({
    //             timestamp: uint32(block.timestamp),
    //             amount: (increasement? prevAmount+amount: prevAmount-amount)
    //     });

    //     unlimitedAmountByAccount[account].push(afterInfo);
    // }

    // function _increaseUnlimitedHistory(uint256 amount, bool increasement) internal {
    //     uint256 nextTimeIndexOfTotalPoint = nextTimeIndex(block.timestamp);
    //     uint256 len = unlimitedHistoryByWeek[nextTimeIndexOfTotalPoint].length;
    //     LibLockIdTransferable.UnlimitedAmount memory pointLast ; // 가장 최근의 point

    //     if (len == 0 ) {
    //         // 가장 최근 인덱스
    //         pointLast = pointOfLastTimeIndexForUnlimited();
    //     } else {
    //         pointLast = unlimitedHistoryByWeek[nextTimeIndexOfTotalPoint][len-1];
    //     }
    //     if(!increasement) require(pointLast.amount >= amount, 'insufficient unlimited amount');

    //     LibLockIdTransferable.UnlimitedAmount memory pointNew = LibLockIdTransferable.UnlimitedAmount({
    //         timestamp : uint32(block.timestamp),
    //         amount: pointLast.amount
    //     });

    //     if(increasement) pointNew.amount += amount;
    //     else pointNew.amount -= amount;

    //     unlimitedHistoryByWeek[nextTimeIndexOfTotalPoint].push(pointNew);

    //     if(!indexCheckOfTimesetForUnlimited[nextTimeIndexOfTotalPoint]) {
    //         indexCheckOfTimesetForUnlimited[nextTimeIndexOfTotalPoint] = true;
    //         indexOfTimesetForUnlimited.push(nextTimeIndexOfTotalPoint);
    //     }
    // }

    /*** Public ***/
    function approve(address to, uint256 tokenId) public virtual override {
        address owner_ = ownerOf(tokenId);
        require(to != owner_, "approval to current owner");

        require(msg.sender == owner_ || isApprovedForAll(owner_, msg.sender),
            "approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    /// 무제한 락업을 위한 전송기능
    // function transferFromUnlimited(address from, address to, uint256 amount) public virtual {
    //     address spender = msg.sender;
    //     require (spender == from || isApprovedForAll(from, spender), "not approved");

    //     _increaseUnlimitedAccount(from, amount, false);
    //     _increaseUnlimitedAccount(to, amount, true);

    //     emit TransferUnlimitedLock(from, to, amount);
    // }


    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(operator != msg.sender, "approve to caller");

        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }


    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(msg.sender, tokenId), "transfer caller is not owner nor approved");

        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }

    /*** View ***/

    /**
     * @dev Overrides supportsInterface
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165P) returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

    // for opensea manager
    // function owner() public view virtual returns (address) {
    //     return _manager;
    // }

    // function isOwner(address addr) public view virtual returns (bool) {
    //     if(_manager == addr) return true;
    //     else return false;
    // }

    function manager() public view virtual returns (address) {
        return _manager;
    }

    function isManager(address addr) public view virtual returns (bool) {

        if(_manager == addr) return true;
        else return false;
    }

    function balanceOf(address owner_) public view override returns (uint256) {
        require(owner_ != address(0), "LockIdNFT: balance query for the zero address");

        return _ownedTokensCount[owner_];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner_ = _tokenOwner[tokenId];
        require(owner_ != address(0), "LockIdNFT: owner query for nonexistent token");

        return owner_;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }


    function baseURI() public view virtual returns (string memory) {
        return _baseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "LockIdNFT: nonexistent token");

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(base, tokenId.toString()));
    }

    function tokenOfOwnerByIndex(address owner_, uint256 index) public view override returns (uint256) {
        require(index < balanceOf(owner_), "LockIdNFT: owner index out of bounds");
        return _ownedTokens[owner_][index];
    }

    function totalSupply() public view override returns (uint256) {
        return _allTokens.length;
    }

    function tokenByIndex(uint256 index) public view override returns (uint256) {
        require(index < totalSupply(), "LockIdNFT: global index out of bounds");
        return _allTokens[index];
    }

    function allTokens() public view returns (uint256[] memory) {
        return _allTokens;
    }

    function tokensOfOwner(address owner_) public view returns (uint256[] memory) {
        return _ownedTokens[owner_];
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        require(_exists(tokenId), "LockIdNFT: approved query for nonexistent token");

        return _tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner_, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner_][operator];
    }

    /*** internal ***/
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal virtual {
        _transfer(from, to, tokenId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        address owner_ = _tokenOwner[tokenId];
        return owner_ != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        require(_exists(tokenId), "LockIdNFT: operator query for nonexistent token");
        address owner_ = ownerOf(tokenId);
        return (spender == owner_ || getApproved(tokenId) == spender || isApprovedForAll(owner_, spender));
    }

    function _burn(address owner_, uint256 tokenId) internal virtual{
        require(ownerOf(tokenId) == owner_, "burn of token that is not own");
        // _beforeTokenTransfer(owner_, address(0), tokenId);
        _clearApproval(tokenId);

        _ownedTokensCount[owner_]--;
        _tokenOwner[tokenId] = address(0);

        emit Transfer(owner_, address(0), tokenId);
    }

    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory _data) internal virtual {
        require(tokenId != 0, "not allowed tokenId");
        _mint(to, tokenId);
        _addTokenToOwnerEnumeration(to, tokenId);
        _addTokenToAllTokensEnumeration(tokenId);
    }

    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "LockIdNFT: mint to the zero address");
        require(!_exists(tokenId), "LockIdNFT: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId, 1);

        _tokenOwner[tokenId] = to;
        unchecked {
            _ownedTokensCount[to] += 1;
        }

        emit Transfer(address(0), to, tokenId);
         _afterTokenTransfer(address(0), to, tokenId, 1);
    }


    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
    }


    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }


    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = _ownedTokens[from].length-1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        //_ownedTokens[from].length--;
        _ownedTokens[from].pop();

        // Note that _ownedTokensIndex[tokenId] hasn't been cleared: it still points to the old slot (now occupied by
        // lastTokenId, or just over the end of the array if the token was the last one).
    }

    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = _allTokens.length-1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        _allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        //_allTokens.length--;
        _allTokens.pop();
        _allTokensIndex[tokenId] = 0;
    }

    function _clearApproval(uint256 tokenId) private {
        if (_tokenApprovals[tokenId] != address(0)) {
            _tokenApprovals[tokenId] = address(0);
        }
    }

    /*
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ProjectToken: transfer of token that is not own");
        require(to != address(0), "ProjectToken: transfer to the zero address");

        // _beforeTokenTransfer(from, to, tokenId);
        _clearApproval(tokenId);

        _ownedTokensCount[from]--;
        _ownedTokensCount[to]++;

        _tokenOwner[tokenId] = to;

        _removeTokenFromOwnerEnumeration(from, tokenId);

        _addTokenToOwnerEnumeration(to, tokenId);

        emit Transfer(from, to, tokenId);
    }
    */

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ProjectToken: transfer of token that is not own");
        require(to != address(0), "ProjectToken: transfer to the zero address");

        // 기본정보 수정
        LibLockIdTransferable.LockedInfo memory lock = lockIdInfos[tokenId];

        require(lock.withdrawalTime == 0, "It is withdrawn already.");
        require(lock.end > block.timestamp, "Lock time is finished");
        lockIdInfos[tokenId].withdrawalTime = uint32(block.timestamp);

        // 새로 락업아이디 추가 .
        uint256 newLockId = ++maxTokenId;
        _safeMint(to, newLockId);

        _createLock(to, newLockId, lock.amount, lock.unlockWeeks,  lock.end, false);

        emit TransferLock(from, to, tokenId, newLockId, lock.amount, lock.end);
        emit LockCreated(to, newLockId, lock.amount, lock.end);
    }

     /**
     * @dev Hook that is called before any token transfer. This includes minting and burning. If {ERC721Consecutive} is
     * used, the hook may be called as part of a consecutive (batch) mint, as indicated by `batchSize` greater than 1.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s tokens will be transferred to `to`.
     * - When `from` is zero, the tokens will be minted for `to`.
     * - When `to` is zero, ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     * - `batchSize` is non-zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize) internal virtual {

    }

     /**
     * @dev Hook that is called after any token transfer. This includes minting and burning. If {ERC721Consecutive} is
     * used, the hook may be called as part of a consecutive (batch) mint, as indicated by `batchSize` greater than 1.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s tokens were transferred to `to`.
     * - When `from` is zero, the tokens were minted for `to`.
     * - When `to` is zero, ``from``'s tokens were burned.
     * - `from` and `to` are never both zero.
     * - `batchSize` is non-zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize) internal virtual {

    }


    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _setBaseURI(string memory baseURI_) internal virtual {
        _baseURI = baseURI_;
    }
    /*
    /// @dev Deposit
    function _deposit(
        address _addr,
        uint256 _lockId,
        uint256 _value,
        uint256 _unlockTime,
        bool _applyHistoryWeek,
        bool boolCreated
    ) internal ifFree returns (
        LibLockIdTransferable.Point memory pointByIdOld,
        LibLockIdTransferable.Point memory pointByIdNew,
        int256  passBias) {

        /////////////////////////////////////////////////
        // update base LockedInfo 락 기본 정보
        LibLockIdTransferable.LockedInfo memory preInfo = lockIdInfos[_lockId];
        LibLockIdTransferable.LockedInfo memory afterInfo = LibLockIdTransferable.LockedInfo({
                start: preInfo.start,
                end: preInfo.end,
                amount: preInfo.amount + _value,
                withdrawalTime: 0
            });

        if (_unlockTime > 0)  afterInfo.end = _unlockTime;
        if (afterInfo.start == 0)  afterInfo.start = block.timestamp;

        /////////////////////////////////////////////////
        // 기본정보 반영
        lockIdInfos[_lockId] = afterInfo;

        // Checkpoint
        _checkpoint(preInfo, afterInfo);

        // Save user point,
        int256 userSlope = afterInfo.amount * MULTIPLIER / maxTime ;
        int256 userBias = userSlope * (afterInfo.end -  block.timestamp) ;
        LibLockTOS.Point memory userPoint =
            LibLockTOS.Point({
                timestamp: block.timestamp,
                slope: userSlope,
                bias: userBias
            });
        pointHistoryByLockId[_lockId].push(userPoint);

    }
    */
    function _createLock(
        address _addr,
        uint256 _lockId,
        uint256 _value,
        uint256 _unlockWeeks,
        uint256 _unlockTime,
        bool applyTotal
    ) internal  {
        require(existedLockPeriod[_unlockWeeks], "unsupported unlock weeks");

        /////////////////////////////////////////////////
        // update base LockedInfo 락 기본 정보
        LibLockIdTransferable.LockedInfo memory afterInfo = LibLockIdTransferable.LockedInfo({
                start: uint32(block.timestamp),
                end: _unlockTime,
                unlockWeeks: _unlockWeeks,
                withdrawalTime: 0,
                amount: _value
            });

        /////////////////////////////////////////////////
        // 기본정보 반영
        lockIdInfos[_lockId] = afterInfo;

        /////////////////////////////////////////////////
        LibLockIdTransferable.Point memory pointByIdNew = LibLockIdTransferable.Point({
            slope: int256(afterInfo.amount * MULTIPLIER / maxTime),
            bias: 0 ,
            timestamp : block.timestamp
        });
        pointByIdNew.bias = pointByIdNew.slope * int256(afterInfo.end - block.timestamp);
        console.log("create lock timestamp : %s ", block.timestamp);
        /////////////////////////////////////////////////
        // 락아이디 반영
        pointHistoryByLockId[_lockId].push(pointByIdNew);

        if (applyTotal) {
            _insesrtCumulativeAddPoint(pointByIdNew);
            _insesrtCumulativeEndPoint (
                _unlockWeeks,
                _unlockTime,
                pointByIdNew.slope
            );
        }
    }
    function _increaseAmountInLock(
        uint256 _lockId,
        uint256 _value,
        uint256 _unlockWeeks
    ) internal ifFree {

        /////////////////////////////////////////////////
        // update base LockedInfo 락 기본 정보
        LibLockIdTransferable.LockedInfo memory preInfo = lockIdInfos[_lockId];
        LibLockIdTransferable.LockedInfo memory afterInfo = LibLockIdTransferable.LockedInfo({
                start: preInfo.start,
                end: preInfo.end,
                unlockWeeks: preInfo.unlockWeeks,
                withdrawalTime: 0,
                amount: preInfo.amount + _value
            });
        /////////////////////////////////////////////////
        // 기본정보 반영
        lockIdInfos[_lockId] = afterInfo;
        /////////////////////////////////////////////////
        // add point of LockId , 가장 최근의 포인트 (모두 누적 반영)
        uint256 lenOfId = pointHistoryByLockId[_lockId].length;
        LibLockIdTransferable.Point memory pointByIdOld;

        if(lenOfId > 0) pointByIdOld = pointHistoryByLockId[_lockId][lenOfId-1];
        else {
            pointByIdOld = LibLockIdTransferable.Point({
                slope: 0,
                bias: 0,
                timestamp : block.timestamp
            });
        }

        LibLockIdTransferable.Point memory pointByIdNew = LibLockIdTransferable.Point({
            slope: int256(afterInfo.amount * MULTIPLIER / maxTime),
            bias: 0 ,
            timestamp : block.timestamp
        });

        int passBias = pointByIdOld.slope * int256(block.timestamp - pointByIdOld.timestamp);
        console.log('passBias %s', uint256(passBias));
        int256 curBias = pointByIdOld.bias - passBias ;
        console.log('curBias %s', uint256(curBias));

        pointByIdNew.bias = curBias + (pointByIdNew.slope * int256(afterInfo.end - block.timestamp));
        console.log('pointByIdNew.bias  %s', uint256(pointByIdNew.bias));

        /////////////////////////////////////////////////
        // 락아이디 반영
        pointHistoryByLockId[_lockId].push(pointByIdNew);

        LibLockIdTransferable.Point memory changePoint = LibLockIdTransferable.Point({
            slope: int256(_value * MULTIPLIER / maxTime),
            bias: pointByIdNew.bias - pointByIdOld.bias + passBias,
            timestamp : block.timestamp
        });
        _insesrtCumulativeAddPoint(changePoint);
        // _insertDeleteSlopeCumuluative(delPoint);
        _insesrtCumulativeEndPoint (
            _unlockWeeks,
            afterInfo.end,
            changePoint.slope
        );


    }
    function _insesrtCumulativeAddPoint (LibLockIdTransferable.Point memory addPoint) internal {
        // console.log('epochUnit %s', epochUnit);

        uint256 nextTimeIndexOfTotalPoint =  nextTimeIndex(block.timestamp);
        console.log('_insesrtCumulativeAddPoint nextTimeIndexOfTotalPoint %s', nextTimeIndexOfTotalPoint);

        uint256 len = pointHistoryByWeek[nextTimeIndexOfTotalPoint].length;
        LibLockIdTransferable.Point memory pointLast ; // 가장 최근의 point
        if (len == 0 )  pointLast = pointOfLastTimeIndex();
        else  pointLast = pointHistoryByWeek[nextTimeIndexOfTotalPoint][len-1];
        console.log('_insesrtCumulativeAddPoint pointLast slope %s', uint256(pointLast.slope));

        int256 passBias = pointLast.slope * int256(block.timestamp - pointLast.timestamp);
        console.log('_insesrtCumulativeAddPoint passBias %s', uint256(passBias));

        LibLockIdTransferable.Point memory pointNew = LibLockIdTransferable.Point({
            slope: pointLast.slope + addPoint.slope,
            bias: pointLast.bias + addPoint.bias - passBias,
            timestamp : block.timestamp
        });

        pointHistoryByWeek[nextTimeIndexOfTotalPoint].push(pointNew);
        // console.log('_insesrtCumulativeAddPoint pointNew slope %s', uint256(pointNew.slope));
        // console.log('_insesrtCumulativeAddPoint nextTimeIndexOfTotalPoint %s', nextTimeIndexOfTotalPoint);

        if(!indexCheckOfTimeset[nextTimeIndexOfTotalPoint]) {
            indexCheckOfTimeset[nextTimeIndexOfTotalPoint] = true;
            indexOfTimeset.push(nextTimeIndexOfTotalPoint);
        }
    }

    function _insesrtCumulativeEndPoint (
            uint256 lockPeriodIndex,
            uint256 endTime,
            int256 endSlope
        ) internal {

        // require(existedLockPeriod[lockPeriodIndex], "wrong lockPeriodIndex");

        bool existedIndex = indexCheckOfTimesetForLockEnd[lockPeriodIndex][endTime];
        // console.log('_insesrtCumulativeEndPoint' );
        // console.logBool(existedIndex);

        int256 lastEndSlop = 0;
        if (!existedIndex) {
            uint256 lastTimeIndexLen = indexOfTimesetForLockEnd[lockPeriodIndex].length ;
            if(lastTimeIndexLen != 0) {
                uint256 lastTimeIndex = indexOfTimesetForLockEnd[lockPeriodIndex][lastTimeIndexLen-1];
                if(lastTimeIndex < endTime) {
                    lastEndSlop = slopeByLockEndTime[lockPeriodIndex][lastTimeIndex];
                    slopeByLockEndTime[lockPeriodIndex][endTime] += lastEndSlop;
                }
            }
            // console.log('_insesrtCumulativeEndPoint lastEndSlop %s', uint256(lastEndSlop) );
            indexCheckOfTimesetForLockEnd[lockPeriodIndex][endTime] = true;
            indexOfTimesetForLockEnd[lockPeriodIndex].push(endTime);
            // console.log('_insesrtCumulativeEndPoint endTime %s', endTime);
        }
        slopeByLockEndTime[lockPeriodIndex][endTime] += endSlope;
        // console.log('_insesrtCumulativeEndPoint slopeByLockEndTime[lockPeriodIndex][endTime] %s', uint256(slopeByLockEndTime[lockPeriodIndex][endTime]));
    }

    function _addInLock(
        address _addr,
        uint256 _lockId,
        uint256 _value,
        uint256 _unlockWeeks,
        uint256 _unlockTime,
        bool applyTotal
    ) internal ifFree {

        /////////////////////////////////////////////////
        // update base LockedInfo 락 기본 정보
        LibLockIdTransferable.LockedInfo memory preInfo = lockIdInfos[_lockId];
        LibLockIdTransferable.LockedInfo memory afterInfo = LibLockIdTransferable.LockedInfo({
                start: preInfo.start,
                end: preInfo.end,
                unlockWeeks: preInfo.unlockWeeks,
                withdrawalTime: 0,
                amount: preInfo.amount + _value
            });

        if (_unlockTime > 0)  afterInfo.end = _unlockTime;
        if (afterInfo.start == 0)  afterInfo.start = block.timestamp;

        /////////////////////////////////////////////////
        // 기본정보 반영
        lockIdInfos[_lockId] = afterInfo;
        console.log('_addInLock in %s',  _lockId);

        /////////////////////////////////////////////////
        // add point of LockId , 가장 최근의 포인트 (모두 누적 반영)
        uint256 lenOfId = pointHistoryByLockId[_lockId].length;
        LibLockIdTransferable.Point memory pointByIdOld;

        if(lenOfId > 0) pointByIdOld = pointHistoryByLockId[_lockId][lenOfId-1];
        else {
            pointByIdOld = LibLockIdTransferable.Point({
                slope: 0,
                bias: 0,
                timestamp : block.timestamp
            });
        }

        LibLockIdTransferable.Point memory pointByIdNew = LibLockIdTransferable.Point({
            slope: int256(afterInfo.amount * MULTIPLIER / maxTime),
            bias: 0 ,
            timestamp : block.timestamp
        });

        // uint256 remainTime = afterInfo.end - block.timestamp;
        // console.log('remainTime  %s', remainTime);
        console.log('pointByIdOld.slope  %s', uint256(pointByIdOld.slope));

        int passBias = pointByIdOld.slope * int256(block.timestamp - pointByIdOld.timestamp);
        console.log('passBias %s', uint256(passBias));
        int256 curBias = pointByIdOld.bias - passBias ;
        console.log('curBias %s', uint256(curBias));

        pointByIdNew.bias = curBias + (pointByIdNew.slope * int256(afterInfo.end - block.timestamp));
        console.log('pointByIdNew.bias  %s', uint256(pointByIdNew.bias));

        /////////////////////////////////////////////////
        // 락아이디 반영
        pointHistoryByLockId[_lockId].push(pointByIdNew);

        if (applyTotal) {

            LibLockIdTransferable.Point memory changePoint = LibLockIdTransferable.Point({
                slope: int256(_value * MULTIPLIER / maxTime),
                bias: pointByIdNew.bias - pointByIdOld.bias + passBias,
                timestamp : block.timestamp
            });
            _insesrtCumulativeAddPoint(changePoint);
            // _insertDeleteSlopeCumuluative(delPoint);
            _insesrtCumulativeEndPoint (
                _unlockWeeks,
                _unlockTime,
                pointByIdNew.slope
            );
        }

    }

    function _insertDeleteSlopeCumuluative(LibLockIdTransferable.Point memory point) internal {

        if(deleteSlopeCumuluative.length == 0) deleteSlopeCumuluative.push(point);
        else {
            LibLockIdTransferable.Point memory lastPoint = deleteSlopeCumuluative[deleteSlopeCumuluative.length-1];

            lastPoint.slope += point.slope;
            lastPoint.bias += point.bias;
            lastPoint.timestamp = block.timestamp;
            deleteSlopeCumuluative.push(lastPoint);
        }
    }

    /*
    function _modifyPointHistoryBYWeek(int256 slope, int256 bias, bool boolCreated)
        internal  {

        /////////////////////////////////////////////////
        // point history based time
        // deposit하면 다가오는 목요일 시간에 누적되어야 한다..총 금액이 다음 타임인덱스에 반영된다고 보아야 한다.
        uint256 nextTimeIndexOfTotalPoint =  nextTimeIndex(block.timestamp);

        uint256 len = pointHistoryByWeek[nextTimeIndexOfTotalPoint].length;
        LibLockIdTransferable.Point memory pointLast ; // 가장 최근의 point

        if (len == 0 ) {
            // 가장 최근 인덱스
            pointLast = pointOfLastTimeIndex();
        } else {
            pointLast = pointHistoryByWeek[nextTimeIndexOfTotalPoint][len-1];
        }
        // console.log('pointLast.bias ', uint256(pointLast.bias));

        // int256 currentBias = pointLast.slope * int256(block.timestamp - pointLast.timestamp);
        // currentBias = (pointLast.bias > currentBias ? (pointLast.bias - currentBias) : int256(0));

        LibLockIdTransferable.Point memory pointNew = LibLockIdTransferable.Point({
            slope: pointLast.slope + slope,
            bias: pointLast.bias + bias,
            timestamp : block.timestamp
        });

        if(boolCreated) {
            int256 currentBias = pointLast.slope * int256(block.timestamp - pointLast.timestamp);
            currentBias = (pointLast.bias > currentBias ? (pointLast.bias - currentBias) : int256(0));
            pointNew.bias = int256(currentBias) + bias;
        }
        /////////////////////////////////////////////////
        // 총계 집계를 위한 락아이디 반영
        pointHistoryByWeek[nextTimeIndexOfTotalPoint].push(pointNew);

        if(!indexCheckOfTimeset[nextTimeIndexOfTotalPoint]) {
            indexCheckOfTimeset[nextTimeIndexOfTotalPoint] = true;
            indexOfTimeset.push(nextTimeIndexOfTotalPoint);
        }
    }
    */
    function nextTimeIndex(uint256 _stime) public view returns(uint256) {
        return (_stime +  epochUnit) / epochUnit * epochUnit;
    }

    function lastIndexOfTimeset() public view returns(uint256 index) {
        index = (indexOfTimeset.length != 0 ? indexOfTimeset[indexOfTimeset.length - 1]:0);
        // console.log('lastIndexOfTimeset %s' , index);

    }

    function lastIndexOfTimesetForUnlimited() public view returns(uint256 index) {
        index = (indexOfTimesetForUnlimited.length != 0 ? indexOfTimesetForUnlimited[indexOfTimesetForUnlimited.length - 1]:0);
    }

    /// 가장 최근의 포인트
    function pointOfLastTimeIndex() public view returns(LibLockIdTransferable.Point memory) {
        // console.log('lastIndexOfTimeset() %s' , lastIndexOfTimeset());

        return lastPointOfTimeIndex(lastIndexOfTimeset());
    }

    function pointOfLastTimeIndexForUnlimited() public view returns(LibLockIdTransferable.UnlimitedAmount memory) {
        return lastPointOfTimeIndexForUnlimited(lastIndexOfTimesetForUnlimited());
    }

    /// 해당 타임의 가장 최신 포인트
    function lastPointOfTimeIndex(uint256 _index) public view returns(LibLockIdTransferable.Point memory) {
        //  console.log('lastPointOfTimeIndex _index %s' , _index);

        if (_index != 0) {
            LibLockIdTransferable.Point[] memory points = pointHistoryByWeek[_index];
            // console.log('lastPointOfTimeIndex points.length %s' , points.length);
            if (points.length != 0) {
                return LibLockIdTransferable.Point({
                    slope: points[points.length-1].slope,
                    bias: points[points.length-1].bias,
                    timestamp: points[points.length-1].timestamp
                });
            } else {
                return LibLockIdTransferable.Point({
                    slope: 0,
                    bias: 0,
                    timestamp: 0
                });
            }
        } else return LibLockIdTransferable.Point({
                    slope: 0,
                    bias: 0,
                    timestamp: 0
                });
    }

    function lastPointOfTimeIndexForUnlimited(uint256 _index) public view returns(LibLockIdTransferable.UnlimitedAmount memory) {
        if (_index != 0) {
            LibLockIdTransferable.UnlimitedAmount[] memory points = unlimitedHistoryByWeek[_index];

            if (points.length != 0) {
                return LibLockIdTransferable.UnlimitedAmount({
                    timestamp: points[points.length-1].timestamp,
                    amount: points[points.length-1].amount
                });
            } else {
                return LibLockIdTransferable.UnlimitedAmount({
                    timestamp: 0,
                    amount: 0
                });
            }
        } else return LibLockIdTransferable.UnlimitedAmount({
                    timestamp: 0,
                    amount: 0
                });
    }


    // 특정 락아아디의 전체 포인트 리스트
    function pointHistoryOfId(uint256 _lockId)
        public
        view
        returns (LibLockIdTransferable.Point[] memory)
    {
        return pointHistoryByLockId[_lockId];
    }


    /// 특정 타임인덱스의 전체 포인트 리스트
    function pointHistoryOfTimeIndex(uint256 _timeIndex)
        public
        view
        returns (LibLockIdTransferable.Point[] memory)
    {
        return pointHistoryByWeek[_timeIndex];
    }

    function pointHistoryOfUnlimited(address _addr)
        public
        view
        returns (LibLockIdTransferable.UnlimitedAmount[] memory)
    {
        return unlimitedAmountByAccount[_addr];
    }

    function pointHistoryOfTimeIndexForUnlimited(uint256 _timeIndex)
        public
        view
        returns (LibLockIdTransferable.UnlimitedAmount[] memory)
    {
        return unlimitedHistoryByWeek[_timeIndex];
    }

    function balanceOfAccount(address _addr)
        public
        view
        returns (uint256 balance)
    {
        balance = balanceOfUnlimitedLock(_addr) + balanceOfLock(_addr);
    }

    function balanceOfAccountAt(address _addr, uint256 _timestamp)
        public
        view
        returns (uint256 balance)
    {
        balance = balanceOfUnlimitedLockAt(_addr, _timestamp) + balanceOfLockAt(_addr, _timestamp);
    }

    function balanceOfUnlimitedLock(address _addr)
        public
        view
        returns (uint256 balance)
    {
        uint256 len = unlimitedAmountByAccount[_addr].length;
        balance = (len == 0? 0: balanceOfUnlimited(unlimitedAmountByAccount[_addr][len - 1], block.timestamp));
    }

    function balanceOfUnlimitedLockAt(address _addr, uint256 _timestamp)
        public
        view
        returns (uint256 balance)
    {
        // _timestamp
        (bool success, LibLockIdTransferable.UnlimitedAmount memory point) = _findClosestUnlimitedPoint(unlimitedAmountByAccount[_addr], _timestamp);
        balance = (!success? 0: balanceOfUnlimited(point, _timestamp));
    }

    /// 특정 계정이 소유한 stos를 가져옴.
    function balanceOfLock(address _addr)
        public
        view
        returns (uint256 balance)
    {
        uint256[] memory locks = tokensOfOwner(_addr);
        if (locks.length != 0) {
            for (uint256 i = 0; i < locks.length; ++i) {
                balance += balanceOfLock(locks[i]);
            }
        }
    }

    function balanceOfLockAt(address _addr, uint256 _timestamp)
        public
        view
        returns (uint256 balance)
    {
        uint256[] memory locks = tokensOfOwner(_addr);
        if (locks.length != 0) {
            for (uint256 i = 0; i < locks.length; ++i) {
                balance += balanceOfLockAt(locks[i], _timestamp);
            }
        }
    }

    /// 특정 락아이디의 현재 시간의 stos
    function balanceOfLock(uint256 _lockId)
        public
        view
        returns (uint256 amount)
    {
        LibLockIdTransferable.LockedInfo memory info = lockIdInfos[_lockId];
        if (info.withdrawalTime !=0 && info.withdrawalTime <= block.timestamp) return 0;
        if (info.end != 0 && info.end < block.timestamp) return 0;

        uint256 len = pointHistoryByLockId[_lockId].length;
        amount = (len == 0? 0: balanceOfPointId(pointHistoryByLockId[_lockId][len - 1], block.timestamp));
    }

    /// 특정 락아이디의 현재 시간의 stos
    function balanceOfLockAt(uint256 _lockId, uint256 _timestamp)
        public
        view
        returns (uint256 amount)
    {
        LibLockIdTransferable.LockedInfo memory info = lockIdInfos[_lockId];

        if (info.withdrawalTime !=0 && info.withdrawalTime <= _timestamp) return 0;
        if (info.end != 0 && info.end < _timestamp) return 0;

        (bool success, LibLockIdTransferable.Point memory point) = _findClosestPoint(pointHistoryByLockId[_lockId], _timestamp);
        // console.logBool(success);

        // console.log('balanceOfLock _timestamp %s : point.slope %s', _timestamp, uint256(point.slope));
        amount = (!success? 0: balanceOfPointId(point, _timestamp));
    }

    /// 현재 시간의 총 stos
    function totalSupplyAll()
        public
        view
        returns (uint256 amount)
    {
        amount = totalSupplyLocks() + totalSupplyUnlimited();
    }

    function totalSupplyAllAt(uint256 _timestamp)
        public
        view
        returns (uint256 amount)
    {
        amount = totalSupplyLocksAt(_timestamp) + totalSupplyUnlimitedAt(_timestamp);
    }

    function totalSupplyLocks()
        public
        view
        returns (uint256 amount)
    {
       amount = balanceOfPoint(pointOfLastTimeIndex(), block.timestamp);
    }

    function totalSupplyUnlimited()
        public
        view
        returns (uint256 amount)
    {
    //    amount = balanceOfUnlimited(pointOfLastTimeIndexForUnlimited(), block.timestamp);
    }

    function totalSupplyLocksAt(uint256 _timestamp)
        public
        view
        returns (uint256 amount)
    {
        // 해당 타임에 맞는 타임인덱스
        (bool success, uint256 timeindex) = _findClosestTimeindex(_timestamp);
        if(!success) return 0;
        // console.log("totalSupplyLocksAt timeindex %s", timeindex);
        (bool success1, LibLockIdTransferable.Point memory point) = _findClosestPoint(pointHistoryByWeek[timeindex], _timestamp);
        if(!success1) return 0;

        // console.log("point.slope %s", uint256(point.slope));
        // console.log("point.bias %s", uint256(point.bias));

        amount = balanceOfPoint(point, _timestamp);
    }

    function totalSupplyUnlimitedAt(uint256 _timestamp)
        public
        view
        returns (uint256 amount)
    {
        // 해당 타임에 맞는 타임인덱스
        // (bool success, uint256 timeindex) = _findClosestUnlimitedTimeindex(_timestamp);
        // if(!success) return 0;
        // (bool success1, LibLockIdTransferable.UnlimitedAmount memory point) = _findClosestUnlimitedPoint(unlimitedHistoryByWeek[timeindex], _timestamp);
        // if(!success1) return 0;
        // amount = balanceOfUnlimited(point, _timestamp);
    }

    function balanceOfPointId(LibLockIdTransferable.Point memory point, uint256 timestamp)
        public
        view
        returns (uint256)
    {
        console.log('balanceOfPointId point.timestamp %s' , point.timestamp);
        console.log('balanceOfPointId timestamp %s' , timestamp);
        console.log('balanceOfPointId point.slope %s' , uint256(point.slope));
        console.log('balanceOfPointId point.bias %s' , uint256(point.bias));
        // if(timestamp < point.timestamp) return 0;

        int256 currentBias = point.slope * int256(timestamp - point.timestamp);
        console.log('balanceOfPointId pass %s' , uint256(currentBias));
        console.log('balanceOfPointId stos %s' , uint256(point.bias - currentBias) / MULTIPLIER );

        uint256 aa = uint256(point.bias > currentBias ? (point.bias - currentBias) : int256(0)) / MULTIPLIER;
        console.log('balanceOfPointId aa %s' , aa);

        if(timestamp < point.timestamp) return 0;
        return
            uint256(point.bias > currentBias ? (point.bias - currentBias) : int256(0)) / MULTIPLIER;

    }

    function balanceOfPoint(LibLockIdTransferable.Point memory point, uint256 timestamp)
        public
        view
        returns (uint256)
    {
        console.log('**balanceOfPoint point slope: %s, bias: %s, timestamp %s,', uint256(point.slope), uint256(point.bias), point.timestamp );
        console.log(' timestamp %s',timestamp);

        if(timestamp < point.timestamp) return 0;

        int256 currentBias = point.slope * int256(timestamp - point.timestamp);
        console.log(' currentBias1 %s', uint256(currentBias));

        for(uint256 i = 0; i < lockPeriod.length; i++){
            (bool success, uint256 timeindex) = _findFasterTimeindexForLockEnd(
                indexOfTimesetForLockEnd[lockPeriod[i]], timestamp);
            console.logBool(success);
            console.log('balanceOfPoint timeindex %s', timeindex);

            if(success) {
                int256 endSlop = slopeByLockEndTime[lockPeriod[i]][timeindex];
                console.log('balanceOfPoint endSlop %s', uint256(endSlop));

                if(timestamp > timeindex) {
                    int256 endBias = endSlop * int256(timestamp - timeindex);
                    console.log('balanceOfPoint endBias %s', uint256(endBias));
                    currentBias += endBias;
                    if(point.slope <= endSlop ) return 0;
                }
            }
        }

        (bool success1, LibLockIdTransferable.Point memory lastDelPoint) = _findFasterDeleteSlopePoint(deleteSlopeCumuluative, timestamp);
        if (success1 && timestamp >= lastDelPoint.timestamp) {
            // console.log(' _findFasterDeleteSlopePoint ok %s , %s ', lastDelPoint.timestamp, uint256(lastDelPoint.slope));
            // int256 delBias = lastDelPoint.slope * int256(timestamp - lastDelPoint.timestamp);
            // console.log('delBias %s', uint256(delBias));
            console.log('lastDelPoint.bias %s', uint256(lastDelPoint.bias));
            currentBias += lastDelPoint.bias;
        }

        console.log(' currentBias2 %s', uint256(currentBias));

        return
            uint256(point.bias > currentBias ? (point.bias - currentBias) : int256(0)) / MULTIPLIER;
        // return
        //     uint256(point.bias > currentBias ? (point.bias - currentBias) : int256(0)) / MULTIPLIER;
    }

    function balanceOfUnlimited(LibLockIdTransferable.UnlimitedAmount memory point, uint256 timestamp)
        public
        view
        returns (uint256)
    {
        if(timestamp < point.timestamp || point.amount == 0) return 0;
        return (point.amount * MULTIPLIER / maxTime * maxTime / MULTIPLIER);
    }
    /*
    /// @dev Update slope changes
    function _updateSlopeChanges(
        LibLockIdTransferable.SlopeChange memory changeNew,
        LibLockIdTransferable.SlopeChange memory changeOld
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

    function _checkpoint(
        LibLockIdTransferable.LockedInfo memory lockedNew,
        LibLockIdTransferable.LockedInfo memory lockedOld
    ) internal {
        uint256 timestamp = block.timestamp;
        LibLockIdTransferable.SlopeChange memory changeNew =
            LibLockIdTransferable.SlopeChange({slope: 0, bias: 0, changeTime: 0});
        LibLockIdTransferable.SlopeChange memory changeOld =
            LibLockIdTransferable.SlopeChange({slope: 0, bias: 0, changeTime: 0});

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
        LibLockTOS.Point memory currentWeekPoint = _recordHistoryPoints();
        currentWeekPoint.bias = currentWeekPoint.bias + changeNew.bias - changeOld.bias;
        currentWeekPoint.slope = currentWeekPoint.slope + changeNew.slope - changeOld.slope;
        currentWeekPoint.bias = currentWeekPoint.bias > int256(0)? currentWeekPoint.bias: int256(0);
        currentWeekPoint.slope = currentWeekPoint.slope > int256(0)? currentWeekPoint.slope: int256(0);


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
        returns (LibLockTOS.Point memory lastWeek)
    {
        uint256 timestamp = block.timestamp;
        // console.log('_recordHistoryPoints timestamp %s', timestamp );
        if (pointHistory.length > 0) {
            lastWeek = pointHistory[pointHistory.length - 1];
        } else {
            lastWeek = LibLockTOS.Point({
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
    */
    function allIndexOfTimes() public view returns(uint256[] memory){
        return indexOfTimeset;
    }

    function allIndexOfUnlimitedTimes() public view returns(uint256[] memory){
        return indexOfTimesetForUnlimited;
    }

    function _findClosestPoint(
        LibLockIdTransferable.Point[] storage _history,
        uint256 _timestamp
    ) internal view returns(bool success, LibLockIdTransferable.Point memory point) {
        if (_history.length == 0) {
            console.log('_findClosestPoint _history.length == 0 _timestamp %s', _timestamp);
            return (false, point);
        }
        // console.log('_findClosestPoint _timestamp %s', _timestamp);
        uint256 left = 0;
        uint256 right = _history.length;
        while (left + 1 < right) {
            uint256 mid = (left + right) / 2;
            if (_history[mid].timestamp <= _timestamp) {
                left = mid;
            } else {
                right = mid;
            }
            // console.log('_findClosestPoint left %s, _history[left].timestamp %s', left, _history[left].timestamp);
        }

        if (_history[left].timestamp <= _timestamp) {
            return (true, _history[left]);
        }
        // console.log('_findClosestPoint false point.timestamp %s , _timestamp  %s', point.timestamp, _timestamp);

        return (false, point);
    }

    function _findClosestUnlimitedPoint(
        LibLockIdTransferable.UnlimitedAmount[] storage _history,
        uint256 _timestamp
    ) internal view returns(bool success, LibLockIdTransferable.UnlimitedAmount memory point) {
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

    function _findFasterTimeindexForLockEnd(
        uint256[] memory sets,
        uint256 _timestamp
    ) internal view returns(bool success, uint256 timeindex) {

        uint256 totalLen = sets.length;
        uint256 timeIndexKey = _timestamp / epochUnit * epochUnit ;
        // console.log('_findClosestTimeindexForLockEnd timeIndexKey %s', timeIndexKey);

        if (totalLen == 0) {
            return (false, 0);
        }
        uint256 left = 0;
        uint256 right = totalLen;

        while (left + 1 < right) {
            uint256 mid = (left + right) / 2;
            if (sets[mid] <= timeIndexKey) {
                left = mid;
            } else {
                right = mid;
            }
        }

        if (sets[left] <= timeIndexKey) {
            return (true, sets[left]);
        }
        return (false, 0);
    }

    function _findFasterDeleteSlopePoint(
        LibLockIdTransferable.Point[] memory sets,
        uint256 _timestamp
    ) internal view returns(bool success, LibLockIdTransferable.Point memory point) {

        uint256 totalLen = sets.length;

        if (totalLen == 0) {
            return (false, point);
        }
        uint256 left = 0;
        uint256 right = totalLen;

        while (left + 1 < right) {
            uint256 mid = (left + right) / 2;
            if (sets[mid].timestamp <= _timestamp) {
                left = mid;
            } else {
                right = mid;
            }
        }

        if (sets[left].timestamp <= _timestamp) {
            return (true, sets[left]);
        }
        return (false, point);
    }

    function _findClosestTimeindex(
        uint256 _timestamp
    ) public view returns(bool success, uint256 timeindex) {
        uint256 totalLen = indexOfTimeset.length;
        uint256 timeIndexKey =  (_timestamp + epochUnit) * epochUnit / epochUnit ;

        if (totalLen == 0) {
            return (false, 0);
        }
        uint256 left = 0;
        uint256 right = totalLen;

        while (left + 1 < right) {
            uint256 mid = (left + right) / 2;
            if (indexOfTimeset[mid] <= timeIndexKey) {
                left = mid;
            } else {
                right = mid;
            }
        }

        if (indexOfTimeset[left] <= timeIndexKey) {
            return (true, indexOfTimeset[left]);
        }
        return (false, 0);
    }
    /*
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
    */
    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId); // internal owner
    }
}
