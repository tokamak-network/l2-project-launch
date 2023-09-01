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

async function checkSumOfLocks(deployed: LockIdFixture, timestamp: BigNumber){
    console.log('--------- checkSumOfLocks timestamp ', timestamp)
    let maxTokenId = await deployed.lockTOS.lockIdCounter()

    let i = 1;
    let sum = BigNumber.from("0");

    if (timestamp.gt(ethers.constants.Zero)) {
        for (i = 1; i <= maxTokenId; i++) {
            let balanceOfLockAt = await deployed.lockTOS["balanceOfLockAt(uint256,uint256)"](
                BigNumber.from(""+i), timestamp)
            console.log('balanceOfLockAt',i ,balanceOfLockAt)

            sum = sum.add(balanceOfLockAt);
        }
        console.log('sum', sum)

        let totalSupplyLocksAt = await deployed.lockTOS["totalSupplyAt(uint256)"](timestamp)
        console.log('totalSupplyLocksAt', totalSupplyLocksAt)

        // expect(totalSupplyLocksAt).to.be.eq(sum)
        expect(ethers.utils.formatUnits(totalSupplyLocksAt, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])

    } else {
        console.log('--- at current ----')

        for (i = 1; i <= maxTokenId; i++) {
            console.log('lockId', i)

            let balanceOfLock = await deployed.lockTOS["balanceOfLock(uint256)"](BigNumber.from(""+i))
            console.log('balanceOfLock',i ,balanceOfLock)
            sum = sum.add(balanceOfLock);
        }
        console.log('sum', sum)

        let totalSupplyLocks = await deployed.lockTOS["totalSupply()"]()
        console.log('totalSupplyLocks', totalSupplyLocks)

        expect(ethers.utils.formatUnits(totalSupplyLocks, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])
    }

}


async function checkDecreaseStosByPassTime(deployed: LockIdFixture, lockId: BigNumber,  timestamp: BigNumber){
    console.log('--------- checkDecreaseStosByPassTime ')

    if (lockId.eq(ethers.constants.Zero)){
        let balanceOfLockAt = await deployed.lockTOS["totalSupplyAt(uint256)"](
            timestamp)
        console.log('totalSupplyAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockTOS["totalSupply()"]()
        console.log('totalSupply', balanceOfLockAt)
        expect(balanceOfLockAt).to.be.gt(balanceOfLock)

    }  else {
        console.log('timestamp', timestamp)

        let balanceOfLockAt = await deployed.lockTOS["balanceOfLockAt(uint256,uint256)"](
            lockId, timestamp)
        console.log('balanceOfLockAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockTOS["balanceOfLock(uint256)"](
            lockId)
        console.log('balanceOfLock', balanceOfLock)
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
            let lockPeriods = [
                ethers.BigNumber.from("8"),
                ethers.BigNumber.from("24")
            ]

            for(let i =0; i< lockPeriods.length; i++ ){
                await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
                    lockPeriods[i]
                )).wait();
            }

        });

        it('createLock: create stos ', async () => {
            let maxTime = await deployed.lockTOS.maxTime();
            let epochUnit = await deployed.lockTOS.epochUnit();
            console.log('maxTime', maxTime)
            console.log('epochUnit', epochUnit)

            // 1. create stos by addr2
            const user = addr2
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("8");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockTOS.address, amount);
            }
            console.log('user', user.address)
            const interface1 = deployed.lockTOS.interface ;


            console.log('deployed.lockTOS', deployed.lockTOS.address)
            const topic = interface1.getEventTopic('LockCreated');
            const receipt = await(await deployed.lockTOS.connect(user).createLock(
                amount,
                unlockWeeks
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            console.log('lockId', lockId)

            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(lockId)
            );
            console.log('lockIdPoints', lockIdPoints)
            addr2Ids.push([lockId, lockIdPoints]);

            let balanceOfLock1 = await deployed.lockTOS["balanceOfLock(uint256)"](lockId)
            console.log('balanceOfLock1', balanceOfLock1)


            // let totalSupplyLocks1 = await deployed.lockTOS.totalSupplyLocks()
            // let lockIdInfos1 = await deployed.lockTOS.locksOf(lockId)
            // console.log('lockIdInfos1', lockIdInfos1)


            // console.log('balanceOfLock1', balanceOfLock1)
            // expect(await deployed.lockTOS.ownerOf(lockId)).to.be.eq(user.address)
            // expect(lockIdInfos1.amount).to.be.eq(amount)
            // expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)

            // let allIndexOfTimeset = await deployed.lockTOS.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockTOS.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7*1])
            ethers.provider.send("evm_mine");

            let balanceOfLockAt = await deployed.lockTOS["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            console.log('balanceOfLockAt', balanceOfLockAt)

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

            // expect(await deployed.lockTOS["balanceOfLock(uint256)"](lockId)).to.be.eq(
            //     ethers.constants.Zero
            // )
            let balanceAddr1 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr2.address, block.timestamp)

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

            // logPoint("pointHistoryByLockId", await deployed.lockTOS.pointHistoryOfId(lockId) )
            // let indexTimes = await deployed.lockTOS.allIndexOfTimes();
            // logPointWeeks("pointHistoryByWeek", deployed, indexTimes[0])

            // let lockIdInfos0 = await deployed.lockTOS.lockIdInfos(lockId)
            // expect(await deployed.lockTOS.ownerOf(lockId)).to.be.eq(user.address)
            // console.log('lockIdInfos0', lockIdInfos0)

            let amount = ethers.utils.parseEther("50");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockTOS.address, amount);
            }

            const interface1 = deployed.lockTOS.interface ;
            const topic = interface1.getEventTopic('LockDeposited');
            const receipt = await(await deployed.lockTOS.connect(user).depositFor(
                user.address,
                lockId,
                amount
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId2 = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(lockId2)
            );
            expect(lockId2).to.be.eq(lockId)
            addr1Ids.push([lockId2, lockIdPoints]);
            // console.log('lockId2', lockId2)

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp ', block.timestamp)

            // let lockIdInfos1 = await deployed.lockTOS.lockIdInfos(lockId2)
            // expect(await deployed.lockTOS.ownerOf(lockId2)).to.be.eq(user.address)
            // expect(lockIdInfos1.amount).to.be.eq(lockIdInfos0.amount.add(amount))

            // console.log('lockIdInfos1', lockIdInfos1)

            // console.log('block.timestamp', block.timestamp)

            // logPoint("pointHistoryByLockId", await deployed.lockTOS.pointHistoryOfId(lockId) )
            // indexTimes = await deployed.lockTOS.allIndexOfTimes();
            // logPointWeeks("pointHistoryByWeek", deployed, indexTimes)

            ethers.provider.send("evm_increaseTime", [60*60*1])
            ethers.provider.send("evm_mine");

            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
            await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

            await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
            await checkSumOfLocks(deployed, ethers.constants.Zero)

            let balanceAddr1 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr2.address, block.timestamp)

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

        it('createLock: create stos ', async () => {
            let maxTime = await deployed.lockTOS.maxTime();
            let epochUnit = await deployed.lockTOS.epochUnit();
            console.log('maxTime', maxTime)
            console.log('epochUnit', epochUnit)

            // 1. create stos by addr1
            const user = addr1
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("8");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockTOS.address, amount);
            }
            console.log('user', user.address)
            const interface1 = deployed.lockTOS.interface ;


            console.log('deployed.lockTOS', deployed.lockTOS.address)
            const topic = interface1.getEventTopic('LockCreated');
            const receipt = await(await deployed.lockTOS.connect(user).createLock(
                amount,
                unlockWeeks
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            console.log('lockId', lockId)

            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(lockId)
            );
            console.log('lockIdPoints', lockIdPoints)
            addr1Ids.push([lockId, lockIdPoints]);

            let balanceOfLock1 = await deployed.lockTOS["balanceOfLock(uint256)"](lockId)
            console.log('balanceOfLock1', balanceOfLock1)


            // let totalSupplyLocks1 = await deployed.lockTOS.totalSupplyLocks()
            // let lockIdInfos1 = await deployed.lockTOS.locksOf(lockId)
            // console.log('lockIdInfos1', lockIdInfos1)


            // console.log('balanceOfLock1', balanceOfLock1)
            // expect(await deployed.lockTOS.ownerOf(lockId)).to.be.eq(user.address)
            // expect(lockIdInfos1.amount).to.be.eq(amount)
            // expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)

            // let allIndexOfTimeset = await deployed.lockTOS.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockTOS.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7*1])
            ethers.provider.send("evm_mine");

            let balanceOfLockAt = await deployed.lockTOS["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            console.log('balanceOfLockAt', balanceOfLockAt)

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

            // expect(await deployed.lockTOS["balanceOfLock(uint256)"](lockId)).to.be.eq(
            //     ethers.constants.Zero
            // )
            let balanceAddr1 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr2.address, block.timestamp)

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

        it('increaseLock: increase stos', async () => {
            // 3. addr1 increase stos
            const user = addr1
            let lockId =  addr1Ids[addr1Ids.length-1][0];
            // console.log('lockId', lockId)

            // logPoint("pointHistoryByLockId", await deployed.lockTOS.pointHistoryOfId(lockId) )
            // let indexTimes = await deployed.lockTOS.allIndexOfTimes();
            // logPointWeeks("pointHistoryByWeek", deployed, indexTimes[0])

            // let lockIdInfos0 = await deployed.lockTOS.lockIdInfos(lockId)
            // expect(await deployed.lockTOS.ownerOf(lockId)).to.be.eq(user.address)
            // console.log('lockIdInfos0', lockIdInfos0)
            let unlockWeeks = ethers.BigNumber.from("24");
            let amount = ethers.utils.parseEther("50");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockTOS.address, amount);
            }

            const interface1 = deployed.lockTOS.interface ;
            const topic = interface1.getEventTopic('LockUnlockTimeIncreased');
            const receipt = await(await deployed.lockTOS.connect(user).increaseUnlockTime(
                lockId,
                unlockWeeks
            )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId2 = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(lockId2)
            );
            expect(lockId2).to.be.eq(lockId)
            addr1Ids.push([lockId2, lockIdPoints]);
            // console.log('lockId2', lockId2)

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp ', block.timestamp)

            // let lockIdInfos1 = await deployed.lockTOS.lockIdInfos(lockId2)
            // expect(await deployed.lockTOS.ownerOf(lockId2)).to.be.eq(user.address)
            // expect(lockIdInfos1.amount).to.be.eq(lockIdInfos0.amount.add(amount))

            // console.log('lockIdInfos1', lockIdInfos1)

            // console.log('block.timestamp', block.timestamp)

            // logPoint("pointHistoryByLockId", await deployed.lockTOS.pointHistoryOfId(lockId) )
            // indexTimes = await deployed.lockTOS.allIndexOfTimes();
            // logPointWeeks("pointHistoryByWeek", deployed, indexTimes)

            ethers.provider.send("evm_increaseTime", [60*60*24*7*2])
            ethers.provider.send("evm_mine");

            await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
            await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

            await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
            await checkSumOfLocks(deployed, ethers.constants.Zero)

            // let balanceAddr1 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr1.address, block.timestamp)
            // let balanceAddr2 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr2.address, block.timestamp)

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

        it('createLock: create stos ', async () => {
            let maxTime = await deployed.lockTOS.maxTime();
            let epochUnit = await deployed.lockTOS.epochUnit();
            console.log('maxTime', maxTime)
            console.log('epochUnit', epochUnit)

            // 1. create stos by addr2
            const user = addr1
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("24");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockTOS.address, amount);
            }
            console.log('user', user.address)
            const interface1 = deployed.lockTOS.interface ;


            console.log('deployed.lockTOS', deployed.lockTOS.address)
            const topic = interface1.getEventTopic('LockCreated');
            const receipt = await(await deployed.lockTOS.connect(user).createLock(
                amount,
                unlockWeeks
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            console.log('lockId', lockId)

            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(lockId)
            );
            console.log('lockIdPoints', lockIdPoints)
            addr2Ids.push([lockId, lockIdPoints]);

            let balanceOfLock1 = await deployed.lockTOS["balanceOfLock(uint256)"](lockId)
            console.log('balanceOfLock1', balanceOfLock1)


            // let totalSupplyLocks1 = await deployed.lockTOS.totalSupplyLocks()
            // let lockIdInfos1 = await deployed.lockTOS.locksOf(lockId)
            // console.log('lockIdInfos1', lockIdInfos1)


            // console.log('balanceOfLock1', balanceOfLock1)
            // expect(await deployed.lockTOS.ownerOf(lockId)).to.be.eq(user.address)
            // expect(lockIdInfos1.amount).to.be.eq(amount)
            // expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)

            // let allIndexOfTimeset = await deployed.lockTOS.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockTOS.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7*1])
            ethers.provider.send("evm_mine");

            let balanceOfLockAt = await deployed.lockTOS["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            console.log('balanceOfLockAt', balanceOfLockAt)

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

            // expect(await deployed.lockTOS["balanceOfLock(uint256)"](lockId)).to.be.eq(
            //     ethers.constants.Zero
            // )
            let balanceAddr1 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockTOS["balanceOfAt(address,uint256)"](addr2.address, block.timestamp)

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

