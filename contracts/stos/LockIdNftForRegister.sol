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
import "./LockIdRegisterStorage1.sol";
import "./LockIdRegisterStorage2.sol";
// import "hardhat/console.sol";

contract LockIdNftForRegister is
    ProxyStorage2,
    LockIdRegisterStorage1,
    LockIdRegisterStorage2,
    IERC721, IERC721Metadata, IERC721Enumerable
{
    // using SafeMath for uint256;
    using Address for address;
    using Strings for uint256;

    modifier nonZero(uint256 _val) {
        require(_val != 0, "zero value");
        _;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "not owner");
        _;
    }

    constructor (){}

    /*** External onlyManager ***/

    function initialize(
        string memory name_,
        string memory symbol_,
        address managerAddress,
        uint256 epochUnit_,
        uint256 maxTime_
    ) external onlyOwner {
        _manager = managerAddress; // manager is L1StosInL2
        _name = name_;
        _symbol = symbol_;
        epochUnit = epochUnit_;
        maxTime = maxTime_;
    }

    /*** External ***/
    function register(
        address account,
        LibLockId.SyncPacket[] memory packets
        )
        public onlyManager
    {
        require(packets.length !=0, 'no data');
        for(uint256 i = 0; i < packets.length; i++){
            if(!_exists(packets[i].lockId)) {
                _safeMint(account, packets[i].lockId);
            }
            _deposit(account, packets[i].lockId, packets[i].packet);
        }
    }

    /*** Public ***/
    function approve(address to, uint256 tokenId) public virtual override {

    }

    function setApprovalForAll(address operator, bool approved) public virtual override {

    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {

    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {

    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {

    }

    /*** View ***/

    // /**
    //  * @dev Overrides supportsInterface
    //  */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165P) returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

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
        return '';
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

    function getApproved(uint256 tokenId) public view virtual override returns (address) {
    }

    function isApprovedForAll(address owner_, address operator) public view virtual override returns (bool) {
    }

    /*** internal ***/

    function _exists(uint256 tokenId) internal view returns (bool) {
        address owner_ = _tokenOwner[tokenId];
        return owner_ != address(0);
    }

    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory _data) internal virtual {
        require(tokenId != 0, "not allowed tokenId");
        _mint(to, tokenId);

        _addTokenToOwnerEnumeration(to, tokenId);

        _addTokenToAllTokensEnumeration(tokenId);

        require(_checkOnERC721Received(address(0), to, tokenId, _data), "LockIdNFT: transfer to non ERC721Receiver implementer");
    }

    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "LockIdNFT: mint to the zero address");
        require(!_exists(tokenId), "LockIdNFT: token already minted");

        // _beforeTokenTransfer(address(0), to, tokenId, 1);

        _tokenOwner[tokenId] = to;
        unchecked {
            _ownedTokensCount[to] += 1;
        }

        emit Transfer(address(0), to, tokenId);
        //  _afterTokenTransfer(address(0), to, tokenId, 1);
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

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data)
        private returns (bool)
    {
        if (!to.isContract()) {
            return true;
        }
        bytes memory returndata = to.functionCall(abi.encodeWithSelector(
            IERC721Receiver(to).onERC721Received.selector,
            msg.sender,
            from,
            tokenId,
            _data
        ), "LockIdNFT: transfer to non ERC721Receiver implementer");
        bytes4 retval = abi.decode(returndata, (bytes4));
        return (retval == _ERC721_RECEIVED);
    }


    /// @dev Deposit
    function _deposit(
        address _addr,
        uint256 _lockId,
        LibLockId.SyncInfo memory syncInfo
    ) internal ifFree {

        /////////////////////////////////////////////////
        // add point of LockId , 가장 최근의 포인트 (모두 누적 반영)
        uint256 lenOfId = pointHistoryByLockId[_lockId].length;
        LibLockId.SyncInfo memory pointByIdOld ;
        LibLockId.SyncInfo memory pointByIdNew = LibLockId.SyncInfo({
            slope: syncInfo.slope,
            bias: syncInfo.bias,
            timestamp : syncInfo.timestamp,
            syncTime : uint32(block.timestamp)
        });

        if(lenOfId > 0) pointByIdOld = pointHistoryByLockId[_lockId][lenOfId-1];
        else {
            pointByIdOld = LibLockId.SyncInfo({
                slope: 0,
                bias: 0,
                timestamp : 0,
                syncTime : 0
            });
        }

        /////////////////////////////////////////////////
        // 변경된 값
        LibLockId.SyncInfo memory pointByIdChange = LibLockId.SyncInfo({
            slope: pointByIdNew.slope - pointByIdOld.slope,
            bias: pointByIdNew.bias - pointByIdOld.bias,
            timestamp : syncInfo.timestamp,
            syncTime : uint32(block.timestamp)
        });

        /////////////////////////////////////////////////
        // 락아이디 반영
        pointHistoryByLockId[_lockId].push(pointByIdNew);

        /////////////////////////////////////////////////
        // point history based time
        // deposit하면 다가오는 목요일 시간에 누적되어야 한다..총 금액이 다음 타임인덱스에 반영된다고 보아야 한다.
        uint256 nextTimeIndexOfTotalPoint =  nextTimeIndex(block.timestamp);

        uint256 len = pointHistoryByWeek[nextTimeIndexOfTotalPoint].length;
        LibLockId.SyncInfo memory pointLast ; // 가장 최근의 point

        if (len == 0 ) {
            // 가장 최근 인덱스
            pointLast = pointOfLastTimeIndex();
        } else {
            pointLast = pointHistoryByWeek[nextTimeIndexOfTotalPoint][len-1];
        }

        LibLockId.SyncInfo memory pointNew = LibLockId.SyncInfo({
            slope: pointLast.slope + pointByIdChange.slope,
            bias: pointLast.bias + pointByIdChange.bias,
            timestamp : syncInfo.timestamp,
            syncTime : uint32(block.timestamp)
        });

        /////////////////////////////////////////////////
        // 총계 집계를 위한 락아이디 반영
        pointHistoryByWeek[nextTimeIndexOfTotalPoint].push(pointNew);

        if(!indexCheckOfTimeset[nextTimeIndexOfTotalPoint]) {
            indexCheckOfTimeset[nextTimeIndexOfTotalPoint] = true;
            indexOfTimeset.push(nextTimeIndexOfTotalPoint);
        }
    }

    function nextTimeIndex(uint256 _stime) public view returns(uint256) {
        return (_stime +  epochUnit / epochUnit * epochUnit);
    }

    function lastIndexOfTimeset() public view returns(uint256 index) {
        index = (indexOfTimeset.length != 0 ? indexOfTimeset[indexOfTimeset.length - 1]:0);
    }

    /// 가장 최근의 포인트
    function pointOfLastTimeIndex() public view returns(LibLockId.SyncInfo memory) {
        return lastPointOfTimeIndex(lastIndexOfTimeset());
    }

    /// 해당 타임의 가장 최신 포인트
    function lastPointOfTimeIndex(uint256 _index) public view returns(LibLockId.SyncInfo memory) {
        if (_index != 0) {
            LibLockId.SyncInfo[] memory points = pointHistoryByWeek[_index];

            if (points.length != 0) {
                return LibLockId.SyncInfo({
                    slope: points[points.length-1].slope,
                    bias: points[points.length-1].bias,
                    timestamp: points[points.length-1].timestamp,
                    syncTime : points[points.length-1].syncTime
                });
            } else {
                return LibLockId.SyncInfo({
                    slope: 0,
                    bias: 0,
                    timestamp: 0,
                    syncTime : 0
                });
            }
        } else return LibLockId.SyncInfo({
                    slope: 0,
                    bias: 0,
                    timestamp: 0,
                    syncTime : 0
                });
    }

    // 특정 락아아디의 전체 포인트 리스트
    function pointHistoryOfId(uint256 _lockId)
        public
        view
        returns (LibLockId.SyncInfo[] memory)
    {
        return pointHistoryByLockId[_lockId];
    }


    /// 특정 타임인덱스의 전체 포인트 리스트
    function pointHistoryOfTimeIndex(uint256 _timeIndex)
        public
        view
        returns (LibLockId.SyncInfo[] memory)
    {
        return pointHistoryByWeek[_timeIndex];
    }

    /// 특정 계정이 소유한 stos를 가져옴.
    function balanceOfLock(address _addr)
        public
        view
        returns (uint256 balance)
    {
        uint256[] memory locks = tokensOfOwner(_addr);
        if (locks.length == 0) return 0;
        for (uint256 i = 0; i < locks.length; ++i) {
            balance += balanceOfLock(locks[i]);
        }
    }

    function balanceOfLockAt(address _addr, uint32 _timestamp)
        public
        view
        returns (uint256 balance)
    {
        uint256[] memory locks = tokensOfOwner(_addr);
        if (locks.length == 0) return 0;
        for (uint256 i = 0; i < locks.length; ++i) {
            balance += balanceOfLockAt(locks[i], _timestamp);
        }
    }

    /// 특정 락아이디의 현재 시간의 stos
    function balanceOfLock(uint256 _lockId)
        public
        view
        returns (uint256 amount)
    {
        uint256 len = pointHistoryByLockId[_lockId].length;
        amount = (len == 0? 0: balanceOfPoint(pointHistoryByLockId[_lockId][len - 1], block.timestamp));
    }

    /// 특정 락아이디의 현재 시간의 stos
    function balanceOfLockAt(uint256 _lockId, uint32 _timestamp)
        public
        view
        returns (uint256 amount)
    {
        (bool success, LibLockId.SyncInfo memory point) = _findClosestPoint(
            pointHistoryByLockId[_lockId], _timestamp);
        amount = (!success? 0: balanceOfPoint(point, _timestamp));
    }

    /// 현재 시간의 총 stos
    function totalSupplyLocks()
        public
        view
        returns (uint256 amount)
    {
       amount = balanceOfPoint(pointOfLastTimeIndex(), block.timestamp);
    }

    function totalSupplyLocksAt(uint32 _timestamp)
        public
        view
        returns (uint256 amount)
    {
        // 해당 타임에 맞는 타임인덱스
        (bool success, uint256 timeindex) = _findClosestTimeindex(_timestamp);
        if(!success) return 0;
        (bool success1, LibLockId.SyncInfo memory point) = _findClosestPoint(
            pointHistoryByWeek[timeindex], _timestamp);
        if(!success1) return 0;
        amount = balanceOfPoint(point, _timestamp);
    }

    function balanceOfPoint(LibLockId.SyncInfo memory point, uint256 timestamp)
        public
        pure
        returns (uint256)
    {
        if(timestamp < point.syncTime) return 0;
        int256 currentBias = point.slope * int256(timestamp - point.timestamp);
        return
            uint256(point.bias > currentBias ? (point.bias - currentBias) : int256(0)) / MULTIPLIER;
    }

    function allIndexOfTimes() public view returns(uint256[] memory){
        return indexOfTimeset;
    }

    function _findClosestPoint(
        LibLockId.SyncInfo[] storage _history,
        uint32 _timestamp
    ) internal view returns(bool success, LibLockId.SyncInfo memory point) {
        if (_history.length == 0) {
            return (false, point);
        }
        uint256 left = 0;
        uint256 right = _history.length;
        while (left + 1 < right) {
            uint256 mid = (left + right) / 2;
            if (_history[mid].syncTime <= _timestamp) {
                left = mid;
            } else {
                right = mid;
            }
        }

        if (_history[left].syncTime <= _timestamp) {
            return (true, _history[left]);
        }
        return (false, point);
    }

    function _findClosestTimeindex(
        uint256 _timestamp
    ) internal view returns(bool success, uint256 timeindex) {
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
}
