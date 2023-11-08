import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber } from 'ethers'
import { lockIdFixture, stosFixture } from './shared/fixtures'
import { LockIdFixture, StosFixture, NftTokenInfo, Point, SyncInfo, SnapshotBalance } from './shared/fixtureInterfaces'

function convertPointStructOutputToPoint(pointsArray: Array<any>){
    let pointArray:Array<Point> = [];
    pointsArray.forEach(element => {
        pointArray.push({
            slope: element.slope,
            bias: element.bias,
            timestamp: element.timestamp
        })
    });

    return pointArray;
}

function convertPointStructOutputToSync(pointsArray: Array<any>){
    let pointArray:Array<SyncInfo> = [];
    pointsArray.forEach(element => {
        pointArray.push({
            slope: element.slope,
            bias: element.bias,
            timestamp: element.timestamp,
            syncTime: element.syncTime
        })
    });

    return pointArray;
}

async function checkBalanceSame(deployed: LockIdFixture, lockId: BigNumber ){
    // 스냅샷으로 조회하는거 같은지 확인 추가.
    let balanceOfLock1 = await deployed.lockIdNftRegisterInL2["balanceOfLock(uint256)"](lockId)
    let totalSupplyLocks1 = await deployed.lockIdNftRegisterInL2.totalSupplyLocks()
    expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)
    expect(balanceOfLock1).to.be.gt(ethers.constants.Zero)

    let balanceOfLockTOS  = await deployed.lockTOS.balanceOfLock(lockId)
    let totalSupplyLockTOS = await deployed.lockTOS.totalSupply()
    expect(balanceOfLockTOS).to.be.eq(totalSupplyLockTOS)

    expect(balanceOfLock1).to.be.eq(balanceOfLockTOS)

}

async function checkBalanceAtSame(deployed: LockIdFixture, lockId: BigNumber, timestamp: number){
    // 스냅샷으로 조회하는거 같은지 확인 추가.
    let balanceOfLock1 = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, timestamp)
    let totalSupplyLocks1 = await deployed.lockIdNftRegisterInL2.totalSupplyLocksAt(timestamp)
    expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)
    expect(balanceOfLock1).to.be.gt(ethers.constants.Zero)
    let balanceOfLockTOS  = await deployed.lockTOS.balanceOfLockAt(lockId,timestamp)
    let totalSupplyLockTOS = await deployed.lockTOS.totalSupplyAt(timestamp)
    expect(balanceOfLockTOS).to.be.eq(totalSupplyLockTOS)
    expect(balanceOfLock1).to.be.eq(balanceOfLockTOS)
}

describe('Stos', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: StosFixture
    let nftTokenInfo: NftTokenInfo
    let pointHistory:Array<Point>;
    let addr1Ids:Array<[BigNumber, Array<Point>]> = [];
    let addr1IdsL2:Array<[BigNumber, Array<SyncInfo>]> = [];
    let addr2Ids:Array<[BigNumber, Array<Point>]> = [];

    let stosBalanceL1:Array<SnapshotBalance> = [];
    let stosBalanceL2:Array<SnapshotBalance>  = [];


    before('create fixture loader', async () => {
        deployed = await stosFixture()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        nftTokenInfo = {
            name: "STOS NFT",
            symbol: "STOS"
        }
    })

    describe('# L1StosToL2', () => {

        it('needSyncList', async () => {
            // 1.stos에서 싱크할 수 있는 것을 찾는다.
            const user = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'
            console.log('user', user)
            let ids = await deployed.l1StosToL2.needSyncList(user);
            console.log('ids', ids)
        });


    });

});

