import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { l1Fixtures } from './shared/fixtures'
import {
    L1Fixture, Point, LockedBalance, LockedBalanceInfo
    } from './shared/fixtureInterfaces'

import { BigNumber, Signer } from 'ethers'

function convertPointStructOutputToPoint(pointsArray: Array<any>){
    let pointArray:Array<Point> = [];
    pointsArray.forEach(element => {
        pointArray.push({
            bias: element.bias,
            slope: element.slope,
            timestamp: element.timestamp
        })
    });

    return pointArray;
}

describe('L1 ', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;

    let deployed: L1Fixture

    let pointHistory:Array<Point>;
    let addr1Ids:Array<[BigNumber, Array<Point>]> = [];
    let addr2Ids:Array<[BigNumber, Array<Point>]> = [];

    before('create L1 fixture loader', async () => {
        deployed = await l1Fixtures()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
    })

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
            // console.log(lockIdPoints);
            // console.log(addr1Ids);

            // console.log(deployedEvent.args);
            // deployedEvent.args.account
            // deployedEvent.args.lockId
            // deployedEvent.args.value
            // deployedEvent.args.unlockTime
            let balanceOfLock = await deployed.lockTOS.balanceOfLock(lockId)
            console.log('balanceOfLock', balanceOfLock);

            let totalSupply = await deployed.lockTOS.totalSupply()
            console.log('totalSupply  ', totalSupply);
            console.log(' -------------');


            ethers.provider.send("evm_increaseTime", [60*60*24*7])
            ethers.provider.send("evm_mine");

            balanceOfLock = await deployed.lockTOS.balanceOfLock(lockId)
            console.log('balanceOfLock ---  ', balanceOfLock);

            totalSupply = await deployed.lockTOS.totalSupply()
            console.log('totalSupply --', totalSupply);
        });
 /*
        it('createLock of addr2', async () => {
            const user = addr2
            let amount = ethers.utils.parseEther("1000");
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

            addr2Ids.push([lockId, lockIdPoints]);

            // console.log(lockIdPoints);
            // console.log(addr2Ids);

             let totalSupply = await deployed.lockTOS.totalSupply()
            console.log('totalSupply', totalSupply);
        });

        it('get pointHistory', async () => {
            const lockIdCounter = await deployed.lockTOS.lockIdCounter();
            console.log(lockIdCounter);

            let i = ethers.constants.One;

            while (i.lte(lockIdCounter)){
                let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                    await deployed.lockTOS.pointHistoryOf(i)
                );
                console.log(lockIdPoints);
                i = i.add(ethers.constants.One)
            }
        });
        */
        it('pass blocks', async () => {
            ethers.provider.send("evm_increaseTime", [60*60])
            ethers.provider.send("evm_mine");
        });
    });
    /*
    describe('# depositFor (increaseAmount) ', () => {

        it('depositFor of addr1', async () => {
            const user = addr1
            let amount = ethers.utils.parseEther("200");
            let userLockId = addr1Ids[0][0];
            // let unlockWeeks = ethers.BigNumber.from("10");

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

            expect(deployedEvent.args.account).to.be.eq(user.address);
            expect(deployedEvent.args.lockId).to.be.eq(userLockId);
            expect(deployedEvent.args.value).to.be.eq(amount);

            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(userLockId)
            );

            console.log(lockIdPoints);
            addr1Ids[0][1] = lockIdPoints;
            console.log(addr1Ids);

            let totalSupply = await deployed.lockTOS.totalSupply()
            console.log('totalSupply', totalSupply);
        });

        it('depositFor of addr2', async () => {
            const user = addr2
            let amount = ethers.utils.parseEther("500");
            let userLockId = addr2Ids[0][0];
            // let unlockWeeks = ethers.BigNumber.from("10");

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

            expect(deployedEvent.args.account).to.be.eq(user.address);
            expect(deployedEvent.args.lockId).to.be.eq(userLockId);
            expect(deployedEvent.args.value).to.be.eq(amount);

            let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                await deployed.lockTOS.pointHistoryOf(userLockId)
            );

            console.log(lockIdPoints);
            addr2Ids[0][1] = lockIdPoints;
            console.log(addr2Ids);
            // console.log(addr2Ids);

            let totalSupply = await deployed.lockTOS.totalSupply()
            console.log('totalSupply', totalSupply);
        });

        it('get pointHistory', async () => {
            const lockIdCounter = await deployed.lockTOS.lockIdCounter();
            console.log(lockIdCounter);

            let i = ethers.constants.One;

            while (i.lte(lockIdCounter)){
                let lockIdPoints:Array<Point> = convertPointStructOutputToPoint(
                    await deployed.lockTOS.pointHistoryOf(i)
                );
                console.log(lockIdPoints);
                i = i.add(ethers.constants.One)
            }
        });

    });
*/

})
