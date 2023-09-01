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

    if (timestamp.gt(ethers.constants.Zero)) {
        for (i = 1; i <= maxTokenId; i++) {
            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](
                BigNumber.from(""+i), timestamp)
            console.log('balanceOfLockAt',i ,balanceOfLockAt)

            sum = sum.add(balanceOfLockAt);
        }
        console.log('sum', sum)

        let totalSupplyLocksAt = await deployed.lockIdNftTransferable["totalSupplyLocksAt(uint256)"](timestamp)
        // console.log('totalSupplyLocksAt', totalSupplyLocksAt)

        // expect(totalSupplyLocksAt).to.be.eq(sum)
        expect(ethers.utils.formatUnits(totalSupplyLocksAt, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])

    } else {
        console.log('--- at current ----')

        for (i = 1; i <= maxTokenId; i++) {
            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](
                BigNumber.from(""+i))
            // console.log('balanceOfLock',i ,balanceOfLockAt)
            sum = sum.add(balanceOfLockAt);
        }
        console.log('sum', sum)

        let totalSupplyLocksAt = await deployed.lockIdNftTransferable["totalSupplyLocks()"]()
        // console.log('totalSupplyLocks', totalSupplyLocksAt)

        // expect(totalSupplyLocksAt).to.be.eq(sum)
        expect(ethers.utils.formatUnits(totalSupplyLocksAt, 2).split(".")[0]).to.be.eq(
            ethers.utils.formatUnits(sum, 2).split(".")[0])
    }

}


async function checkDecreaseStosByPassTime(deployed: LockIdFixture, lockId: BigNumber,  timestamp: BigNumber){
    console.log('--------- checkDecreaseStosByPassTime ')

    if (lockId.eq(ethers.constants.Zero)){
        let balanceOfLockAt = await deployed.lockIdNftTransferable["totalSupplyLocksAt(uint256)"](
            timestamp)
        // console.log('totalSupplyLocksAt', balanceOfLockAt)
        let balanceOfLock = await deployed.lockIdNftTransferable["totalSupplyLocks()"]()
        // console.log('totalSupplyLocks', balanceOfLockAt)
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
            // const receipt = await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
            //     ethers.BigNumber.from("1")
            // )).wait();

            // await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
            //     ethers.BigNumber.from("4")
            // )).wait();

            await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
                ethers.BigNumber.from("8")
            )).wait();


            // await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
            //     ethers.BigNumber.from("12")
            // )).wait();


            // await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
            //     ethers.BigNumber.from("24")
            // )).wait();

            // await(await deployed.lockIdNftTransferable.connect(deployer).addLockPeriod(
            //     ethers.BigNumber.from("54")
            // )).wait();

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
            const user = addr1
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
            addr1Ids.push([lockId, lockIdPoints]);

            let balanceOfLock1 = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(amount)
            // let allIndexOfTimeset = await deployed.lockIdNftTransferable.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

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
        /*
        it('transferFrom: transfer stos', async () => {
            // 2. addr2 transfer stos to addr1
            let lockId1 = addr2Ids[0][0];
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

            ethers.provider.send("evm_increaseTime", [60*60*24*1])
            ethers.provider.send("evm_mine");

            // await checkDecreaseStosByPassTime(deployed, lockId1, BigNumber.from(""+block.timestamp))
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

        it('depositFor: increase stos', async () => {
            // 3. addr1 increase stos
            const user = addr1
            let lockId =  addr1Ids[0][0];
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

            ethers.provider.send("evm_increaseTime", [60*60*24*1])
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

        it('increaseUnlimitedLock : create unlimited lock stos ', async () => {
            // 4. addr2 create unlimited lock stos
            let user = addr2

            await expect(
                deployed.lockIdNftTransferable.connect(user).increaseUnlimitedLock(
                    addr2.address,
                    ethers.constants.Zero)
            ).to.be.rejectedWith("zero value")

            let amount = ethers.utils.parseEther("100");

            const interface1 = deployed.lockIdNftTransferable.interface ;
            const topic = interface1.getEventTopic('IncreasedUnlimitedLock');
            const receipt = await(await deployed.lockIdNftTransferable.connect(user).increaseUnlimitedLock(
                user.address,
                amount
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);

            expect(deployedEvent.args.account).to.be.eq(user.address)
            expect(deployedEvent.args.amount).to.be.eq(amount)

            let maxTime = await deployed.lockIdNftTransferable.maxTime();
            let MULTIPLIER = await deployed.lockIdNftTransferable.MULTIPLIER()
            let unlimitedStos = amount.mul(MULTIPLIER).div(maxTime).mul(maxTime).div(MULTIPLIER);

            let balanceOfUnlimitedLock = await deployed.lockIdNftTransferable["balanceOfUnlimitedLock(address)"](user.address);
            // console.log('balanceOfUnlimitedLock',user.address, balanceOfUnlimitedLock)

            let balanceOfUnlimitedLockTotal = await deployed.lockIdNftTransferable["totalSupplyUnlimited()"]();
            // console.log('balanceOfUnlimitedLockTotal',balanceOfUnlimitedLockTotal)

            expect(balanceOfUnlimitedLock).to.be.eq(unlimitedStos)
            expect(balanceOfUnlimitedLockTotal).to.be.eq(unlimitedStos)

            let block = await ethers.provider.getBlock('latest')

            // 4 스냅샷
            let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address, block.timestamp)
            expect(balanceAddr2).to.be.eq(balanceOfUnlimitedLockTotal)

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

        it('transferFromUnlimited : transfer partial unlimited lock stos', async () => {
            // 5. addr2 transfer partial unlimited lock stos to addr1

            let amount = ethers.utils.parseEther("50");
            let amount100 = ethers.utils.parseEther("100");
            await expect(
                deployed.lockIdNftTransferable.connect(addr1).transferFromUnlimited(
                    addr1.address,
                    addr2.address,
                    amount)
            ).to.be.rejectedWith("no unlimited amount")

            await expect(
                deployed.lockIdNftTransferable.connect(deployer).transferFromUnlimited(
                    addr2.address,
                    addr1.address,
                    amount)
            ).to.be.rejectedWith("not approved")

            let isApprovedForAll = await deployed.lockIdNftTransferable.isApprovedForAll(addr2.address, deployer.address)
            if (!isApprovedForAll){
                // console.log('isApprovedForAll', isApprovedForAll)
                await (await deployed.lockIdNftTransferable.connect(addr2).setApprovalForAll(deployer.address, true)).wait()
            }
            await (await deployed.lockIdNftTransferable.connect(deployer).transferFromUnlimited(
                    addr2.address,
                    addr1.address,
                    amount)
                ).wait()

            let maxTime = await deployed.lockIdNftTransferable.maxTime();
            // let unlimitedStos = amount.div(maxTime).mul(maxTime);
            let MULTIPLIER = await deployed.lockIdNftTransferable.MULTIPLIER()
            let unlimitedStos = amount.mul(MULTIPLIER).div(maxTime).mul(maxTime).div(MULTIPLIER);


            let unlimitedStosTotal = amount100.mul(MULTIPLIER).div(maxTime).mul(maxTime).div(MULTIPLIER);

            let balanceOfUnlimitedLock = await deployed.lockIdNftTransferable["balanceOfUnlimitedLock(address)"](addr2.address);
            let balanceOfUnlimitedLockTotal = await deployed.lockIdNftTransferable["totalSupplyUnlimited()"]();
            let balanceOfUnlimitedLockAddr1 = await deployed.lockIdNftTransferable["balanceOfUnlimitedLock(address)"](addr1.address);
            expect(balanceOfUnlimitedLock).to.be.eq(unlimitedStos)
            expect(balanceOfUnlimitedLockTotal).to.be.eq(unlimitedStosTotal)
            expect(balanceOfUnlimitedLockAddr1).to.be.eq(unlimitedStos)

            // 5 스냅샷
            let block = await ethers.provider.getBlock('latest')
            let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address, block.timestamp)
            expect(balanceAddr2).to.be.eq(balanceOfUnlimitedLock)

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

        it('increaseLock : increase stos', async () => {
            // 6. addr1 increase stos
             const user = addr1
             let userLockId =  addr1Ids[0][0];
            //  console.log('userLockId', userLockId)

             let lockIdInfos0 = await deployed.lockIdNftTransferable.lockIdInfos(userLockId)
            //  console.log('lockIdInfos0', lockIdInfos0)
            //  let a1 = await deployed.lockIdNftTransferable.ownerOf(userLockId)
            //  console.log('ownerOf ',userLockId, a1)

             expect(await deployed.lockIdNftTransferable.ownerOf(userLockId)).to.be.eq(user.address)

             let unlockWeeks = ethers.BigNumber.from("54");
             let amount = ethers.utils.parseEther("100");
             let allowance = await deployed.tos.allowance(user.address, deployed.lockIdNftTransferable.address);
             if (allowance.lt(amount)) {
                 await deployed.tos.connect(user).approve(deployed.lockIdNftTransferable.address, amount);
             }

             const interface1 = deployed.lockIdNftTransferable.interface ;
             const topic = interface1.getEventTopic('IncreasedLock');
             const receipt = await(await deployed.lockIdNftTransferable.connect(user).increaseLock(
                 user.address,
                 userLockId,
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

             let block = await ethers.provider.getBlock('latest')

             let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)
             expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
             expect(lockIdInfos1.amount).to.be.eq(lockIdInfos0.amount.add(amount))

             let unlimitedAmount = ethers.utils.parseEther("100");
             let maxTime = await deployed.lockIdNftTransferable.maxTime();
             let MULTIPLIER = await deployed.lockIdNftTransferable.MULTIPLIER()
             let unlimitedStos = amount.mul(MULTIPLIER).div(maxTime).mul(maxTime).div(MULTIPLIER);

            //  let unlimitedStos = unlimitedAmount.div(maxTime).mul(maxTime);
             let balanceOfUnlimitedLockTotal = await deployed.lockIdNftTransferable["totalSupplyUnlimited()"]();
             expect(unlimitedStos).to.be.eq(balanceOfUnlimitedLockTotal)

             let balanceOfLock1 = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
             let totalSupplyLocks1 = await deployed.lockIdNftTransferable.totalSupplyAll()
             expect(totalSupplyLocks1).to.be.eq(balanceOfLock1.add(balanceOfUnlimitedLockTotal))


             ethers.provider.send("evm_increaseTime", [60*60*24*7])
             ethers.provider.send("evm_mine");

             let balanceOfLock2 = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
             let totalSupplyLocks2 = await deployed.lockIdNftTransferable.totalSupplyAll()

             let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
             let totalSupplyLocksAt = await deployed.lockIdNftTransferable.totalSupplyAllAt(block.timestamp)
             expect(totalSupplyLocksAt).to.be.eq(balanceOfLockAt.add(balanceOfUnlimitedLockTotal))

             expect(balanceOfLock1).to.be.eq(balanceOfLockAt)
             expect(balanceOfLock1).to.be.gt(balanceOfLock2)

             expect(totalSupplyLocks1).to.be.gt(totalSupplyLocks2)
             expect(totalSupplyLocks1).to.be.eq(totalSupplyLocksAt)

             let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address, block.timestamp)
             let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address, block.timestamp)

             // 6 스냅샷
             stosBalanceL1.push({
                 timestamp: block.timestamp,
                 balance: balanceAddr1
             });

             stosBalanceL2.push({
                 timestamp: block.timestamp,
                 balance: balanceAddr2
             });
        });

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

            let balanceOfLockBefore = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocksBefore = await deployed.lockIdNftTransferable.totalSupplyLocks()
            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)
            expect(await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(amount)

            let allIndexOfTimeset = await deployed.lockIdNftTransferable.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            console.log('block.timestamp', block.timestamp)
            let points = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            let balanceOfLockAfter = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
            console.log('lockId', lockId, balanceOfLockAfter)

            let totalSupplyLocksAfter = await deployed.lockIdNftTransferable.totalSupplyLocks()
            let balanceOfLockAt  = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            let totalSupplyLocksAt = await deployed.lockIdNftTransferable.totalSupplyLocksAt(block.timestamp)

            expect(balanceOfLockBefore).to.be.eq(balanceOfLockAt)
            expect(totalSupplyLocksBefore).to.be.eq(totalSupplyLocksAt)
            expect(balanceOfLockBefore).to.be.gt(balanceOfLockAfter)

            let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfLockAt(address,uint256)"](addr2.address, block.timestamp)

            // 7 스냅샷
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

        it('decreaseUnlimitedLock : decrease unlimited lock stos', async () => {
            // 7. addr2 decrease unlimited lock stos
            const user = addr2

            let userHistory = await deployed.lockIdNftTransferable.pointHistoryOfUnlimited(user.address)
            expect(userHistory.length).to.be.gt(ethers.constants.Zero)
            // console.log(amountHistory[amountHistory.length-1] )

            let amount = userHistory[userHistory.length-1][1];
            expect(amount).to.be.gt(ethers.constants.Zero)

            let totalSupplyUnlimited = await deployed.lockIdNftTransferable.pointOfLastTimeIndexForUnlimited()
            expect(totalSupplyUnlimited.amount).to.be.gte(amount)
            let unlimitedAmountTotal = totalSupplyUnlimited.amount;
            // console.log('unlimitedAmountTotal',unlimitedAmountTotal)

            let balanceOfUnlimitedLockTotal = await deployed.lockIdNftTransferable["totalSupplyUnlimited()"]();
            // console.log('balanceOfUnlimitedLockTotal',balanceOfUnlimitedLockTotal)

            await expect(
                deployed.lockIdNftTransferable.connect(user).decreaseUnlimitedLock(
                    user.address,
                    amount.add(ethers.constants.One)
                )
            ).to.be.rejectedWith("unlimitedAmount is insufficient")

            const interface1 = deployed.lockIdNftTransferable.interface ;
            const receipt = await(await deployed.lockIdNftTransferable.connect(user).decreaseUnlimitedLock(
                user.address,
                amount
            )).wait();

            //--------------
            const topic = interface1.getEventTopic('DecreasedUnlimitedLock');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            expect(deployedEvent.args.account).to.be.eq(user.address)
            expect(deployedEvent.args.amount).to.be.eq(amount)

            //--------------
            let block = await ethers.provider.getBlock('latest')
            let curTime = ethers.BigNumber.from(""+block.timestamp)
            let maxTime = await deployed.lockIdNftTransferable.maxTime();
            let epochUnit = await deployed.lockIdNftTransferable.epochUnit();

            const topic1 = interface1.getEventTopic('LockCreated');
            const log1 = receipt.logs.find(x => x.topics.indexOf(topic1) >= 0 );
            const deployedEvent1 = interface1.parseLog(log1);
            // let unlockTime1 = (maxTime.sub(ethers.constants.One).add(curTime)).div(epochUnit).mul(epochUnit)
            // let unlockTime1 = (block.timestamp + ((maxTime / epochUnit) * epochUnit)) / epochUnit * epochUnit;

            let unlockTime1 = (maxTime.div(epochUnit).mul(epochUnit).add(curTime)).div(epochUnit).mul(epochUnit)

            expect(deployedEvent1.args.account).to.be.eq(user.address)
            expect(deployedEvent1.args.amount).to.be.eq(amount)
            expect(deployedEvent1.args.unlockTime).to.be.eq(unlockTime1)

            let lockId = deployedEvent1.args.lockId
            console.log('lockId', lockId)
            expect(
                await deployed.lockIdNftTransferable.ownerOf(lockId)).to.be.eq(user.address)

            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNftTransferable.pointHistoryOfId(lockId)
            );

            addr2Ids.push([lockId, lockIdPoints]);

            //----------
            let lockIdInfos1 = await deployed.lockIdNftTransferable.lockIdInfos(lockId)
            expect(lockIdInfos1.amount).to.be.eq(amount)

            let userHistory2 = await deployed.lockIdNftTransferable.pointHistoryOfUnlimited(user.address)
            expect(userHistory2.length).to.be.gt(ethers.constants.Zero)
            let remainAmount = userHistory2[userHistory2.length-1][1]
            // console.log('remainAmount',remainAmount)
            expect(remainAmount).to.be.eq(ethers.constants.Zero)

            let totalSupplyUnlimited2 = await deployed.lockIdNftTransferable.pointOfLastTimeIndexForUnlimited()
            // console.log('totalSupplyUnlimited2',totalSupplyUnlimited2)

            let unlimitedAmountTotal2 = totalSupplyUnlimited2.amount;
            expect(unlimitedAmountTotal2).to.be.eq(unlimitedAmountTotal.sub(amount))
            let MULTIPLIER = await deployed.lockIdNftTransferable.MULTIPLIER()
            let unlimitedStos = unlimitedAmountTotal2.mul(MULTIPLIER).div(maxTime).mul(maxTime).div(MULTIPLIER);

            // let unlimitedStos = unlimitedAmountTotal2.div(maxTime).mul(maxTime);
            let balanceOfUnlimitedLockTotal2 = await deployed.lockIdNftTransferable["totalSupplyUnlimited()"]();
            expect(balanceOfUnlimitedLockTotal2).to.be.eq(unlimitedStos)

            let balanceOfLock1 = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks1 = await deployed.lockIdNftTransferable.totalSupplyAll()

            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            let balanceOfLock2 = await deployed.lockIdNftTransferable["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks2 = await deployed.lockIdNftTransferable.totalSupplyAll()

            let balanceOfLockAt = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            let totalSupplyLocksAt = await deployed.lockIdNftTransferable.totalSupplyAllAt(block.timestamp)

            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)
            expect(balanceOfLock1).to.be.gt(balanceOfLock2)

            expect(totalSupplyLocks1).to.be.gt(totalSupplyLocks2)
            expect(totalSupplyLocks1).to.be.eq(totalSupplyLocksAt)

            let balanceAddr1 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address, block.timestamp)
            let balanceAddr2 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address, block.timestamp)

            // 7 스냅샷
            stosBalanceL1.push({
                timestamp: block.timestamp,
                balance: balanceAddr1
            });

            stosBalanceL2.push({
                timestamp: block.timestamp,
                balance: balanceAddr2
            });

        });

        it('compare stos by snapshot time', async () => {
            // 8. 스냅샷 별로 stos 비교.
            // 첫번째 스냅샷 : 1. create stos by addr2
            // 두번째 스냅샷 : 2. addr2 transfer stos to addr1
            // 세번째 스냅샷 : 3. addr1 increase stos
            // 네번째 스냅샷 : 4. addr2 create unlimited lock stos
            // 다섯번째 스냅샷 : 5. addr2 transfer partial unlimited lock stos to addr1
            // 여섯번째 스냅샷 :  6. addr1 increase stos
            // 일곱번째 스냅샷 :  7. addr2 decrease unlimited lock stos

            ethers.provider.send("evm_increaseTime", [60*60*24*1])
            ethers.provider.send("evm_mine");
            let lockId1 = ethers.constants.One;
            let lockId2 = ethers.constants.Two;
            let lockId3 = BigNumber.from("3");

            let snapshotLen = stosBalanceL1.length
            expect(snapshotLen).to.be.eq(7)

            console.log("stosBalanceL1", stosBalanceL1)
            console.log("stosBalanceL2", stosBalanceL2)

            //첫번째 스냅샷 : 1. create stos by addr2
            let timestamp = stosBalanceL2[0].timestamp

            console.log('timestamp', 0, timestamp)

            let balanceOfLockAtId1 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId1,  timestamp)
            let balanceOfLockAddr1 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address,  timestamp)
            let balanceOfLockAddr2 = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address,  timestamp)
            console.log('balanceOfLockAtId1', lockId1, balanceOfLockAtId1)

            let totalSupplyLocksAt = await deployed.lockIdNftTransferable.totalSupplyLocksAt(timestamp)
            let totalSupplyUnlimitedAt = await deployed.lockIdNftTransferable.totalSupplyUnlimitedAt(timestamp)
            let totalSupplyAllAt = await deployed.lockIdNftTransferable.totalSupplyAllAt(timestamp)

            expect(balanceOfLockAtId1).to.be.eq(totalSupplyLocksAt)
            expect(balanceOfLockAtId1).to.be.eq(balanceOfLockAddr2)

            expect(balanceOfLockAddr1).to.be.eq(ethers.constants.Zero)
            expect(totalSupplyUnlimitedAt).to.be.eq(ethers.constants.Zero)
            expect(totalSupplyAllAt).to.be.eq(totalSupplyLocksAt)

            // 두번째 스냅샷 확인 2. addr2 transfer stos to addr1
            let i=1;
            let balance = [ethers.constants.Zero, ethers.constants.Zero];
            let timestamp_2 = ethers.BigNumber.from(""+stosBalanceL1[i].timestamp)

            console.log('timestamp_2', i, timestamp_2)

            await checkSnapshotAmount(deployed, lockId1, lockId2, timestamp_2);
            balance[0] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address,  timestamp_2)
            balance[1] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address,  timestamp_2)

            expect(balance[0]).to.be.eq(stosBalanceL1[i].balance)
            expect(balance[1]).to.be.eq(stosBalanceL2[i].balance)

            // 세번째 스냅샷 확인
            i=2;
            let timestamp_3 = ethers.BigNumber.from(""+stosBalanceL1[i].timestamp)

            console.log('timestamp_3', i, timestamp_3)

            await checkSnapshotAmount(deployed, lockId1, lockId2, timestamp_3);
            balance[0] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address,  timestamp_3)
            balance[1] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address,  timestamp_3)
            expect(balance[0]).to.be.eq(stosBalanceL1[i].balance)
            expect(balance[1]).to.be.eq(stosBalanceL2[i].balance)

            // 4 스냅샷 확인
            i=3;
            let timestamp_4 = ethers.BigNumber.from(""+stosBalanceL1[i].timestamp)

            console.log('timestamp_4', i, timestamp_4)
            await checkSnapshotAmount(deployed, lockId1, lockId2, timestamp_4);
            balance[0] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address,  timestamp_4)
            balance[1] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address,  timestamp_4)
            expect(balance[0]).to.be.eq(stosBalanceL1[i].balance)
            expect(balance[1]).to.be.eq(stosBalanceL2[i].balance)

            // 5 스냅샷 확인
            i=4;
            let timestamp_5 = ethers.BigNumber.from(""+stosBalanceL1[i].timestamp)
            console.log('timestamp_5', i, timestamp_5)
            await checkSnapshotAmount(deployed, lockId1, lockId2, timestamp_5);
            balance[0] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address,  timestamp_5)
            balance[1] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address,  timestamp_5)
            expect(balance[0]).to.be.eq(stosBalanceL1[i].balance)
            expect(balance[1]).to.be.eq(stosBalanceL2[i].balance)

            // 6 스냅샷 확인
            i=5;
            let timestamp_6 = ethers.BigNumber.from(""+stosBalanceL1[i].timestamp)
            console.log('timestamp_6', i, timestamp_6)
            await checkSnapshotAmount(deployed, lockId1, lockId2, timestamp_6);
            balance[0] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address,  timestamp_6)
            balance[1] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address,  timestamp_6)
            expect(balance[0]).to.be.eq(stosBalanceL1[i].balance)
            expect(balance[1]).to.be.eq(stosBalanceL2[i].balance)

            // 7 스냅샷 확인
            i=6;
            let timestamp_7 = ethers.BigNumber.from(""+stosBalanceL1[i].timestamp)
            console.log('timestamp_7', i, timestamp_7)
            balanceOfLockAtId1 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId1, timestamp_7)
            let balanceOfLockAtId2 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId2, timestamp_7)
            let balanceOfLockAtId3 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId3, timestamp_7)

            let balanceOfUnlimitedLockAddr1 = await deployed.lockIdNftTransferable["balanceOfUnlimitedLockAt(address,uint256)"](addr1.address,timestamp_7)
            let balanceOfUnlimitedLockAddr2 = await deployed.lockIdNftTransferable["balanceOfUnlimitedLockAt(address,uint256)"](addr2.address,timestamp_7)

            totalSupplyLocksAt = await deployed.lockIdNftTransferable.totalSupplyLocksAt(timestamp_7)
            totalSupplyUnlimitedAt = await deployed.lockIdNftTransferable.totalSupplyUnlimitedAt(timestamp_7)
            totalSupplyAllAt = await deployed.lockIdNftTransferable.totalSupplyAllAt(timestamp_7)
            let all = balanceOfLockAtId1.add(balanceOfLockAtId2).add(balanceOfLockAtId3);

            let total1 = balanceOfUnlimitedLockAddr1.add(balanceOfUnlimitedLockAddr2)
            expect(ethers.utils.formatUnits(totalSupplyUnlimitedAt, 2).split(".")[0]).to.be.eq(
                ethers.utils.formatUnits(total1, 2).split(".")[0])

            console.log('balanceOfLockAtId1',balanceOfLockAtId1)
            console.log('balanceOfLockAtId2',balanceOfLockAtId2)
            console.log('balanceOfLockAtId3',balanceOfLockAtId3)
            console.log('totalSupplyLocksAt',totalSupplyLocksAt)
            console.log('all',all)

            expect(totalSupplyLocksAt).to.be.eq(all)
            expect(totalSupplyAllAt).to.be.eq(totalSupplyLocksAt.add(totalSupplyUnlimitedAt))




            // 7 스냅샷 확인
            // i=6;
            // let timestamp_7 = ethers.BigNumber.from(""+stosBalanceL1[i].timestamp)
            // let lockId3 = BigNumber.from("3")
            // console.log('timestamp_7', i, timestamp_7)

            // let totalCount = await deployed.lockIdNftTransferable.totalSupply()
            // console.log('totalCount', totalCount)
            // let maxTokenId = await deployed.lockIdNftTransferable.maxTokenId()
            // console.log('maxTokenId', maxTokenId)
            // console.log('addr1Ids', addr1Ids)
            // console.log('addr2Ids', addr2Ids)

            // console.log('----- addr1Ids', addr1Ids[2][0])
            // let array1 = addr1Ids[2][1];
            // for(let j=0; j< array1.length; j++){
            //     console.log(j, array1[j])
            // }

            // console.log('----- addr2Ids', addr2Ids[1][0])
            // array1 = addr2Ids[1][1];
            // for(let j=0; j< array1.length; j++){
            //     console.log(j, array1[j])
            // }

            // let findClosestTimeindex = await deployed.lockIdNftTransferable._findClosestTimeindex(timestamp_7)
            // console.log('----- findClosestTimeindex', findClosestTimeindex)
            // let pointHistoryOfTimeIndex = await deployed.lockIdNftTransferable.pointHistoryOfTimeIndex(
            //     findClosestTimeindex.timeindex)
            // console.log('----- pointHistoryOfTimeIndex', pointHistoryOfTimeIndex)

            // balanceOfLockAtId1 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId1, timestamp_7)
            // let balanceOfLockAtId2 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId2, timestamp_7)
            // let balanceOfLockAtId3 = await deployed.lockIdNftTransferable["balanceOfLockAt(uint256,uint256)"](lockId3, timestamp_7)

            // totalSupplyLocksAt = await deployed.lockIdNftTransferable.totalSupplyLocksAt(timestamp_7)
            // totalSupplyUnlimitedAt = await deployed.lockIdNftTransferable.totalSupplyUnlimitedAt(timestamp_7)
            // totalSupplyAllAt = await deployed.lockIdNftTransferable.totalSupplyAllAt(timestamp_7)

            // let balanceOfUnlimitedLockAddr1 = await deployed.lockIdNftTransferable["balanceOfUnlimitedLockAt(address,uint256)"](addr1.address,timestamp_7)
            // let balanceOfUnlimitedLockAddr2 = await deployed.lockIdNftTransferable["balanceOfUnlimitedLockAt(address,uint256)"](addr2.address,timestamp_7)


            // console.log('balanceOfLockAtId1',balanceOfLockAtId1)
            // console.log('balanceOfLockAtId2',balanceOfLockAtId2)
            // console.log('balanceOfLockAtId3',balanceOfLockAtId3)
            // console.log('totalSupplyLocksAt',totalSupplyLocksAt)

            // console.log('balanceOfUnlimitedLockAddr1',balanceOfUnlimitedLockAddr1)
            // console.log('balanceOfUnlimitedLockAddr2',balanceOfUnlimitedLockAddr2)

            // console.log('totalSupplyUnlimitedAt',totalSupplyUnlimitedAt)
            // console.log('totalSupplyAllAt',totalSupplyAllAt)
            // expect(totalSupplyUnlimitedAt).to.be.eq(balanceOfUnlimitedLockAddr1.add(balanceOfUnlimitedLockAddr2))

            // expect(totalSupplyLocksAt).to.be.eq(balanceOfLockAtId1.add(balanceOfLockAtId2).add(balanceOfLockAtId3))
            // expect(totalSupplyAllAt).to.be.eq(totalSupplyLocksAt.add(totalSupplyUnlimitedAt))

            // balance[0] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr1.address,  timestamp_7)
            // balance[1] = await deployed.lockIdNftTransferable["balanceOfAccountAt(address,uint256)"](addr2.address,  timestamp_7)
            // expect(balance[0]).to.be.eq(stosBalanceL1[i].balance)
            // expect(balance[1]).to.be.eq(stosBalanceL2[i].balance)

        })
        */
    });


});

