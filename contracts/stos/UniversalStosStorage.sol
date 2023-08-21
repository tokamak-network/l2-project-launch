// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { LibUniversalStos } from "../libraries/LibUniversalStos.sol";


contract UniversalStosStorage {

    // 현재 노드의 체인아이디
    uint256 public curChainId;

    // chaindId list
    uint256[] public chainIds;

    // chainId - layerInfo  체인아이디 - 레이어정보(메신저주소, 이름)
    mapping(uint256 => LibUniversalStos.LayerInfo) public layerInfos;

    // chainId - user - syncBlockNumber   사용자의 최근 동기화때의 블록번호
    mapping(uint256 => mapping(address => uint256))  public userSyncBlockNumber;


}