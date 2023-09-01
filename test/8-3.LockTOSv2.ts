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

        let totalSupplyLocksAt = await deployed.lockTOSv2["totalSupplyAt(uint256)"](timestamp)
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

        let totalSupplyLocks = await deployed.lockTOSv2["totalSupply()"]()
        // console.log('totalSupplyLocks', totalSupplyLocks)

        expect(ethers.utils.formatUnits(totalSupplyLocks, 10).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 10).split(".")[0])
    }

}


async function checkDecreaseStosByPassTime(deployed: LockIdFixture, lockId: BigNumber,  timestamp: BigNumber){
    // console.log('--------- checkDecreaseStosByPassTime ')

    if (lockId.eq(ethers.constants.Zero)){
        let balanceOfLockAt = await deployed.lockTOSv2["totalSupplyAt(uint256)"](
            timestamp)
        // console.log('totalSupplyAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockTOSv2["totalSupply()"]()
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

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr2.address, block.timestamp)

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

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr2.address, block.timestamp)

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

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr2.address, block.timestamp)

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

    let balanceAddr1 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr1.address, block.timestamp)
    let balanceAddr2 = await deployed.lockTOSv2["balanceOfAt(address,uint256)"](deployed.addr2.address, block.timestamp)

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

        // it('multi createLock:  ', async () => {

        //     let amount = ethers.utils.parseEther("100");
        //     let unlockWeeks = ethers.BigNumber.from("24");
        //     let passTimeForVerify = 0;
        //     let i = 0;
        //     for(i = 0; i < 3; i++){
        //         if (i%2 == 0)
        //             await createLock(
        //                 deployed ,
        //                 addr1,
        //                 addr1Ids ,
        //                 amount,
        //                 unlockWeeks,
        //                 passTimeForVerify,
        //                 stosBalanceL1 ,
        //                 stosBalanceL2 );
        //         else
        //             await createLock(
        //                 deployed ,
        //                 addr1,
        //                 addr1Ids ,
        //                 amount,
        //                 unlockWeeks,
        //                 passTimeForVerify,
        //                 stosBalanceL1 ,
        //                 stosBalanceL2 );

        //         unlockWeeks = ethers.BigNumber.from("4");
        //         passTimeForVerify = 60*60*1;
        //         let lockId =  addr1Ids[addr1Ids.length-1][0];
        //         await increaseUnlockTime(
        //             deployed ,
        //             addr1,
        //             addr1Ids,
        //             lockId,
        //             unlockWeeks,
        //             passTimeForVerify,
        //             stosBalanceL1 ,
        //             stosBalanceL2 );
        //     }


        // });

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

    });


});

