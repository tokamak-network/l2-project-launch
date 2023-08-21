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

describe('LockIdFixture', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: LockIdFixture
    let nftTokenInfo: NftTokenInfo
    let pointHistory:Array<Point>;
    let addr1Ids:Array<[BigNumber, Array<Point>]> = [];
    let addr2Ids:Array<[BigNumber, Array<Point>]> = [];


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

    describe('# createLock', () => {
        it('createLock of addr1', async () => {
            const user = addr1
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("10");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockTOS.address, amount);
            }

            const interface1 = deployed.lockTOS.interface ;
            const topic = interface1.getEventTopic('LockCreated');
            const receipt = await(await deployed.lockTOS.connect(user).createLock(
                amount,
                unlockWeeks
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(lockId)
            );

            addr1Ids.push([lockId, lockIdPoints]);

            let totalSupply1 = await deployed.lockTOS.totalSupply()
            let balanceOfLock1 = await deployed.lockTOS.balanceOfLock(lockId)

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            let balanceOfLock2  = await deployed.lockTOS.balanceOfLock(lockId)

            let totalSupply2 = await deployed.lockTOS.totalSupply()

            let balanceOfLockAt = await deployed.lockTOS.balanceOfLockAt(lockId,  block.timestamp)

            let totalSupplyAt = await deployed.lockTOS.totalSupplyAt(block.timestamp)

            expect(balanceOfLock1).to.be.eq(totalSupply1)
            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)
            expect(balanceOfLock1).to.be.gt(balanceOfLock2)
            expect(totalSupply1).to.be.gt(totalSupply2)
            expect(totalSupply1).to.be.eq(totalSupplyAt)
        });


        it('depositFor', async () => {
            const user = addr1
            let userLockId =  addr1Ids[0][0];
            let lockIdInfos0 = await deployed.lockTOS.allLocks(userLockId)
            expect(lockIdInfos0.start).to.be.not.eq(ethers.constants.Zero)

            let amount = ethers.utils.parseEther("100");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockTOS.address, amount);
            }

            const interface1 = deployed.lockTOS.interface ;
            const topic = interface1.getEventTopic('LockDeposited');
            const receipt = await(await deployed.lockTOS.connect(user).depositFor(
                user.address,
                userLockId,
                amount
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(lockId)
            );

            addr1Ids.push([lockId, lockIdPoints]);

            let totalSupply1 = await deployed.lockTOS.totalSupply()
            let balanceOfLock1 = await deployed.lockTOS.balanceOfLock(lockId)

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)

            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");
            let balanceOfLock2  = await deployed.lockTOS.balanceOfLock(lockId)

            let totalSupply2 = await deployed.lockTOS.totalSupply()

            let balanceOfLockAt = await deployed.lockTOS.balanceOfLockAt(lockId,  block.timestamp)

            let totalSupplyAt = await deployed.lockTOS.totalSupplyAt(block.timestamp)

            expect(balanceOfLock1).to.be.eq(totalSupply1)
            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)
            expect(balanceOfLock1).to.be.gt(balanceOfLock2)
            expect(totalSupply1).to.be.gt(totalSupply2)
            expect(totalSupply1).to.be.eq(totalSupplyAt)
        });

    });

    describe('# LockIdNFT ', () => {

        it('createLock', async () => {
            const user = addr2
            let amount = ethers.utils.parseEther("100");
            let unlockWeeks = ethers.BigNumber.from("10");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockTOS.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockIdNFT.address, amount);
            }

            const interface1 = deployed.lockIdNFT.interface ;
            const topic = interface1.getEventTopic('LockCreated');
            const receipt = await(await deployed.lockIdNFT.connect(user).createLock(
                amount,
                unlockWeeks
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNFT.pointHistoryOfId(lockId)
            );
            addr2Ids.push([lockId, lockIdPoints]);

            let balanceOfLock1 = await deployed.lockIdNFT["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks1 = await deployed.lockIdNFT.totalSupplyLocks()
            let lockIdInfos1 = await deployed.lockIdNFT.lockIdInfos(lockId)
            expect(lockIdInfos1.owner).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(amount)

            let allIndexOfTimeset = await deployed.lockIdNFT.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNFT.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            let balanceOfLock2 = await deployed.lockIdNFT["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks2 = await deployed.lockIdNFT.totalSupplyLocks()
            let balanceOfLockAt = await deployed.lockIdNFT["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            let totalSupplyLocksAt = await deployed.lockIdNFT.totalSupplyLocksAt(block.timestamp)

            expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)
            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)
            expect(balanceOfLock1).to.be.gt(balanceOfLock2)
            expect(totalSupplyLocks1).to.be.gt(totalSupplyLocks2)
            expect(totalSupplyLocks1).to.be.eq(totalSupplyLocksAt)
        });

        it('depositFor', async () => {
            const user = addr2
            let userLockId =  addr2Ids[0][0];
            let lockIdInfos0 = await deployed.lockIdNFT.lockIdInfos(userLockId)
            expect(lockIdInfos0.owner).to.be.eq(user.address)

            let amount = ethers.utils.parseEther("100");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockIdNFT.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockIdNFT.address, amount);
            }

            const interface1 = deployed.lockIdNFT.interface ;
            const topic = interface1.getEventTopic('LockDeposited');
            const receipt = await(await deployed.lockIdNFT.connect(user).depositFor(
                user.address,
                userLockId,
                amount
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNFT.pointHistoryOfId(lockId)
            );

            addr2Ids.push([lockId, lockIdPoints]);
            let balanceOfLock1 = await deployed.lockIdNFT["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks1 = await deployed.lockIdNFT.totalSupplyLocks()
            let lockIdInfos1 = await deployed.lockIdNFT.lockIdInfos(lockId)
            expect(lockIdInfos1.owner).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(lockIdInfos0.amount.add(amount))

            let allIndexOfTimeset = await deployed.lockIdNFT.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNFT.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            let balanceOfLock2 = await deployed.lockIdNFT["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks2 = await deployed.lockIdNFT.totalSupplyLocks()
            let balanceOfLockAt = await deployed.lockIdNFT["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            let totalSupplyLocksAt = await deployed.lockIdNFT.totalSupplyLocksAt(block.timestamp)

            expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)
            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)
            expect(balanceOfLock1).to.be.gt(balanceOfLock2)
            expect(totalSupplyLocks1).to.be.gt(totalSupplyLocks2)
            expect(totalSupplyLocks1).to.be.eq(totalSupplyLocksAt)

        });

        it('increaseLock', async () => {
            const user = addr2
            let userLockId =  addr2Ids[0][0];
            let lockIdInfos0 = await deployed.lockIdNFT.lockIdInfos(userLockId)
            expect(lockIdInfos0.owner).to.be.eq(user.address)
            let unlockWeeks = ethers.BigNumber.from("54");
            let amount = ethers.utils.parseEther("100");
            let allowance = await deployed.tos.allowance(user.address, deployed.lockIdNFT.address);
            if (allowance.lt(amount)) {
                await deployed.tos.connect(user).approve(deployed.lockIdNFT.address, amount);
            }

            const interface1 = deployed.lockIdNFT.interface ;
            const topic = interface1.getEventTopic('IncreasedLock');
            const receipt = await(await deployed.lockIdNFT.connect(user).increaseLock(
                user.address,
                userLockId,
                amount,
                unlockWeeks
            )).wait();
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0 );
            const deployedEvent = interface1.parseLog(log);
            let lockId = deployedEvent.args.lockId
            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockIdNFT.pointHistoryOfId(lockId)
            );

            addr2Ids.push([lockId, lockIdPoints]);
            let balanceOfLock1 = await deployed.lockIdNFT["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks1 = await deployed.lockIdNFT.totalSupplyLocks()
            let lockIdInfos1 = await deployed.lockIdNFT.lockIdInfos(lockId)
            expect(lockIdInfos1.owner).to.be.eq(user.address)
            expect(lockIdInfos1.amount).to.be.eq(lockIdInfos0.amount.add(amount))

            let allIndexOfTimeset = await deployed.lockIdNFT.allIndexOfTimes()

            let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNFT.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)

            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            let balanceOfLock2 = await deployed.lockIdNFT["balanceOfLock(uint256)"](lockId)
            let totalSupplyLocks2 = await deployed.lockIdNFT.totalSupplyLocks()
            let balanceOfLockAt = await deployed.lockIdNFT["balanceOfLockAt(uint256,uint256)"](lockId,  block.timestamp)
            let totalSupplyLocksAt = await deployed.lockIdNFT.totalSupplyLocksAt(block.timestamp)

            expect(balanceOfLock1).to.be.eq(totalSupplyLocks1)
            expect(balanceOfLock1).to.be.eq(balanceOfLockAt)
            expect(balanceOfLock1).to.be.gt(balanceOfLock2)
            expect(totalSupplyLocks1).to.be.gt(totalSupplyLocks2)
            expect(totalSupplyLocks1).to.be.eq(totalSupplyLocksAt)

        });
    });

});

