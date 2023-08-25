import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber } from 'ethers'
import { lockIdFixture } from './shared/fixtures'
import { LockIdFixture, NftTokenInfo, Point, SyncInfo, SnapshotBalance } from './shared/fixtureInterfaces'

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

describe('LockIdFixture', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: LockIdFixture
    let nftTokenInfo: NftTokenInfo
    let pointHistory:Array<Point>;
    let addr1Ids:Array<[BigNumber, Array<Point>]> = [];
    let addr1IdsL2:Array<[BigNumber, Array<SyncInfo>]> = [];
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

    describe('# universal STOS', () => {

        it('[1st snapshot] stos issued via tos staking at L1', async () => {
            // 1. L1에서 토스 스테이킹을 통해 stos 발행됨 (첫번째 스냅샷)
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
            // console.log('lockId', lockId)
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

            stosBalanceL1.push({
                timestamp: block.timestamp,
                balance: balanceOfLockAt
            });

            stosBalanceL2.push({
                timestamp: block.timestamp,
                balance: ethers.constants.Zero
            });
        });

        describe('L1: register L1 STOS To L2 ', async () => {
            // let block = await ethers.provider.getBlock('latest')
            // console.log('block.timestamp', block.timestamp)
            // let points = await deployed.lockIdNFT.pointHistoryOfTimeIndex(allIndexOfTimeset[0])
            // console.log('points', points)
            it('Register L1 stos to L2.', async () => {
                // 2. L1: stos 를 L2에 등록함.
                ethers.provider.send("evm_increaseTime", [60*60*24*7])
                ethers.provider.send("evm_mine");

                await (await deployed.l1StosToL2.connect(deployer)["register(address)"](addr1.address)).wait()

                let lockId = addr1Ids[0][0];
                let lockIdPoints:Array<SyncInfo> = convertPointStructOutputToSync(
                    await deployed.lockIdNftRegisterInL2.pointHistoryOfId(lockId)
                );
                addr1IdsL2.push([lockId, lockIdPoints]);

            })

            it('check owner in L2', async () => {
                // 3. l2 에서 소유자 확인
                let lockId = addr1Ids[0][0];
                let owner1 = await deployed.lockIdNftRegisterInL2.ownerOf(lockId)
                expect(owner1).to.be.eq(addr1.address)
            })

            it('Before first registration , stos comes out as 0 in L2.', async () => {
                // 4. L2에서 등록이전에는 stos 가 0 으로 나옴.
                let lockId = addr1Ids[0][0];
                const syncInfo:SyncInfo =addr1IdsL2[0][1][0];
                let beforeSyncTime = parseInt(syncInfo.syncTime)-1

                let balanceOfLock1 = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, beforeSyncTime)
                let totalSupplyLocks1 = await deployed.lockIdNftRegisterInL2.totalSupplyLocksAt(beforeSyncTime)
                expect(balanceOfLock1).to.be.eq(ethers.constants.Zero)
                expect(totalSupplyLocks1).to.be.eq(ethers.constants.Zero)


                let balanceOfLockTOSAt  = await deployed.lockTOS.balanceOfLockAt(lockId, beforeSyncTime)
                let totalSupplyLockTOSAt  = await deployed.lockTOS.totalSupplyAt(beforeSyncTime)
                expect(balanceOfLockTOSAt).to.be.gt(ethers.constants.Zero)
                expect(totalSupplyLockTOSAt).to.be.gt(ethers.constants.Zero)

            })

            it('[2nd snapshot] After register, the balances of L1 and L2 should be the same.', async () => {
                // 5. 등록이후, L1과 L2에서 모두 stos가 같게 조회됨. (두번째 스냅샷)
                let lockId = addr1Ids[0][0];
                const syncInfo:SyncInfo =addr1IdsL2[0][1][0];
                let beforeSyncTime = parseInt(syncInfo.syncTime)


                await checkBalanceAtSame(deployed, lockId, beforeSyncTime);

                let balanceOfLockAt = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, beforeSyncTime)
                let balanceOfLockTOS  = await deployed.lockTOS.balanceOfLockAt(lockId, beforeSyncTime)

                stosBalanceL1.push({
                    timestamp: beforeSyncTime,
                    balance: balanceOfLockTOS
                });

                stosBalanceL2.push({
                    timestamp: beforeSyncTime,
                    balance:  balanceOfLockAt
                });
            })

            it('After registration, even if time passes, both L1 and L2 stos are querying the same.', async () => {
                // 5. 등록이후, 시간이 지나도, L1과 L2에서 모두 stos가 같게 조회됨.

                // ethers.provider.send("evm_increaseTime", [60*60*24*1])
                // ethers.provider.send("evm_mine");

                let block = await ethers.provider.getBlock('latest')

                let lockId = addr1Ids[0][0];
                await checkBalanceSame(deployed, lockId);
                await checkBalanceAtSame(deployed, lockId, block.timestamp);

            })

            it('[3rd snapshot] Increase the amount of stos in L1. Stos of L1 and L2 are queried differently.', async () => {
                // 6. L1에서 stos 물량을 늘림 . L1과 L2의 stos 가 다르게 조회됨.(세번째 스냅샷)

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
                // console.log('addr1Ids', addr1Ids)

                let block = await ethers.provider.getBlock('latest')

                let totalSupply = await deployed.lockTOS.totalSupply()
                let balanceOfLock = await deployed.lockTOS.balanceOfLock(lockId)

                let balanceOfLockAtL1 = await deployed.lockTOS.balanceOfLockAt(lockId,  block.timestamp)
                let totalSupplyAtL1 = await deployed.lockTOS.totalSupplyAt(block.timestamp)

                let balanceOfLockAtL2 = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, block.timestamp)
                let totalSupplyAtL2 = await deployed.lockIdNftRegisterInL2.totalSupplyLocksAt(block.timestamp)

                expect(balanceOfLockAtL1).to.be.gt(balanceOfLockAtL2)
                expect(balanceOfLockAtL1).to.be.eq(totalSupplyAtL1)
                expect(balanceOfLockAtL2).to.be.eq(totalSupplyAtL2)
                // console.log('block.timestamp' , block.timestamp)
                // console.log('balanceOfLockAtL1' , balanceOfLockAtL1)
                // console.log('balanceOfLockAtL2' , balanceOfLockAtL2)

                stosBalanceL1.push({
                    timestamp: block.timestamp,
                    balance: balanceOfLockAtL1
                });

                stosBalanceL2.push({
                    timestamp: block.timestamp,
                    balance:  balanceOfLockAtL2
                });

            })

            it('Register L1 stos to L2.', async () => {
                // 7. L1: stos 를 L2에 등록함.
                // ethers.provider.send("evm_increaseTime", [60*60*24*1])
                // ethers.provider.send("evm_mine");

                await (await deployed.l1StosToL2.connect(deployer)["register(address)"](addr1.address)).wait()

                let lockId = addr1Ids[0][0];
                let lockIdPoints:Array<SyncInfo> = convertPointStructOutputToSync(
                    await deployed.lockIdNftRegisterInL2.pointHistoryOfId(lockId)
                );
                addr1IdsL2.push([lockId, lockIdPoints]);
                // console.log('addr1IdsL2', addr1IdsL2)
            })

            it('check owner in L2', async () => {
                //  l2 에서 소유자 확인
                let lockId = addr1Ids[0][0];
                let owner1 = await deployed.lockIdNftRegisterInL2.ownerOf(lockId)
                expect(owner1).to.be.eq(addr1.address)
            })

            it('[4th snapshot]  After register, the balances of L1 and L2 should be the same.', async () => {
                // 등록이후, L1과 L2에서 모두 stos가 같게 조회됨. (네번째 스냅샷)
                let lockId = addr1Ids[0][0];
                // const syncInfo:SyncInfo = addr1IdsL2[1][1][0];
                // let beforeSyncTime = parseInt(syncInfo.syncTime)
                let block = await ethers.provider.getBlock('latest')
                let timestamp = block.timestamp
                await checkBalanceAtSame(deployed, lockId, timestamp);

                let balanceOfLockAt = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, timestamp)
                let balanceOfLockTOS  = await deployed.lockTOS.balanceOfLockAt(lockId, timestamp)
                let totalSupplyAtL2 = await deployed.lockIdNftRegisterInL2.totalSupplyLocks()
                expect(balanceOfLockAt).to.be.eq(totalSupplyAtL2)

                stosBalanceL1.push({
                    timestamp: timestamp,
                    balance: balanceOfLockTOS
                });

                stosBalanceL2.push({
                    timestamp: timestamp,
                    balance:  balanceOfLockAt
                });
            })

            it('compare stos balance of L1 and L2 by snapshot time', async () => {
                // 8. 스냅샷 별로 stos 비교.
                // 첫번째 스냅샷 : L2 stos 0
                // 두번째 스냅샷 : L1 stos == L2 stos
                // 세번째 스냅샷 : L1 stos > L2 stos
                // 네번째 스냅샷 : L1 stos == L2 stos
                // ethers.provider.send("evm_increaseTime", [60*60*24*1])
                // ethers.provider.send("evm_mine");
                let lockId = addr1Ids[0][0];
                let snapshotLen = stosBalanceL1.length
                expect(snapshotLen).to.be.eq(4)
                // 첫번째 스냅샷 확인
                let timestamp = stosBalanceL1[0].timestamp
                let balanceOfLockAtL1 = await deployed.lockTOS.balanceOfLockAt(lockId,  timestamp)
                let totalSupplyAtL1 = await deployed.lockTOS.totalSupplyAt(timestamp)
                let balanceOfLockAtL2 = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, timestamp)
                let totalSupplyAtL2 = await deployed.lockIdNftRegisterInL2.totalSupplyLocksAt(timestamp)
                expect(balanceOfLockAtL1).to.be.eq(totalSupplyAtL1)
                expect(balanceOfLockAtL2).to.be.eq(ethers.constants.Zero)
                expect(balanceOfLockAtL1).to.be.eq(totalSupplyAtL1)
                // console.log('첫번째 스냅샷 balanceOfLockAtL1', balanceOfLockAtL1)
                // console.log('첫번째 스냅샷 balanceOfLockAtL2', balanceOfLockAtL2)

                // 두번째 스냅샷 확인
                let timestamp_2 = stosBalanceL1[1].timestamp
                await checkBalanceAtSame(deployed, lockId, timestamp_2);
                // let balanceOfLockAtL1_2 = await deployed.lockTOS.balanceOfLockAt(lockId,  timestamp_2)
                // let balanceOfLockAtL2_2 = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, timestamp_2)
                // console.log('두번째 스냅샷 timestamp_2', timestamp_2)
                // console.log('두번째 스냅샷 balanceOfLockAtL1_2', balanceOfLockAtL1_2)
                // console.log('두번째 스냅샷 balanceOfLockAtL2_2', balanceOfLockAtL2_2)

                // 세번째 스냅샷 확인
                let timestamp_3 = stosBalanceL1[2].timestamp
                let balanceOfLockAtL1_3 = await deployed.lockTOS.balanceOfLockAt(lockId,  timestamp_3)
                let totalSupplyAtL1_3 = await deployed.lockTOS.totalSupplyAt(timestamp_3)
                let balanceOfLockAtL2_3 = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, timestamp_3)
                let totalSupplyAtL2_3 = await deployed.lockIdNftRegisterInL2.totalSupplyLocksAt(timestamp_3)

                expect(balanceOfLockAtL1_3).to.be.gt(balanceOfLockAtL2_3)
                // console.log('세번째 스냅샷 timestamp_3', timestamp_3)
                // console.log('세번째 스냅샷 balanceOfLockAtL1_3', balanceOfLockAtL1_3)
                // console.log('세번째 스냅샷 balanceOfLockAtL2_3', balanceOfLockAtL2_3)

                expect(balanceOfLockAtL1_3).to.be.eq(totalSupplyAtL1_3)
                expect(balanceOfLockAtL2_3).to.be.eq(totalSupplyAtL2_3)

                // 네번째 스냅샷 확인
                let timestamp_4 = stosBalanceL1[3].timestamp
                await checkBalanceAtSame(deployed, lockId, timestamp_4);
                // let balanceOfLockAtL1_4 = await deployed.lockTOS.balanceOfLockAt(lockId,  timestamp_4)
                // let balanceOfLockAtL2_4 = await deployed.lockIdNftRegisterInL2["balanceOfLockAt(uint256,uint32)"](lockId, timestamp_4)
                // console.log('세번째 스냅샷 timestamp_4', timestamp_4)
                // console.log('네번째 스냅샷 balanceOfLockAtL1_4', balanceOfLockAtL1_4)
                // console.log('네번째 스냅샷 balanceOfLockAtL2_4', balanceOfLockAtL2_4)
            })

        });


    });

});

