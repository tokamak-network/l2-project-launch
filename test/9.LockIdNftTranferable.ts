import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber } from 'ethers'
import { lockIdFixture } from './shared/fixtures'
import { LockIdFixture, NftTokenInfo, Point } from './shared/fixtureInterfaces'

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

async function checkSnapshotAmount(deployed: LockIdFixture, lockId1: BigNumber, lockId2: BigNumber, timestamp: BigNumber){
    console.log('---------')

    // 스냅샷으로 조회하는거 같은지 확인 추가.
    let balanceOfLockAtId1 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId1, timestamp)
    let balanceOfLockAtId2 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId2, timestamp)

    let balanceOfUnlimitedLockAddr1 = await deployed.lockIdNftTransferable["balanceOfUnlimitedLockAt(address,uint256)"](deployed.addr1.address,timestamp)
    let balanceOfUnlimitedLockAddr2 = await deployed.lockIdNftTransferable["balanceOfUnlimitedLockAt(address,uint256)"](deployed.addr2.address,timestamp)

    let totalSupplyLocksAt = await deployed.lockIdNftTransferable.totalSupplyLocksAt(timestamp)
    let totalSupplyUnlimitedAt = await deployed.lockIdNftTransferable.totalSupplyUnlimitedAt(timestamp)
    let totalSupplyAllAt = await deployed.lockIdNftTransferable.totalSupplyAllAt(timestamp)

    console.log('balanceOfLockAtId1',balanceOfLockAtId1)
    console.log('balanceOfLockAtId2',balanceOfLockAtId2)
    console.log('totalSupplyLocksAt',totalSupplyLocksAt)
    // console.log('balanceOfUnlimitedLockAddr1',balanceOfUnlimitedLockAddr1)
    // console.log('balanceOfUnlimitedLockAddr2',balanceOfUnlimitedLockAddr2)

    // console.log('totalSupplyUnlimitedAt',totalSupplyUnlimitedAt)
    // console.log('totalSupplyAllAt',totalSupplyAllAt)
    let total1 = balanceOfUnlimitedLockAddr1.add(balanceOfUnlimitedLockAddr2)
    expect(ethers.utils.formatUnits(totalSupplyUnlimitedAt, 2).split(".")[0]).to.be.eq(
        ethers.utils.formatUnits(total1, 2).split(".")[0])
    expect(totalSupplyLocksAt).to.be.eq(balanceOfLockAtId1.add(balanceOfLockAtId2))
    expect(totalSupplyAllAt).to.be.eq(totalSupplyLocksAt.add(totalSupplyUnlimitedAt))
}

async function checkSumOfLocks(deployed: LockIdFixture, timestamp: BigNumber){
    console.log('--------- checkSumOfLocks timestamp ', timestamp)
    let maxTokenId = await deployed.lockIdNftTransferable.maxTokenId()

    let i = 1;
    let sum = BigNumber.from("0");

    if (timestamp != ethers.constants.Zero) {
        for (i = 1; i <= maxTokenId; i++) {
            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](
                BigNumber.from(""+i), timestamp)
            console.log('balanceOfLockAt',i ,balanceOfLockAt)

            sum = sum.add(balanceOfLockAt);
        }
        console.log('sum', sum)

        let totalSupplyLocksAt = await deployed.lockIdNftTransferable["totalSupplyLocksAt(uint256)"](timestamp)
        console.log('totalSupplyLocksAt', totalSupplyLocksAt)

        // expect(totalSupplyLocksAt).to.be.eq(sum)
        expect(ethers.utils.formatUnits(totalSupplyLocksAt, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])

    } else {
        for (i = 1; i <= maxTokenId; i++) {
            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](
                BigNumber.from(""+i))
            console.log('balanceOfLock',i ,balanceOfLockAt)
            sum = sum.add(balanceOfLockAt);
        }
        console.log('sum', sum)

        let totalSupplyLocksAt = await deployed.lockIdNftTransferable["totalSupplyLocks()"]()
        console.log('totalSupplyLocks', totalSupplyLocksAt)

        // expect(totalSupplyLocksAt).to.be.eq(sum)
        expect(ethers.utils.formatUnits(totalSupplyLocksAt, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])
    }

}


async function checkDecreaseStosByPassTime(deployed: LockIdFixture, lockId: BigNumber,  timestamp: BigNumber){
    console.log('--------- checkDecreaseStosByPassTime ')

    if (lockId == ethers.constants.Zero){
        let balanceOfLockAt = await deployed.lockIdNftTransferable["totalSupplyLocksAt(uint256)"](
            timestamp)
        let balanceOfLock = await deployed.lockIdNftTransferable["totalSupplyLocks()"]()
        expect(balanceOfLockAt).to.be.gt(balanceOfLock)

    }  else {
        let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](
            lockId, timestamp)
        let balanceOfLock = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](
            lockId)
        expect(balanceOfLockAt).to.be.gt(balanceOfLock)
    }

}


describe('LockIdFixture', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: LockIdFixture
    let nftTokenInfo: NftTokenInfo
    let pointHistory:Array<Point>;
    let addr1Ids:Array<[BigNumber, Array<Point>]> = [];
    let addr2Ids:Array<[BigNumber, Array<Point>]> = [];

    let stosBalanceL1:Array<SnapshotBalance> = [];
    let stosBalanceL2:Array<SnapshotBalance>  = [];

    before('create fixture loader', async () => {
        deployed = await lockIdFixture()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        nftTokenInfo = {
            name: "STOS NFT",
            symbol: "STOS"
        }
    })

    describe('# LockIdNftTransferable ', () => {

        it('createLock: create stos ', async () => {
            // 1. create stos by addr2
            const user = addr2
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("10");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockIdNftTransferable.address, amount);
            }

            const interface1 = deployed.lockIdNftTransferable.interface ;
            const topic = interface1.getEventTopic('LockCreated');
            const receipt = await(await deployed.lockIdNftTransferable.connect(user).createLock(
                amount,
                unlockWeeks
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNftTransferable.pointHistoryOfId(lockId)
            );
            addr2Ids.push([lockId, lockIdPoints]);

            let balanceOfLock1 = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
            // let totalSupplyLocks1 = await deployed.lockIdNftTransferable.totalSupplyLocks()
            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)

            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(amount)
            // expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)

            let allIndexOfTimeset = await deployed.lockIdNftTransferable.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)

            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
            await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

            await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
            await checkSumOfLocks(deployed, ethers.constants.Zero)

            let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr2.address, block.timestamp)

            // 첫번째 스냅샷
            stosBalanceL1.push({
                timestamp: block.timestamp,
                balance: balanceAddr1
            });

            stosBalanceL2.push({
                timestamp: block.timestamp,
                balance: balanceAddr2
            });

            // console.log('stosBalanceL1', stosBalanceL1)
            // console.log('stosBalanceL2', stosBalanceL2)

        });

    });


});

