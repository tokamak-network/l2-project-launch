import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer } from 'ethers'
import { l2ProjectLaunchFixtures } from './shared/fixtures'
import { L2ProjectLaunchFixture } from './shared/fixtureInterfaces'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
import ERC20C from './abi/ERC20C.json'
import ERC20D from './abi/ERC20D.json'
import L2StandardERC20 from './abi/L2StandardERC20.json'
import snapshotGasCost from './shared/snapshotGasCost'

describe('L2ProjectManager', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: L2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string;
    let projectInfo: any;

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })

    describe('# setL1ProjectManager', () => {
        it('setL1ProjectManager can not be executed by not owner', async () => {
            await expect(
                deployed.l2ProjectManager.connect(addr1).setL1ProjectManager(deployed.l1ProjectManager.address)
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL1ProjectManager can be executed by only owner ', async () => {
            await deployed.l2ProjectManager.connect(deployer).setL1ProjectManager(deployed.l1ProjectManager.address)
            expect(await deployed.l2ProjectManager.l1ProjectManager()).to.eq(deployed.l1ProjectManager.address)
        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.l2ProjectManager.connect(deployer).setL1ProjectManager(deployed.l1ProjectManager.address)
                ).to.be.revertedWith("same")
        })
    });

    describe('# setL2TokenFactory', () => {
        it('setL2TokenFactory can not be executed by not owner', async () => {
            await expect(
                deployed.l2ProjectManager.connect(addr1).setL2TokenFactory(deployed.l2TokenFactory.address)
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2TokenFactory can be executed by only owner ', async () => {
            await deployed.l2ProjectManager.connect(deployer).setL2TokenFactory(deployed.l2TokenFactory.address)
            expect(await deployed.l2ProjectManager.l2TokenFactory()).to.eq(deployed.l2TokenFactory.address)
        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.l2ProjectManager.connect(deployer).setL2TokenFactory(deployed.l2TokenFactory.address)
                ).to.be.revertedWith("same")
        })
    });

    describe('# addProject', () => {
        it('create non mint-able token', async () => {
            projectInfo = {
                projectId :  ethers.constants.Zero,
                tokenOwner: addr1Address,
                projectOwner: addr2Address,
                initialTotalSupply: ethers.utils.parseEther("100000"),
                tokenType: 0, // non-mintable
                projectName: 'CandyShop',
                tokenName: 'Candy',
                tokenSymbol: 'CDY',
                l1Token: ethers.constants.AddressZero,
                l2Token: ethers.constants.AddressZero,
            }

            const topic = deployed.l1ERC20A_TokenFactory.interface.getEventTopic('CreatedERC20A');

            const receipt = await (await  deployed.l1ERC20A_TokenFactory.connect(addr1).create(
                projectInfo.tokenName,
                projectInfo.tokenSymbol,
                projectInfo.initialTotalSupply,
                projectInfo.tokenOwner
            )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1ERC20A_TokenFactory.interface.parseLog(log);
            projectInfo.l1Token = deployedEvent.args.contractAddress;

            expect(deployedEvent.args.contractAddress).to.not.eq(ethers.constants.AddressZero);
            expect(deployedEvent.args.name).to.eq(projectInfo.tokenName);
            expect(deployedEvent.args.symbol).to.eq(projectInfo.tokenSymbol);
            expect(deployedEvent.args.initialSupply).to.eq(projectInfo.initialTotalSupply);
            expect(deployedEvent.args.to).to.eq(projectInfo.tokenOwner);
        });

        // it('addProject is failed if caller is not onlyL2TokenFactory.', async () => {
        //     await expect(deployed.l2ProjectManager.connect(deployer).addProject(
        //         projectInfo.projectOwner,
        //         projectInfo.l1Token,
        //         projectInfo.l1Token,
        //         projectInfo.projectName
        //     )).to.be.revertedWith("caller is not l2TokenFactory");
        // });

    });

});

