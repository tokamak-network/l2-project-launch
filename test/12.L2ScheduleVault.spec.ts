import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures, l2ProjectLaunchFixtures2, l2UniswapInfo } from './shared/fixtures'
import { SetL2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'
import {
    getPublicSaleParams, getInitialLiquidityParams, getLpRewardParams,
    getTosAirdropParams, getTonAirdropParams, getScheduleParams, getNonScheduleParams } from './shared/vaultParameters'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
/**
 * deployer : owner
 * addr1 :  vault admin, token admin
 * addr2 : projectManager
 */
describe('L2ScheduleVault', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: SetL2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string;
    let projectInfo: any;
    let tokenInfo = {
        name: "TEST_TOKEN",
        symbol: "TST",
        initialSupply: ethers.utils.parseEther("100000"),
        owner: '',
        tokenAddress: ''
    }
    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures2()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })

    describe(' setL2ProjectManager ', () => {

        it('setL2ProjectManager can not be executed by not owner', async () => {
            await expect(
                deployed.scheduleVault.connect(addr1).setL2ProjectManager(
                    deployer.address
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2ProjectManager can be executed by only owner ', async () => {

            await deployed.scheduleVault.connect(deployer).setL2ProjectManager(
                addr2.address
            )

            expect(await deployed.scheduleVault.l2ProjectManager()).to.be.eq(addr2.address)

        })

        it('setL2ProjectManager cannot be changed to the same value', async () => {
            await expect(
                deployed.scheduleVault.connect(deployer).setL2ProjectManager(
                    addr2.address
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' setVaultAdmin ', () => {

        it('create non mint-able token', async () => {

            tokenInfo.owner = await addr1.getAddress()

            const receipt = await (await  deployed.l1ERC20A_TokenFactory.connect(deployer).create(
                    tokenInfo.name,
                    tokenInfo.symbol,
                    tokenInfo.initialSupply,
                    tokenInfo.owner
            )).wait();

            const topic = deployed.l1ERC20A_TokenFactory.interface.getEventTopic('CreatedERC20A');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1ERC20A_TokenFactory.interface.parseLog(log);
            tokenInfo.tokenAddress = deployedEvent.args.contractAddress;

            expect(deployedEvent.args.contractAddress).to.not.eq(ethers.constants.AddressZero);
            expect(deployedEvent.args.name).to.eq(tokenInfo.name);
            expect(deployedEvent.args.symbol).to.eq(tokenInfo.symbol);
            expect(deployedEvent.args.initialSupply).to.eq(tokenInfo.initialSupply);
            expect(deployedEvent.args.to).to.eq(tokenInfo.owner);

            let tokenContract = await ethers.getContractAt(ERC20A.abi, tokenInfo.tokenAddress,addr1)

            await (await tokenContract.connect(addr1).transfer(addr2.address, tokenInfo.initialSupply)).wait()

            expect(await tokenContract.balanceOf(addr2.address)).to.be.eq(tokenInfo.initialSupply)

            await (await tokenContract.connect(addr2).approve(deployed.scheduleVault.address, tokenInfo.initialSupply)).wait()

        });

        it('setVaultAdmin can not be executed by not onlyL2ProjectManager', async () => {
            await expect(
                deployed.scheduleVault.connect(deployer).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                    )
                ).to.be.revertedWith("caller is not l2ProjectManager")
        })

        it('setVaultAdmin can be executed by not onlyL2ProjectManager ', async () => {

            await deployed.scheduleVault.connect(addr2).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
            )

            expect(await deployed.scheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(true)

        })

        it('setVaultAdmin cannot be changed to the same value', async () => {
            await expect(
                deployed.scheduleVault.connect(addr2).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                )
            ).to.be.revertedWith("same")
        })
    });


    describe(' transferVaultAdmin ', () => {

        it('transferVaultAdmin can not be executed by not vault admin', async () => {
            await expect(
                deployed.scheduleVault.connect(deployer).transferVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                    )
                ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        })

        it('transferVaultAdmin can be executed by not vault admin ', async () => {

            expect(await deployed.scheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(true)

            await deployed.scheduleVault.connect(addr1).transferVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr2.address
            )

            expect(await deployed.scheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr2.address
            )).to.be.eq(true)


            expect(await deployed.scheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(false)

            await (await deployed.scheduleVault.connect(addr2).transferVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).wait()

            expect(await deployed.scheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(true)

        })

        it('transferVaultAdmin cannot be changed to the same value', async () => {
            await expect(
                deployed.scheduleVault.connect(addr1).transferVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' initialize ', () => {

        it('initialize can not be executed by not project owner or vault admin', async () => {
            let amount = ethers.utils.parseEther("100");
            let name = "TEAM"

            let teamParams =  getScheduleParams(
                name,
                addr1.address,
                amount, //totalAllocatedAmount
                3, // totalClaimCount
                amount.div(BigNumber.from("2")), //firstClaimAmount
                0, //firstClaimTime
                0, //secondClaimTime
                0 //roundIntervalTime
                );

            await expect(
                    deployed.scheduleVault.connect(deployer).initialize(
                        tokenInfo.tokenAddress,
                        teamParams.vaultName,
                        teamParams.params
                        )
                ).to.be.revertedWith("caller is not a vaultAdmin or ProjectManager")
        })

        it('initialize can be executed by only project owner or vault admin ', async () => {
            let amount = ethers.utils.parseEther("100");
            let name = "TEAM"
            let claimer = addr1.address
            let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
            let firstClaimTime = sTime
            let totalClaimCount = 4
            let firstClaimAmount = amount.div(BigNumber.from("4"))
            let roundIntervalTime = 60*60*24*7;
            let secondClaimTime =  firstClaimTime + roundIntervalTime

            let teamParams =  getScheduleParams(
                name,
                claimer,
                amount, //totalAllocatedAmount
                totalClaimCount, // totalClaimCount
                firstClaimAmount, //firstClaimAmount
                firstClaimTime, //firstClaimTime
                secondClaimTime, //secondClaimTime
                roundIntervalTime //roundIntervalTime
                );
            const receipt = await (await deployed.scheduleVault.connect(addr2).initialize(
                tokenInfo.tokenAddress,
                teamParams.vaultName,
                teamParams.params
            )).wait()

            const topic = deployed.scheduleVault.interface.getEventTopic('InitializedL2ScheduleVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.scheduleVault.interface.parseLog(log);

            expect(deployedEvent.args.l2Token).to.be.eq(tokenInfo.tokenAddress)
            expect(deployedEvent.args.name).to.be.eq(name)
            expect(deployedEvent.args.parmas.claimer).to.be.eq(claimer)
            expect(deployedEvent.args.parmas.totalAllocatedAmount).to.be.eq(amount)
            expect(deployedEvent.args.parmas.totalClaimCount).to.be.eq(teamParams.params.totalClaimCount)
            expect(deployedEvent.args.parmas.firstClaimAmount).to.be.eq(teamParams.params.firstClaimAmount)
            expect(deployedEvent.args.parmas.firstClaimTime).to.be.eq(teamParams.params.firstClaimTime)
            expect(deployedEvent.args.parmas.secondClaimTime).to.be.eq(teamParams.params.secondClaimTime)
            expect(deployedEvent.args.parmas.roundIntervalTime).to.be.eq(teamParams.params.roundIntervalTime)

            let viewVaultInfo = await deployed.scheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)
            expect(viewVaultInfo.claimer).to.be.eq(claimer)
            expect(viewVaultInfo.totalAllocatedAmount).to.be.eq(teamParams.params.totalAllocatedAmount)
            expect(viewVaultInfo.totalClaimCount).to.be.eq(teamParams.params.totalClaimCount)
            expect(viewVaultInfo.totalClaimedAmount).to.be.eq(ethers.constants.Zero)
            expect(viewVaultInfo.firstClaimAmount).to.be.eq(teamParams.params.firstClaimAmount)
            expect(viewVaultInfo.firstClaimTime).to.be.eq(teamParams.params.firstClaimTime)
            expect(viewVaultInfo.secondClaimTime).to.be.eq(teamParams.params.secondClaimTime)
            expect(viewVaultInfo.roundInterval).to.be.eq(teamParams.params.roundIntervalTime)
            expect(viewVaultInfo.latestClaimedRound).to.be.eq(ethers.constants.Zero)

        })

        it('initialize can execute just once', async () => {
            let amount = ethers.utils.parseEther("100");
            let name = "TEAM"
            let claimer = addr1.address
            let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
            let firstClaimTime = sTime
            let totalClaimCount = 4
            let firstClaimAmount = amount.div(BigNumber.from("4"))
            let roundIntervalTime = 60*60*24*7;
            let secondClaimTime =  firstClaimTime + roundIntervalTime

            let teamParams =  getScheduleParams(
                name,
                claimer,
                amount, //totalAllocatedAmount
                totalClaimCount, // totalClaimCount
                firstClaimAmount, //firstClaimAmount
                firstClaimTime, //firstClaimTime
                secondClaimTime, //secondClaimTime
                roundIntervalTime //roundIntervalTime
                );
            await expect(
                deployed.scheduleVault.connect(addr2).initialize(
                    tokenInfo.tokenAddress,
                    teamParams.vaultName,
                    teamParams.params
                    )
                ).to.be.revertedWith("already initialized")
        })
    });

    describe(' claim ', () => {

        it('claim can not be executed if there is no claimable amount', async () => {
            let amount = ethers.utils.parseEther("1");
            let name = "TEAM"
            await expect(
                deployed.scheduleVault.connect(deployer).claim(
                    tokenInfo.tokenAddress,
                    name
                    )
                ).to.be.revertedWith("no claimable amount")
        })

        it('claim can be executed after pass firstClaimTime', async () => {

            let name = "TEAM"

            let viewVaultInfo0 = await deployed.scheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)

            let block = await ethers.provider.getBlock('latest')

            if(viewVaultInfo0.firstClaimTime > block.timestamp ) {
                ethers.provider.send("evm_increaseTime", [viewVaultInfo0.firstClaimTime - block.timestamp + 100 ])
                ethers.provider.send("evm_mine");
            }

            let tokenContract = await ethers.getContractAt(ERC20A.abi, tokenInfo.tokenAddress,addr1)
            let balancePrev = await tokenContract.balanceOf(viewVaultInfo0.claimer)

            const receipt = await (await deployed.scheduleVault.connect(addr1).claim(
                tokenInfo.tokenAddress,
                name
                )).wait()

            const topic = deployed.scheduleVault.interface.getEventTopic('ClaimedInVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.scheduleVault.interface.parseLog(log);

            expect(deployedEvent.args.l2Token).to.be.eq(tokenInfo.tokenAddress)
            expect(deployedEvent.args.name).to.be.eq(name)
            expect(deployedEvent.args.amount).to.be.eq(viewVaultInfo0.firstClaimAmount)

            let viewVaultInfo = await deployed.scheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)
            expect(viewVaultInfo.totalClaimedAmount).to.be.eq(viewVaultInfo0.firstClaimAmount)

            let balanceAfter = await tokenContract.balanceOf(viewVaultInfo.claimer)
            expect(balanceAfter).to.be.eq(balancePrev.add(viewVaultInfo0.firstClaimAmount))

        })

        it('claim can not be executed if there is no claimable amount', async () => {

            let name = "TEAM"
            await expect(
                deployed.scheduleVault.connect(deployer).claim(
                    tokenInfo.tokenAddress,
                    name
                    )
                ).to.be.revertedWith("no claimable amount")
        })

        it('If multiple rounds have passed, you can receive the unclaimed amount all at once.', async () => {

            let name = "TEAM"

            let viewVaultInfo0 = await deployed.scheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)

            let block = await ethers.provider.getBlock('latest')

            let passTime = viewVaultInfo0.secondClaimTime + viewVaultInfo0.roundInterval ;
            let amount = viewVaultInfo0.totalAllocatedAmount.div(viewVaultInfo0.totalClaimCount).mul(BigNumber.from("2"));

            if(passTime > block.timestamp ) {
                ethers.provider.send("evm_increaseTime", [passTime - block.timestamp + 100 ])
                ethers.provider.send("evm_mine");
            }

            let tokenContract = await ethers.getContractAt(ERC20A.abi, tokenInfo.tokenAddress,addr1)
            let balancePrev = await tokenContract.balanceOf(viewVaultInfo0.claimer)

            const receipt = await (await deployed.scheduleVault.connect(addr1).claim(
                tokenInfo.tokenAddress,
                name
                )).wait()

            const topic = deployed.scheduleVault.interface.getEventTopic('ClaimedInVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.scheduleVault.interface.parseLog(log);

            expect(deployedEvent.args.l2Token).to.be.eq(tokenInfo.tokenAddress)
            expect(deployedEvent.args.name).to.be.eq(name)
            expect(deployedEvent.args.amount).to.be.eq(amount)

            let viewVaultInfo = await deployed.scheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)
            expect(viewVaultInfo.totalClaimedAmount).to.be.eq(viewVaultInfo0.firstClaimAmount.add(amount))

            let balanceAfter = await tokenContract.balanceOf(viewVaultInfo.claimer)
            expect(balanceAfter).to.be.eq(balancePrev.add(amount))

        })

    });

});
