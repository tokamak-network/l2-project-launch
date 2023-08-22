// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../libraries/LibLockTOS.sol";
import "../proxy/ProxyStorage2.sol";
import "./L1StosToL2Storage.sol";
import "hardhat/console.sol";


interface ILockTos {
    function locksInfo(uint256 _lockId)
            external
            view
            returns (
                uint256 start,
                uint256 end,
                uint256 amount
            );

    function locksOf(address _addr)
        external
        view
        returns (uint256[] memory);

    function pointHistoryOf(uint256 _lockId)
        external
        view
        returns (LibLockTOS.Point[] memory);

}


contract L1StosToL2 is ProxyStorage2, L1StosToL2Storage {

    modifier nonZero(uint256 _val) {
        require(_val != 0, "zero value");
        _;
    }
    /* ========== DEPENDENCIES ========== */

    /* ========== CONSTRUCTOR ========== */

    constructor (address managerAddress, address lockTosAddress, address addressManagerAddress) {
        _manager = managerAddress;
        lockTos = lockTosAddress;
        addressManager = addressManagerAddress;
    }

    /* ========== Anybody can ========== */

    function sync(address account) public {
        uint256[] memory lockIds = ILockTos(lockTos).locksOf(account);
        require(lockIds.length <= maxLockCountPerSync, "exceeded the maximum number of sync. Please use array function.");
        _sync(account, lockIds);
    }

    function sync(address account, uint256[] memory lockIds) public {
        require(lockIds.length <= maxLockCountPerSync, "exceeded the maximum number of sync.");
        require(lockIds.length != 0, "no sync data");
        uint256[] memory userLockIds = ILockTos(lockTos).locksOf(account);

        for(uint256 i = 0; i < lockIds.length; i++){
            bool unMatched = true;
            for(uint256 j = 0; j < userLockIds.length; j++){
                if(lockIds[i] == userLockIds[j]) {
                    unMatched = false;
                    if(j < userLockIds.length-1)
                        userLockIds[j] = userLockIds[userLockIds.length-1];
                    delete userLockIds[userLockIds.length-1];
                    break;
                }
            }
            require(!unMatched, "owner is not account");
        }

        _sync(account, lockIds);
    }

    /* ========== VIEW ========== */

    function needSyncList(address account) public view returns (uint256[] memory lockIds) {
        uint256[] memory ids = ILockTos(lockTos).locksOf(account);

        for(uint256 i = 0; i < ids.length; i++){
            LibLockId.SyncInfo memory curSync = syncInfoOfLockId[ids[i]];
            (, uint256 end, uint256 amount) = ILockTos(lockTos).locksInfo(ids[i]);
            if(amount != 0 && block.timestamp < end) {
                LibLockTOS.Point[] memory history = ILockTos(lockTos).pointHistoryOf(ids[i]);
                if(history.length != 0){
                    LibLockTOS.Point memory point = history[history.length-1];
                    if(curSync.timestamp < point.timestamp) lockIds[lockIds.length-1] = ids[i];
                }
            }
        }
    }

    function viewSyncInfoOfLockId(uint256 lockId) external view returns(LibLockId.SyncInfo memory) {
        return syncInfoOfLockId[lockId];
    }

    /* === ======= internal ========== */

    function _sync(address account, uint256[] memory lockIds) internal {

        uint256[] memory syncIds ;
        bytes memory syncPackets ;
        // packet {address: count to sync: 1st sync packet: 2nd sync packet: .....}
        // address : 20 bytes
        // count to sync : 1 byte (max 256 sync packets) but it is less than maxLockCountPerSync
        // sync packets : count to sync * 104 bytes ( count * 104 )
        // one sync packets : 104 bytes:  (32 byte) uint256 lockId, (32+32+4+4) syncInfo -> total 104

        for(uint256 i = 0; i < lockIds.length; i++){
            LibLockId.SyncInfo memory curSync = syncInfoOfLockId[lockIds[i]];
            (, uint256 end, uint256 amount) = ILockTos(lockTos).locksInfo(lockIds[i]);
            if (amount != 0 && block.timestamp < end){
                LibLockTOS.Point[] memory history = ILockTos(lockTos).pointHistoryOf(lockIds[i]);
                if(history.length != 0){
                    LibLockTOS.Point memory point = history[history.length-1];
                    if(curSync.timestamp < point.timestamp) {
                        LibLockId.SyncInfo memory newSync = LibLockId.SyncInfo(
                            {
                                slope: point.slope,
                                bias: point.bias,
                                timestamp: uint32(point.timestamp),
                                syncTime: uint32(block.timestamp)
                            }
                        );
                        syncInfoOfLockId[lockIds[i]] = newSync;
                        syncIds[syncIds.length-1] = lockIds[i];
                        syncPackets = bytes.concat(syncPackets, abi.encode(lockIds[i], newSync));
                    }
                }
            }
        }

        require(syncPackets.length > 0, "no sync data");
        bytes memory syncData = bytes.concat(abi.encodePacked(account, syncIds.length), syncPackets);

        // 동기화 요청
    }

}