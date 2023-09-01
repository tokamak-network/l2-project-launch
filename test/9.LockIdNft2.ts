import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber } from 'ethers'
import { lockIdFixture } from './shared/fixtures'
import { LockIdFixture, NftTokenInfo, Point } from './shared/fixtureInterfaces'


function logPoint(title: string, pointsArray: Array<any>){
    console.log('pointsArray',title )
    let j=0;
    for(j=0; j < pointsArray.length; j++){
        console.log( j, pointsArray[j])
    }
}


async function logPointWeeks(title: string, deployed:LockIdFixture, timeIndexes: Array<number>){
    console.log('pointsArray',title )

    let j=0, m=0;
    for(m = 0; m < timeIndexes.length; m++){
        console.log('----', timeIndexes[m] )
        let pointsArray = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(timeIndexes[m])
        for(j=0; j < pointsArray.length; j++){
            console.log(m, j, pointsArray[j])
        }
    }

}

// let points = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)
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

    if (timestamp.gt(ethers.constants.Zero)) {
        for (i = 1; i <= maxTokenId; i++) {
            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](
                BigNumber.from(""+i), timestamp)
            // console.log('balanceOfLockAt',i ,balanceOfLockAt)

            sum = sum.add(balanceOfLockAt);
        }
        // console.log('sum', sum)

        let totalSupplyLocksAt = await deployed.lockIdNftTransferable["totalSupplyLocksAt(uint256)"](timestamp)
        // console.log('totalSupplyLocksAt', totalSupplyLocksAt)

        // expect(totalSupplyLocksAt).to.be.eq(sum)
        expect(ethers.utils.formatUnits(totalSupplyLocksAt, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])

    } else {
        console.log('--- at current ----')

        for (i = 1; i <= maxTokenId; i++) {
            console.log('lockId', i)

            let balanceOfLock = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](BigNumber.from(""+i))
            console.log('balanceOfLock',i ,balanceOfLock)
            sum = sum.add(balanceOfLock);
        }
        console.log('sum', sum)

        let totalSupplyLocks = await deployed.lockIdNftTransferable["totalSupplyLocks()"]()
        console.log('totalSupplyLocks', totalSupplyLocks)

        expect(ethers.utils.formatUnits(totalSupplyLocks, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])
    }

}


async function checkDecreaseStosByPassTime(deployed: LockIdFixture, lockId: BigNumber,  timestamp: BigNumber){
    console.log('--------- checkDecreaseStosByPassTime ')

    if (lockId.eq(ethers.constants.Zero)){
        let balanceOfLockAt = await deployed.lockIdNftTransferable["totalSupplyLocksAt(uint256)"](
            timestamp)
        console.log('totalSupplyLocksAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockIdNftTransferable["totalSupplyLocks()"]()
        console.log('totalSupplyLocks', balanceOfLockAt)
        expect(balanceOfLockAt).to.be.gt(balanceOfLock)

    }  else {
        // console.log('timestamp', timestamp)
        let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](
            lockId, timestamp)
        // console.log('balanceOfLockAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](
            lockId)
        // console.log('balanceOfLock', balanceOfLock)
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

    // describe('# LockIdNFTProxy ', () => {

    //     it('upgradeTo() only Owner', async () => {

    //         await expect(
    //             deployed.titanNFTProxy.connect(addr1).upgradeTo(ethers.constants.AddressZero))
    //             .to.be.rejectedWith("not owner");

    //         await expect(
    //             deployed.titanNFTProxy.connect(deployed.manager).upgradeTo(ethers.constants.AddressZero))
    //             .to.be.rejectedWith("not owner");

    //         await (await deployed.titanNFTProxy.connect(deployer).upgradeTo(deployed.firstEvent.address)).wait()

    //         await (await deployed.titanNFTProxy.connect(deployer).upgradeTo(deployed.titanNFT.address)).wait()

    //     });

    // });


    // unlockWeeks 2, 4 , 8, 12, 24, 54


    describe('# LockIdNftTransferable ', () => {

        it('addLockPeriod', async () => {

            await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
                ethers.BigNumber.from("8")
            )).wait();

        });

        it('createLock: create stos ', async () => {
            let maxTime = await deployed.lockIdNftTransferable.maxTime();
            let epochUnit = await deployed.lockIdNftTransferable.epochUnit();
            console.log('maxTime', maxTime)
            console.log('epochUnit', epochUnit)

            // 1. create stos by addr2
            const user = addr2
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("8");
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
            // console.log('balanceOfLock1', balanceOfLock1)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(amount)
            // expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)

            let allIndexOfTimeset = await deployed.lockIdNftTransferable.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7*7])
            ethers.provider.send("evm_mine");

            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            // console.log('balanceOfLockAt', balanceOfLockAt)

            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)

            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))

            let ttt = block.timestamp + 60;
            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+ttt))
            await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

            await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
            await checkSumOfLocks(deployed, BigNumber.from(""+ttt))
            await checkSumOfLocks(deployed, ethers.constants.Zero)


            // //--------
            // ethers.provider.send("evm_increaseTime", [60*60*24*7*2])
            // ethers.provider.send("evm_mine");

            // expect(await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)).to.be.eq(
            //     ethers.constants.Zero
            // )
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

        it('depositFor: increase stos', async () => {
            // 3. addr1 increase stos
            const user = addr2
            let lockId =  addr2Ids[addr2Ids.length-1][0];
            // console.log('lockId', lockId)

            // logPoint("pointHistoryByLockId", await deployed.lockIdNftTransferable.pointHistoryOfId(lockId) )
            // let indexTimes = await deployed.lockIdNftTransferable.allIndexOfTimes();
            // logPointWeeks("pointHistoryByWeek", deployed, indexTimes[0])

            let lockIdInfos0 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
            // console.log('lockIdInfos0', lockIdInfos0)

            let amount = ethers.utils.parseEther("50");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockIdNftTransferable.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockIdNftTransferable.address, amount);
            }

            const interface1 = deployed.lockIdNftTransferable.interface ;
            const topic = interface1.getEventTopic('LockDeposited');
            const receipt = await(await deployed.lockIdNftTransferable.connect(user).depositFor(
                user.address,
                lockId,
                amount
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId2 = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNftTransferable.pointHistoryOfId(lockId2)
            );
            expect(lockId2).to.be.eq(lockId)
            addr1Ids.push([lockId2, lockIdPoints]);
            // console.log('lockId2', lockId2)

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp ', block.timestamp)

            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId2)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId2)).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(lockIdInfos0.amount.add(amount))

            // console.log('lockIdInfos1', lockIdInfos1)

            // console.log('block.timestamp', block.timestamp)

            // logPoint("pointHistoryByLockId", await deployed.lockIdNftTransferable.pointHistoryOfId(lockId) )
            // indexTimes = await deployed.lockIdNftTransferable.allIndexOfTimes();
            // logPointWeeks("pointHistoryByWeek", deployed, indexTimes)

            ethers.provider.send("evm_increaseTime", [60*60*1])
            ethers.provider.send("evm_mine");

            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
            await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

            await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
            await checkSumOfLocks(deployed, ethers.constants.Zero)

            let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr2.address, block.timestamp)

            // 세번째 스냅샷
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
        /*
        it('createLock: create stos ', async () => {
            let lockIdInfos0 = await deployed.lockIdNftTransferable.lockIdInfos(ethers.constants.One)
            console.log('lockIdInfos0', ethers.constants.One, lockIdInfos0)

            logPoint("pointHistoryByLockId", await deployed.lockIdNftTransferable.pointHistoryOfId(
                ethers.constants.One
            ) )
            let indexTimes0 = await deployed.lockIdNftTransferable.allIndexOfTimes();
            logPointWeeks("pointHistoryByWeek", deployed, indexTimes0)


            // 1. create stos by addr2
            const user = addr1
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("8");

            let indexTimes1 = await deployed.lockIdNftTransferable.allIndexOfTimes();
            logPointWeeks("pointHistoryByWeek", deployed, indexTimes1)

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
            addr1Ids.push([lockId, lockIdPoints]);

            let balanceOfLock1 = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(amount)

            let block = await ethers.provider.getBlock('latest')
            console.log('block.timestamp', block.timestamp)

            console.log('lockIdInfos1', lockId, lockIdInfos1)

            logPoint("pointHistoryByLockId", await deployed.lockIdNftTransferable.pointHistoryOfId(lockId) )
            let indexTimes = await deployed.lockIdNftTransferable.allIndexOfTimes();
            logPointWeeks("pointHistoryByWeek", deployed, indexTimes)


            ethers.provider.send("evm_increaseTime", [60*60*24*1])
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

        it('createLock: create stos ', async () => {
            // 1. create stos by addr2
            const user = addr2
            let amount = ethers.utils.parseEther("50");
            let unlockWeeks = ethers.BigNumber.from("8");
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

            ethers.provider.send("evm_increaseTime", [60*60*24*7*8])
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

        it('transferFrom: transfer stos', async () => {
            // 2. addr2 transfer stos to addr1
            let lockId1 = addr2Ids[addr2Ids.length-1][0];
            console.log('lockId', lockId1)
            let owner1 = await deployed.lockIdNftTransferable.ownerOf(lockId1)
            expect(owner1).to.be.eq(addr2.address)

            await expect(
                 deployed.lockIdNftTransferable.connect(deployer).transferFrom(
                    addr2.address,
                    addr1.address,
                    lockId1
                    )).to.be.revertedWith("transfer caller is not owner nor approved")

            await (await deployed.lockIdNftTransferable.connect(addr2).approve(deployer.address, lockId1)).wait()

            expect(await deployed.lockIdNftTransferable.getApproved(lockId1)).to.be.eq(deployer.address)

            const interface1 = deployed.lockIdNftTransferable.interface ;
            const topic = interface1.getEventTopic('TransferLock');

            const receipt = await (await deployed.lockIdNftTransferable.connect(deployer).transferFrom(
                addr2.address,
                addr1.address,
                lockId1
                )).wait()

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.tokenId

            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNftTransferable.pointHistoryOfId(lockId)
            );
            addr1Ids.push([lockId, lockIdPoints]);

            let block = await ethers.provider.getBlock('latest')
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(addr1.address)

            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId1)
            expect(lockIdInfos1.withdrawalTime).to.be.not.eq(0)

            expect(await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId1)).
                to.be.eq(ethers.constants.Zero)
            expect(await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)).
                to.be.gt(ethers.constants.Zero)

            ethers.provider.send("evm_increaseTime", [60*60*1])
            ethers.provider.send("evm_mine");

            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
            await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))
            await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
            await checkSumOfLocks(deployed, ethers.constants.Zero)

            let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr2.address, block.timestamp)

            // 두번째 스냅샷
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

        it('createLock: create stos ', async () => {
            // 1. create stos by addr2
            const user = addr2
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("8");
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

            ethers.provider.send("evm_increaseTime", [60*60*24*7*3])
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

        it('depositFor: increase stos', async () => {
            // 3. addr1 increase stos
            const user = addr2
            let lockId =  addr2Ids[addr2Ids.length-1][0];
            console.log('lockId', lockId)

            let lockIdInfos0 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
            // console.log('lockIdInfos0', lockIdInfos0)

            let amount = ethers.utils.parseEther("100");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockIdNftTransferable.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockIdNftTransferable.address, amount);
            }

            const interface1 = deployed.lockIdNftTransferable.interface ;
            const topic = interface1.getEventTopic('LockDeposited');
            const receipt = await(await deployed.lockIdNftTransferable.connect(user).depositFor(
                user.address,
                lockId,
                amount
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId2 = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNftTransferable.pointHistoryOfId(lockId2)
            );
            expect(lockId2).to.be.eq(lockId)
            addr1Ids.push([lockId2, lockIdPoints]);
            // console.log('lockId2', lockId2)

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp ', block.timestamp)

            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId2)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId2)).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(lockIdInfos0.amount.add(amount))

            // console.log('lockIdInfos1', lockIdInfos1)
            // let allIndexOfTimeset = await deployed.lockIdNftTransferable.allIndexOfTimes()
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7*1])
            ethers.provider.send("evm_mine");

            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
            await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

            await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
            // await checkSumOfLocks(deployed, ethers.constants.Zero)

            // let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr1.address, block.timestamp)
            // let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr2.address, block.timestamp)

            // // 세번째 스냅샷
            // stosBalanceL1.push({
            //     timestamp: block.timestamp,
            //     balance: balanceAddr1
            // });

            // stosBalanceL2.push({
            //     timestamp: block.timestamp,
            //     balance: balanceAddr2
            // });

            // console.log('stosBalanceL1', stosBalanceL1)
            // console.log('stosBalanceL2', stosBalanceL2)

        });
        */
    });


});

