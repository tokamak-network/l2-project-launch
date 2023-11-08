// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "../libraries/BytesLib.sol";
import "../libraries/LibLockId.sol";

import "../proxy/ProxyStorage2.sol";
import "./L1StosInL2Storage.sol";

// import "hardhat/console.sol";

interface ILockIdNftForRegister {
    function register(
        address account,
        LibLockId.SyncPacket[] memory packets
    ) external;
}

interface IL2CrossDomainMessenger {
    function xDomainMessageSender() external view returns (address);
}

contract L1StosInL2 is ProxyStorage2, L1StosInL2Storage {
    using BytesLib for bytes;

    modifier onlyMessengerAndL1Register() {

        require(
            l2CrossDomainMessenger == msg.sender &&
            IL2CrossDomainMessenger(l2CrossDomainMessenger).xDomainMessageSender() == l1Register,
            "not onlyMessengerAndL1Register");
        _;
    }

    modifier nonZero(uint256 _val) {
        require(_val != 0, "zero value");
        _;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "not owner");
        _;
    }

    function initialize (
        address managerAddress,
        address l2messanger_
    ) external onlyOwner  {
        _manager = managerAddress;
        l2CrossDomainMessenger =l2messanger_;
    }

    function setL1Register(address l1Register_) external onlyManager {
        require(l1Register != l1Register_, "same");
        l1Register = l1Register_;
    }

    function setLockIdNft(address lockIdNft_) external onlyManager {
        require(lockIdNftForRegister != lockIdNft_, "same");
        lockIdNftForRegister = lockIdNft_;
    }

    /*** Public ***/
    // function register(bytes memory data) public {
    //     console.log('IL1StosInL2 register in' );
    //     console.logBytes(data);
    //     console.log('IL1StosInL2 l2CrossDomainMessenger %s', l2CrossDomainMessenger);
    //     console.log('IL1StosInL2 msg.sender %s', msg.sender );
    //     address xDomainMessageSender = IL2CrossDomainMessenger(l2CrossDomainMessenger).xDomainMessageSender();

    //     console.log('IL1StosInL2 xDomainMessageSender %s', xDomainMessageSender );
    //     console.log('IL1StosInL2 l1Register %s', l1Register );


    // }

    function register(bytes memory data) public onlyMessengerAndL1Register {

        // packet {address | 1st sync packet  2nd sync packet  .....}
        // address : 20 bytes
        // one sync packets : 104 bytes:  (32 byte) uint256 lockId, (32+32+4+4) syncInfo -> total 104
        require(data.length > 123, "wrong bytes length");
        address user = data.toAddress(0);

        LibLockId.SyncPacket[] memory packets = decodeSyncPackets(data.slice(20,(data.length-20)));

        require(packets.length != 0, "no sync data");
        ILockIdNftForRegister(lockIdNftForRegister).register(user, packets);
    }

    function multiRegister(bytes[] memory datas) external onlyMessengerAndL1Register {
        require(datas.length != 0, "no data");
        for(uint256 i = 0; i < datas.length; i++) {
            register(datas[i]);
        }
    }


    function decodeSyncPackets(bytes memory data) public pure returns (LibLockId.SyncPacket[] memory packets) {
        uint256 packSize = 104;
        uint256 len = data.length / packSize;
        packets = new LibLockId.SyncPacket[](len);
        for(uint256 i = 0; i < len ; i++){
            bytes memory packet = data.slice(i, packSize);
            packets[i] = LibLockId.SyncPacket({
                lockId: packet.toUint256(0),
                packet: LibLockId.SyncInfo({
                    slope: packet.toInt256(32),
                    bias: packet.toInt256(64),
                    timestamp: packet.toUint32(96),
                    syncTime: packet.toUint32(100)
                })
            });
        }
    }

}
