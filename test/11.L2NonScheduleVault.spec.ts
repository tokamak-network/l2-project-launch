import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures, l2ProjectLaunchFixtures2, l2UniswapInfo } from './shared/fixtures'
import { SetL2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
/**
 * deployer : owner
 * addr1 :  vault admin, token admin
 * addr2 : projectManager
 */
describe('L2NonScheduleVault', () => {
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
        deployed = await l2ProjectLaunchFixtures2(true)
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })

    describe(' setL2ProjectManager ', () => {

        it('setL2ProjectManager can not be executed by not owner', async () => {
            await expect(
                deployed.nonScheduleVault.connect(addr1).setL2ProjectManager(
                    deployer.address
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2ProjectManager can be executed by only owner ', async () => {

            await deployed.nonScheduleVault.connect(deployer).setL2ProjectManager(
                addr2.address
            )

            expect(await deployed.nonScheduleVault.l2ProjectManager()).to.be.eq(addr2.address)

        })

        it('setL2ProjectManager cannot be changed to the same value', async () => {
            await expect(
                deployed.nonScheduleVault.connect(deployer).setL2ProjectManager(
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

            await (await tokenContract.connect(addr2).approve(deployed.nonScheduleVault.address, tokenInfo.initialSupply)).wait()

        });

        it('setVaultAdmin can not be executed by not onlyL2ProjectManager', async () => {
            await expect(
                deployed.nonScheduleVault.connect(deployer).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                    )
                ).to.be.revertedWith("caller is not l2ProjectManager")
        })

        it('setVaultAdmin can be executed by not onlyL2ProjectManager ', async () => {

            await deployed.nonScheduleVault.connect(addr2).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
            )

            expect(await deployed.nonScheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(true)

        })

        it('setVaultAdmin cannot be changed to the same value', async () => {
            await expect(
                deployed.nonScheduleVault.connect(addr2).setVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                )
            ).to.be.revertedWith("same")
        })
    });


    describe(' transferVaultAdmin ', () => {

        it('transferVaultAdmin can not be executed by not vault admin', async () => {
            await expect(
                deployed.nonScheduleVault.connect(deployer).transferVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                    )
                ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        })

        it('transferVaultAdmin can be executed by not vault admin ', async () => {

            expect(await deployed.nonScheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(true)

            await deployed.nonScheduleVault.connect(addr1).transferVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr2.address
            )

            expect(await deployed.nonScheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr2.address
            )).to.be.eq(true)


            expect(await deployed.nonScheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(false)

            await (await deployed.nonScheduleVault.connect(addr2).transferVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).wait()

            expect(await deployed.nonScheduleVault.isVaultAdmin(
                tokenInfo.tokenAddress,
                addr1.address
            )).to.be.eq(true)

        })

        it('transferVaultAdmin cannot be changed to the same value', async () => {
            await expect(
                deployed.nonScheduleVault.connect(addr1).transferVaultAdmin(
                    tokenInfo.tokenAddress,
                    addr1.address
                )
            ).to.be.revertedWith("same")
        })
    });

    describe(' initialize ', () => {

        it('initialize can not be executed by not project owner or vault admin', async () => {
            let amount = ethers.utils.parseEther("100");
            let name = "DAO"
            let claimer = addr2.address

            await expect(
                    deployed.nonScheduleVault.connect(deployer).initialize(
                        tokenInfo.tokenAddress,
                        name,
                        claimer,
                        amount
                        )
                ).to.be.revertedWith("caller is not a vaultAdmin or ProjectManager")
        })

        it('initialize can be executed by only project owner or vault admin ', async () => {
            let amount = ethers.utils.parseEther("100");
            let name = "DAO"
            let claimer = addr2.address
            const receipt = await (await deployed.nonScheduleVault.connect(addr2).initialize(
                tokenInfo.tokenAddress,
                name,
                claimer,
                amount
                )).wait()

            const topic = deployed.nonScheduleVault.interface.getEventTopic('InitializedL2NonScheduleVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.nonScheduleVault.interface.parseLog(log);

            expect(deployedEvent.args.l2Token).to.be.eq(tokenInfo.tokenAddress)
            expect(deployedEvent.args.name).to.be.eq(name)
            expect(deployedEvent.args.claimer).to.be.eq(claimer)
            expect(deployedEvent.args.totalAllocatedAmount).to.be.eq(amount)

            let viewVaultInfo = await deployed.nonScheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)
            expect(viewVaultInfo.totalAllocatedAmount).to.be.eq(amount)
            expect(viewVaultInfo.totalClaimedAmount).to.be.eq(ethers.constants.Zero)
            expect(viewVaultInfo.claimer).to.be.eq(claimer)

        })

        it('initialize can execute just once', async () => {
            let amount = ethers.utils.parseEther("100");
            let name = "DAO"
            let claimer = addr2.address
            await expect(
                deployed.nonScheduleVault.connect(addr2).initialize(
                    tokenInfo.tokenAddress,
                    name,
                    claimer,
                    amount
                    )
                ).to.be.revertedWith("already initialized")
        })
    });

    describe(' claim ', () => {

        it('claim can not be executed by not vault admin', async () => {
            let amount = ethers.utils.parseEther("1");
            let name = "DAO"
            await expect(
                deployed.nonScheduleVault.connect(deployer).claim(
                    tokenInfo.tokenAddress,
                    name,
                    amount
                    )
                ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        })

        it('claim can be executed by only project owner or vault admin ', async () => {

            let amount = ethers.utils.parseEther("10");
            let name = "DAO"

            let viewVaultInfo0 = await deployed.nonScheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)

            let tokenContract = await ethers.getContractAt(ERC20A.abi, tokenInfo.tokenAddress,addr1)
            let balancePrev = await tokenContract.balanceOf(viewVaultInfo0.claimer)

            const receipt = await (await deployed.nonScheduleVault.connect(addr1).claim(
                tokenInfo.tokenAddress,
                name,
                amount
                )).wait()

            const topic = deployed.nonScheduleVault.interface.getEventTopic('ClaimedInVault');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.nonScheduleVault.interface.parseLog(log);

            expect(deployedEvent.args.l2Token).to.be.eq(tokenInfo.tokenAddress)
            expect(deployedEvent.args.name).to.be.eq(name)
            expect(deployedEvent.args.amount).to.be.eq(amount)

            let viewVaultInfo = await deployed.nonScheduleVault.viewVaultInfo(tokenInfo.tokenAddress, name)
            expect(viewVaultInfo.totalClaimedAmount).to.be.eq(amount)

            let balanceAfter = await tokenContract.balanceOf(viewVaultInfo.claimer)
            expect(balanceAfter).to.be.eq(balancePrev.add(amount))

        })

        it('claim can not execute when remained amount to claim  is insufficient', async () => {
            let amount = ethers.utils.parseEther("100");
            let name = "DAO"
            await expect(
                deployed.nonScheduleVault.connect(addr1).claim(
                    tokenInfo.tokenAddress,
                    name,
                    amount
                    )
                ).to.be.revertedWith("insufficient balance")

        })
    });

});
