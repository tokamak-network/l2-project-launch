import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber } from 'ethers'
import { lockIdFixture } from './shared/fixtures'
import { LockIdFixture, NftTokenInfo, Point, SnapshotBalance } from './shared/fixtureInterfaces'


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
    // console.log('--------- checkSumOfLocks timestamp ', timestamp)
    let maxTokenId = await deployed.lockTOSv2.lockIdCounter()

    let i = 1;
    let sum = BigNumber.from("0");

    if (timestamp.gt(ethers.constants.Zero)) {
        for (i = 1; i <= maxTokenId; i++) {
            let balanceOfLockAt = await deployed.lockTOSv2["balanceOfLockAt(uint256,uint256)"](
                BigNumber.from(""+i), timestamp)
            // console.log('balanceOfLockAt',i ,balanceOfLockAt)

            sum = sum.add(balanceOfLockAt);
        }
        // console.log('sum', sum)

        let totalSupplyLocksAt = await deployed.lockTOSv2["totalSupplyBalanceAt(uint256)"](timestamp)
        // console.log('totalSupplyLocksAt', totalSupplyLocksAt)

        // expect(totalSupplyLocksAt).to.be.eq(sum)
        expect(ethers.utils.formatUnits(totalSupplyLocksAt, 10).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 10).split(".")[0])

    } else {
        // console.log('--- at current ----')

        for (i = 1; i <= maxTokenId; i++) {
            // console.log('lockId', i)

            let balanceOfLock = await deployed.lockTOSv2["balanceOfLock(uint256)"](BigNumber.from(""+i))
            // console.log('balanceOfLock',i ,balanceOfLock)
            sum = sum.add(balanceOfLock);
        }
        // console.log('sum', sum)

        let totalSupplyLocks = await deployed.lockTOSv2["totalSupplyBalance()"]()
        // console.log('totalSupplyLocks', totalSupplyLocks)

        expect(ethers.utils.formatUnits(totalSupplyLocks, 10).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 10).split(".")[0])
    }

}

async function checkSumOfUnlimited(deployed: LockIdFixture, addrList: Array<Signer>, timestamp: BigNumber){

    let sum = BigNumber.from("0");

    let i = 0;
    if (timestamp.gt(ethers.constants.Zero)){
        for (i = 0; i < addrList.length; i++) {
            let balanceOfUnlimitedAt = await deployed.lockTOSv2["balanceOfUnlimitedAt(address,uint256)"](
                addrList[i].address, timestamp);
            sum = sum.add(balanceOfUnlimitedAt);
        }
        // console.log('sum', sum)
        let totalSupplyUnlimitedAt = await deployed.lockTOSv2["totalSupplyUnlimitedAt(uint256)"](timestamp)

        // console.log('totalSupplyUnlimitedAt', totalSupplyUnlimitedAt)

        expect(ethers.utils.formatUnits(totalSupplyUnlimitedAt, 3).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 3).split(".")[0])

    } else {
        for (i = 0; i < addrList.length; i++) {
            let balanceOfUnlimited = await deployed.lockTOSv2["balanceOfUnlimited(address)"](
                addrList[i].address);
            sum = sum.add(balanceOfUnlimited);
        }
        // console.log('sum', sum)
        let totalSupplyUnlimited = await deployed.lockTOSv2["totalSupplyUnlimited()"]()

        // console.log('totalSupplyUnlimited', totalSupplyUnlimited)

        expect(ethers.utils.formatUnits(totalSupplyUnlimited, 3).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 3).split(".")[0])
    }

}

async function checkDecreaseStosByPassTime(deployed: LockIdFixture, lockId: BigNumber,  timestamp: BigNumber){
    // console.log('--------- checkDecreaseStosByPassTime ')

    if (lockId.eq(ethers.constants.Zero)){
        let balanceOfLockAt = await deployed.lockTOSv2["totalSupplyBalanceAt(uint256)"](
            timestamp)
        // console.log('totalSupplyAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockTOSv2["totalSupplyBalance()"]()
        // console.log('totalSupply', balanceOfLockAt)
        expect(balanceOfLockAt).to.be.gt(balanceOfLock)

    }  else {
        // console.log('timestamp', timestamp)

        let balanceOfLockAt = await deployed.lockTOSv2["balanceOfLockAt(uint256,uint256)"](
            lockId, timestamp)
        // console.log('balanceOfLockAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockTOSv2["balanceOfLock(uint256)"](
            lockId)
        // console.log('balanceOfLock', balanceOfLock)
        expect(balanceOfLockAt).to.be.gt(balanceOfLock)
    }
}

async function checkUnlimitedByPassTime(deployed: LockIdFixture, account: Signer,  timestamp: BigNumber){

    let balanceOfLockAt = await deployed.lockTOSv2["balanceOfUnlimitedAt(address,uint256)"](
        account.address, timestamp)
    // console.log('balanceOfLockAt', balanceOfLockAt)
    let balanceOfLock = await deployed.lockTOSv2["balanceOfUnlimited(address)"](
        account.address)
    // console.log('balanceOfLock', balanceOfLock)
    expect(balanceOfLockAt).to.be.eq(balanceOfLock)

}


async function createLock(
    deployed: LockIdFixture,
    user: Signer,
    addrIds:Array<[BigNumber, Array<Point>]>,
    amount: BigNumber,
    unlockWeeks: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{
    let allowance = await deployed.tos.allowance(user.address, deployed.lockTOSv2.address);
    if (allowance.lt(amount)) {
        await deployed.tos.connect(user).approve(deployed.lockTOSv2.address, amount);
    }
    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('LockCreated');
    const receipt = await(await deployed.lockTOSv2.connect(user).createLock(
        amount,
        unlockWeeks
    )).wait();
    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    let lockId = deployedEvent.args.lockId

    let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
        await deployed.lockTOSv2.pointHistoryOf(lockId)
    );
    addrIds.push([lockId, lockIdPoints]);

    let balanceOfLock1 = await deployed.lockTOSv2["balanceOfLock(uint256)"](lockId)
    let block = await ethers.provider.getBlock('latest')

    if(passTimeForVerify > 0){
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        let balanceOfLockAt = await deployed.lockTOSv2["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
        expect(balanceOfLock1).to.be.eq(balanceOfLockAt)

        await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
        let ttt = block.timestamp + 60;
        await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+ttt))
        await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))
        await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
        await checkSumOfLocks(deployed, BigNumber.from(""+ttt))
    }

    await checkSumOfLocks(deployed, ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr2.address, block.timestamp)

    // 첫번째 스냅샷
    stosBalanceL1.push({
        timestamp: block.timestamp,
        balance: balanceAddr1
    });

    stosBalanceL2.push({
        timestamp: block.timestamp,
        balance: balanceAddr2
    });
}

async function deposit(
    deployed: LockIdFixture,
    user: Signer,
    addrIds:Array<[BigNumber, Array<Point>]>,
    lockId: BigNumber,
    amount: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{
    let allowance = await deployed.tos.allowance(user.address, deployed.lockTOSv2.address);
    if (allowance.lt(amount)) {
        await deployed.tos.connect(user).approve(deployed.lockTOSv2.address, amount);
    }

    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('LockDeposited');
    const receipt = await(await deployed.lockTOSv2.connect(user).depositFor(
        user.address,
        lockId,
        amount
    )).wait();
    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    let lockId2 = deployedEvent.args.lockId
    let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
        await deployed.lockTOSv2.pointHistoryOf(lockId2)
    );
    expect(lockId2).to.be.eq(lockId)
    addrIds.push([lockId2, lockIdPoints]);
    // console.log('lockId2', lockId2)

    let block = await ethers.provider.getBlock('latest')
    if(passTimeForVerify > 0){
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
        await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

        await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
    }
    await checkSumOfLocks(deployed, ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr2.address, block.timestamp)

    // 세번째 스냅샷
    stosBalanceL1.push({
        timestamp: block.timestamp,
        balance: balanceAddr1
    });

    stosBalanceL2.push({
        timestamp: block.timestamp,
        balance: balanceAddr2
    });
}

async function increaseUnlockTime(
    deployed: LockIdFixture,
    user: Signer,
    addrIds:Array<[BigNumber, Array<Point>]>,
    lockId: BigNumber,
    unlockWeeks: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{

    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('LockUnlockTimeIncreased');
    const receipt = await(await deployed.lockTOSv2.connect(user).increaseUnlockTime(
        lockId,
        unlockWeeks
    )).wait();

    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    let lockId2 = deployedEvent.args.lockId
    let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
        await deployed.lockTOSv2.pointHistoryOf(lockId2)
    );
    expect(lockId2).to.be.eq(lockId)
    addrIds.push([lockId2, lockIdPoints]);
    // console.log('lockId2', lockId2)

    let block = await ethers.provider.getBlock('latest')

    if(passTimeForVerify > 0){
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
        await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

        await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
    }
    await checkSumOfLocks(deployed, ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr2.address, block.timestamp)

    // 세번째 스냅샷
    stosBalanceL1.push({
        timestamp: block.timestamp,
        balance: balanceAddr1
    });

    stosBalanceL2.push({
        timestamp: block.timestamp,
        balance: balanceAddr2
    });
}

async function increaseLock(
    deployed: LockIdFixture,
    user: Signer,
    addrIds:Array<[BigNumber, Array<Point>]>,
    lockId: BigNumber,
    amount: BigNumber,
    unlockWeeks: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{
    // 3. addr1 increase stos
    let allowance = await deployed.tos.allowance(user.address, deployed.lockTOSv2.address);
    if (allowance.lt(amount)) {
        await deployed.tos.connect(user).approve(deployed.lockTOSv2.address, amount);
    }

    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('LockIncreased');
    const receipt = await(await deployed.lockTOSv2.connect(user)["increaseLock(address,uint256,uint256,uint256)"](
        user.address,
        lockId,
        amount,
        unlockWeeks
    )).wait();

    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    let lockId2 = deployedEvent.args.lockId
    let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
        await deployed.lockTOSv2.pointHistoryOf(lockId2)
    );
    expect(lockId2).to.be.eq(lockId)
    addrIds.push([lockId2, lockIdPoints]);
    // console.log('lockId2', lockId2)

    let block = await ethers.provider.getBlock('latest')
    // console.log('block.timestamp ', block.timestamp)
    if(passTimeForVerify > 0){
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        await checkDecreaseStosByPassTime(deployed, lockId, BigNumber.from(""+block.timestamp))
        await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))

        await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
    }
    await checkSumOfLocks(deployed, ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr2.address, block.timestamp)

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
}

async function transferFrom(
    deployed: LockIdFixture,
    from: Signer,
    to: Signer,
    fromIds:Array<[BigNumber, Array<Point>]>,
    toIds:Array<[BigNumber, Array<Point>]>,
    lockId: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{

    let owner = await deployed.lockTOSv2.ownerOf(lockId)
    expect(owner).to.be.eq(from.address)

    let lockIdBefore =  await deployed.lockTOSv2.allLocks(lockId)
    // console.log('lockIdBefore', lockId, lockIdBefore)

    await expect(
            deployed.lockTOSv2.connect(deployed.deployer).transferFrom(
            from.address,
            to.address,
            lockId
            )).to.be.revertedWith("transfer caller is not owner nor approved")

    await (await deployed.lockTOSv2.connect(from).approve(deployed.deployer.address, lockId)).wait()

    expect(await deployed.lockTOSv2.getApproved(lockId)).to.be.eq(deployed.deployer.address)

    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('Transfer');
    const receipt = await (await deployed.lockTOSv2.connect(deployed.deployer).transferFrom(
        from.address,
        to.address,
        lockId
        )).wait()

    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    let tokenId = deployedEvent.args.tokenId

    let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
        await deployed.lockTOSv2.pointHistoryOf(tokenId)
    );
    fromIds.push([tokenId, lockIdPoints]);
    toIds.push([tokenId, lockIdPoints]);

    let block = await ethers.provider.getBlock('latest')

    expect(await deployed.lockTOSv2.ownerOf(lockId)).to.be.eq(ethers.constants.AddressZero)
    expect(await deployed.lockTOSv2.ownerOf(tokenId)).to.be.eq(to.address)

    let lockIdInfos1 = await deployed.lockTOSv2.allLocks(lockId)
    // console.log('lockIdInfos1', lockId, lockIdInfos1)
    expect(lockIdInfos1.withdrawalTime).to.be.gt(ethers.constants.Zero)
    expect(lockIdInfos1.start).to.be.eq(ethers.constants.Zero)
    expect(lockIdInfos1.end).to.be.eq(ethers.constants.Zero)
    expect(lockIdInfos1.amount).to.be.eq(ethers.constants.Zero)

    let tokenIdInfos = await deployed.lockTOSv2.allLocks(tokenId)
    // console.log('tokenIdInfos', tokenId, tokenIdInfos)
    expect(tokenIdInfos.owner).to.be.eq(to.address)
    expect(tokenIdInfos.start).to.be.eq(block.timestamp)
    expect(tokenIdInfos.end).to.be.eq(lockIdBefore.end)
    expect(tokenIdInfos.amount).to.be.eq(lockIdBefore.amount)
    expect(tokenIdInfos.withdrawalTime).to.be.eq(ethers.constants.Zero)


    expect(await deployed.lockTOSv2["balanceOfLock(uint256)"](lockId)).
        to.be.eq(ethers.constants.Zero)
    expect(await deployed.lockTOSv2["balanceOfLock(uint256)"](tokenId)).
        to.be.gt(ethers.constants.Zero)


    if (passTimeForVerify > 0) {
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        await checkDecreaseStosByPassTime(deployed, tokenId, BigNumber.from(""+block.timestamp))
        await checkDecreaseStosByPassTime(deployed, ethers.constants.Zero, BigNumber.from(""+block.timestamp))
        await checkSumOfLocks(deployed, BigNumber.from(""+block.timestamp))
    }

    await checkSumOfLocks(deployed, ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](deployed.addr2.address, block.timestamp)

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

}

async function increaseUnlimitedLock(
    deployed: LockIdFixture,
    user: Signer,
    amount: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{
    let allowance = await deployed.tos.allowance(user.address, deployed.lockTOSv2.address);
    if (allowance.lt(amount)) {
        await deployed.tos.connect(user).approve(deployed.lockTOSv2.address, amount);
    }
    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('IncreasedUnlimitedLock');
    const receipt = await(await deployed.lockTOSv2.connect(user).increaseUnlimitedLock(
        user.address,
        amount
    )).wait();
    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    expect(deployedEvent.args.account).to.be.eq(user.address)
    expect(deployedEvent.args.amount).to.be.eq(amount)


    let balanceOfLock1 = await deployed.lockTOSv2["balanceOfUnlimited(address)"](user.address)
    let block = await ethers.provider.getBlock('latest')

    if(passTimeForVerify > 0){
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        let balanceOfLockAt = await deployed.lockTOSv2["balanceOfUnlimitedAt(address,uint256)"](user.address,  block.timestamp)
        expect(balanceOfLock1).to.be.eq(balanceOfLockAt)

        await checkUnlimitedByPassTime(deployed, user, BigNumber.from(""+block.timestamp))

        let ttt = block.timestamp + 60;
        await checkUnlimitedByPassTime(deployed, user, BigNumber.from(""+ttt))
        await checkUnlimitedByPassTime(deployed, user, BigNumber.from(""+block.timestamp))
        await checkSumOfUnlimited(deployed, [deployed.addr1, deployed.addr2], BigNumber.from(""+block.timestamp))
    }

    await checkSumOfUnlimited(deployed, [deployed.addr1, deployed.addr2], ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr2.address, block.timestamp)

    // 첫번째 스냅샷
    stosBalanceL1.push({
        timestamp: block.timestamp,
        balance: balanceAddr1
    });

    stosBalanceL2.push({
        timestamp: block.timestamp,
        balance: balanceAddr2
    });
}

async function decreaseUnlimitedLock(
    deployed: LockIdFixture,
    user: Signer,
    amount: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{
    const beforeUnlimitedAmount = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](user.address)
    const balanceOfUnlimited = await deployed.lockTOSv2["balanceOfUnlimited(address)"](user.address)
    const beforeTotalLockedAmountOf = await deployed.lockTOSv2["totalLockedAmountOfLock(address)"](user.address)
    const beforeTotalSupplyUnlimited = await deployed.lockTOSv2["totalSupplyUnlimited()"]()
    const beforeTotalSupplyBalance = await deployed.lockTOSv2["totalSupplyBalance()"]()

    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('DecreasedUnlimitedLock');
    const receipt = await(await deployed.lockTOSv2.connect(user).decreaseUnlimitedLock(
        user.address,
        amount
    )).wait();
    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    expect(deployedEvent.args.account).to.be.eq(user.address)
    expect(deployedEvent.args.amount).to.be.eq(amount)

    let beforeUnlimitedAmount1 = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](user.address)
    let balanceOfUnlimited1 = await deployed.lockTOSv2["balanceOfUnlimited(address)"](user.address)
    let beforeTotalLockedAmountOf1 = await deployed.lockTOSv2["totalLockedAmountOfLock(address)"](user.address)

    let beforeTotalSupplyUnlimited1 = await deployed.lockTOSv2["totalSupplyUnlimited()"]()
    let beforeTotalSupplyBalance1 = await deployed.lockTOSv2["totalSupplyBalance()"]()
    expect(beforeUnlimitedAmount1).to.be.eq(beforeUnlimitedAmount.sub(amount))
    expect(balanceOfUnlimited1).to.be.eq(balanceOfUnlimited.sub(amount))
    expect(beforeTotalLockedAmountOf1).to.be.eq(beforeTotalLockedAmountOf.add(amount))
    expect(beforeTotalSupplyUnlimited1).to.be.lt(beforeTotalSupplyUnlimited)
    expect(beforeTotalSupplyBalance1).to.be.gt(beforeTotalSupplyBalance)

    let block = await ethers.provider.getBlock('latest')

    if(passTimeForVerify > 0){
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        let beforeUnlimitedAmount2 = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](user.address)
        let beforeTotalLockedAmountOf2 = await deployed.lockTOSv2["totalLockedAmountOfLock(address)"](user.address)
        let beforeTotalSupplyUnlimited2 = await deployed.lockTOSv2["totalSupplyUnlimitedAt(uint256)"](block.timestamp)
        let beforeTotalSupplyBalance2 = await deployed.lockTOSv2["totalSupplyBalanceAt(uint256)"](block.timestamp)
        let beforeTotalSupplyBalance21 = await deployed.lockTOSv2["totalSupplyBalance()"]()

        expect(beforeUnlimitedAmount2).to.be.eq(beforeUnlimitedAmount1)
        expect(beforeTotalLockedAmountOf2).to.be.eq(beforeTotalLockedAmountOf1)
        expect(beforeTotalSupplyUnlimited2).to.be.eq(beforeTotalSupplyUnlimited1)
        expect(beforeTotalSupplyBalance2).to.be.eq(beforeTotalSupplyBalance1)
        expect(beforeTotalSupplyBalance21).to.be.lt(beforeTotalSupplyBalance1)

        await checkUnlimitedByPassTime(deployed, user, BigNumber.from(""+block.timestamp))
        let ttt = block.timestamp + 60;
        await checkUnlimitedByPassTime(deployed, user, BigNumber.from(""+ttt))
        await checkSumOfUnlimited(deployed, [deployed.addr1, deployed.addr2], BigNumber.from(""+block.timestamp))
    }

    await checkSumOfUnlimited(deployed, [deployed.addr1, deployed.addr2], ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr2.address, block.timestamp)

    // 첫번째 스냅샷
    stosBalanceL1.push({
        timestamp: block.timestamp,
        balance: balanceAddr1
    });

    stosBalanceL2.push({
        timestamp: block.timestamp,
        balance: balanceAddr2
    });
}

async function transferFromUnlimited(
    deployed: LockIdFixture,
    from: Signer,
    to: Signer,
    amount: BigNumber,
    passTimeForVerify: number,
    stosBalanceL1:Array<SnapshotBalance>,
    stosBalanceL2:Array<SnapshotBalance> )
{
    // 사전에 있던 unlimited amount
    // 사전에 있던 non-unlimited stos

    const beforeUnlimitedAmountFrom = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](from.address)
    const balanceOfUnlimitedFrom = await deployed.lockTOSv2["balanceOfUnlimited(address)"](from.address)
    const beforeUnlimitedAmountTo = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](to.address)
    const balanceOfUnlimitedTo = await deployed.lockTOSv2["balanceOfUnlimited(address)"](to.address)

    const beforeTotalSupplyUnlimited = await deployed.lockTOSv2["totalSupplyUnlimited()"]()
    const beforeTotalSupplyBalance = await deployed.lockTOSv2["totalSupplyBalance()"]()

    const interface1 = deployed.lockTOSv2.interface ;
    const topic = interface1.getEventTopic('TransferUnlimitedLock');
    const receipt = await(await deployed.lockTOSv2.connect(from).transferFromUnlimited(
        from.address,
        to.address,
        amount
    )).wait();
    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
    const deployedEvent = interface1.parseLog(log);
    expect(deployedEvent.args.from).to.be.eq(from.address)
    expect(deployedEvent.args.to).to.be.eq(to.address)
    expect(deployedEvent.args.amount).to.be.eq(amount)

    let beforeUnlimitedAmount1From = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](from.address)
    let balanceOfUnlimited1From = await deployed.lockTOSv2["balanceOfUnlimited(address)"](from.address)

    let beforeUnlimitedAmount1To = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](to.address)
    let balanceOfUnlimited1To = await deployed.lockTOSv2["balanceOfUnlimited(address)"](to.address)

    let beforeTotalSupplyUnlimited1 = await deployed.lockTOSv2["totalSupplyUnlimited()"]()
    // let beforeTotalSupplyBalance1 = await deployed.lockTOSv2["totalSupplyBalance()"]()

    expect(beforeUnlimitedAmount1From).to.be.eq(beforeUnlimitedAmountFrom.sub(amount))
    expect(balanceOfUnlimited1From).to.be.lt(balanceOfUnlimitedFrom)
    expect(beforeUnlimitedAmount1To).to.be.eq(beforeUnlimitedAmountTo.add(amount))
    expect(balanceOfUnlimited1To).to.be.gt(balanceOfUnlimitedTo)

    // expect(beforeTotalLockedAmountOf1).to.be.eq(beforeTotalLockedAmountOf.add(amount))
    expect(beforeTotalSupplyUnlimited1).to.be.eq(beforeTotalSupplyUnlimited)
    // expect(beforeTotalSupplyBalance1).to.be.gt(beforeTotalSupplyBalance)

    let block = await ethers.provider.getBlock('latest')

    if(passTimeForVerify > 0){
        ethers.provider.send("evm_increaseTime", [passTimeForVerify])
        ethers.provider.send("evm_mine");

        let beforeUnlimitedAmount2 = await deployed.lockTOSv2["balanceOfUnlimitedAmount(address)"](to.address)
        let beforeTotalSupplyUnlimited2 = await deployed.lockTOSv2["totalSupplyUnlimitedAt(uint256)"](block.timestamp)
        // let beforeTotalSupplyBalance2 = await deployed.lockTOSv2["totalSupplyBalanceAt(uint256)"](block.timestamp)
        // let beforeTotalSupplyBalance21 = await deployed.lockTOSv2["totalSupplyBalance()"]()

        expect(beforeUnlimitedAmount2).to.be.eq(beforeUnlimitedAmount1To)
        expect(beforeTotalSupplyUnlimited2).to.be.eq(beforeTotalSupplyUnlimited1)
        // expect(beforeTotalSupplyBalance2).to.be.eq(beforeTotalSupplyBalance1)
        // expect(beforeTotalSupplyBalance21).to.be.lt(beforeTotalSupplyBalance1)

        await checkUnlimitedByPassTime(deployed, from, BigNumber.from(""+block.timestamp))
        await checkUnlimitedByPassTime(deployed, to, BigNumber.from(""+block.timestamp))
        let ttt = block.timestamp + 60;
        await checkUnlimitedByPassTime(deployed, from, BigNumber.from(""+ttt))
        await checkUnlimitedByPassTime(deployed, to, BigNumber.from(""+ttt))
        await checkSumOfUnlimited(deployed, [deployed.addr1, deployed.addr2], BigNumber.from(""+block.timestamp))
    }

    await checkSumOfUnlimited(deployed, [deployed.addr1, deployed.addr2], ethers.constants.Zero)

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfStosAt(address,uint256)"](deployed.addr2.address, block.timestamp)

    // 첫번째 스냅샷
    stosBalanceL1.push({
        timestamp: block.timestamp,
        balance: balanceAddr1
    });

    stosBalanceL2.push({
        timestamp: block.timestamp,
        balance: balanceAddr2
    });
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

    describe('# LockTOSv2 ', () => {

        it('createLock: create stos ', async () => {

            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("8");
            let passTimeForVerify = 60*60*24*7*1;

            await createLock(
                deployed ,
                addr2,
                addr2Ids ,
                amount,
                unlockWeeks,
                passTimeForVerify,
                stosBalanceL1 ,
                stosBalanceL2 );
        });

        it('depositFor: increase stos', async () => {
            const user = addr2
            let lockId =  addr2Ids[addr2Ids.length-1][0];
            let amount = ethers.utils.parseEther("50");
            let unlockWeeks = ethers.BigNumber.from("8");
            let passTimeForVerify = 60*60*24*7*1;

            await deposit(
                deployed ,
                addr2,
                addr2Ids ,
                lockId,
                amount,
                passTimeForVerify,
                stosBalanceL1 ,
                stosBalanceL2)

        });

        it('createLock: create stos ', async () => {

            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("24");
            let passTimeForVerify = 60*60*24*7*3;

            await createLock(
                deployed ,
                addr1,
                addr1Ids ,
                amount,
                unlockWeeks,
                passTimeForVerify,
                stosBalanceL1 ,
                stosBalanceL2 );
        });

        it('increaseUnlockTime: increase stos', async () => {

            let unlockWeeks = ethers.BigNumber.from("7");
            let passTimeForVerify = 60*60*24*7*20;
            let lockId =  addr1Ids[addr1Ids.length-1][0];

            await increaseUnlockTime(
                deployed ,
                addr1,
                addr1Ids,
                lockId,
                unlockWeeks,
                passTimeForVerify,
                stosBalanceL1 ,
                stosBalanceL2 );

        });

        it('createLock: create stos ', async () => {

            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("24");
            let passTimeForVerify = 60*60*24*7*1;

            await createLock(
                deployed ,
                addr1,
                addr1Ids ,
                amount,
                unlockWeeks,
                passTimeForVerify,
                stosBalanceL1 ,
                stosBalanceL2 );

        });

        it('increaseLock: increase stos', async () => {

            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("24");
            let passTimeForVerify = 60*60*24*7*1;
            let lockId =  addr1Ids[addr1Ids.length-1][0];

            await increaseLock(
                deployed ,
                addr1,
                addr1Ids ,
                lockId,
                amount,
                unlockWeeks,
                passTimeForVerify,
                stosBalanceL1 ,
                stosBalanceL2 );

        });

        it('multi createLock:  ', async () => {

            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("24");
            let passTimeForVerify = 0;
            let i = 0;
            for(i = 0; i < 3; i++){
                if (i%2 == 0)
                    await createLock(
                        deployed ,
                        addr1,
                        addr1Ids ,
                        amount,
                        unlockWeeks,
                        passTimeForVerify,
                        stosBalanceL1 ,
                        stosBalanceL2 );
                else
                    await createLock(
                        deployed ,
                        addr2,
                        addr2Ids ,
                        amount,
                        unlockWeeks,
                        passTimeForVerify,
                        stosBalanceL1 ,
                        stosBalanceL2 );

                unlockWeeks = ethers.BigNumber.from("4");
                passTimeForVerify = 60*60*1;
                let lockId =  addr1Ids[addr1Ids.length-1][0];
                await increaseUnlockTime(
                    deployed ,
                    addr1,
                    addr1Ids,
                    lockId,
                    unlockWeeks,
                    passTimeForVerify,
                    stosBalanceL1 ,
                    stosBalanceL2 );
            }

        });

        it('transferFrom', async () => {
            let passTimeForVerify = 60*60*24*1;
            let lockId =  addr1Ids[addr1Ids.length-1][0];

            await transferFrom(
                deployed,
                addr1,
                addr2,
                addr1Ids ,
                addr2Ids ,
                lockId ,
                passTimeForVerify,
                stosBalanceL1,
                stosBalanceL2)
        });


        it('increaseUnlimitedLock', async () => {
            let passTimeForVerify = 60*60*24*7;
            let amount = ethers.utils.parseEther("100");
            await increaseUnlimitedLock(
                deployed,
                addr1,
                amount ,
                passTimeForVerify,
                stosBalanceL1,
                stosBalanceL2)
        });

        it('decreaseUnlimitedLock', async () => {
            let passTimeForVerify = 60*60*24*7;
            let amount = ethers.utils.parseEther("50");
            await decreaseUnlimitedLock(
                deployed,
                addr1,
                amount ,
                passTimeForVerify,
                stosBalanceL1,
                stosBalanceL2)
        });


        it('transferFromUnlimited', async () => {
            let passTimeForVerify = 60*60*24*7;
            let amount = ethers.utils.parseEther("50");
            await transferFromUnlimited(
                deployed,
                addr1,
                addr2,
                amount ,
                passTimeForVerify,
                stosBalanceL1,
                stosBalanceL2)
        });

        // for(let i=0; i< 40; i++){
        //     it('createLock: create stos ' + i, async () => {

        //         let amount = ethers.utils.parseEther("100");
        //         let unlockWeeks = ethers.BigNumber.from("54");
        //         let passTimeForVerify = 60*60*24*7*4;
        //         await createLock(
        //             deployed ,
        //             addr1,
        //             addr1Ids ,
        //             amount,
        //             unlockWeeks,
        //             passTimeForVerify,
        //             stosBalanceL1 ,
        //             stosBalanceL2 );

        //     });
        // }

    });


});

