import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures } from './shared/fixtures'
import { L2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'

import snapshotGasCost from './shared/snapshotGasCost'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
import ERC20C from './abi/ERC20C.json'
import ERC20D from './abi/ERC20D.json'

describe('L1ProjectManager', () => {
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

    describe('# setL1TokenFactories', () => {

        it('setL1TokenFactories can not be executed by not owner', async () => {
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL1TokenFactories(
                    [0,1,2,3],
                    [
                        deployed.l1ERC20A_TokenFactory.address,
                        deployed.l1ERC20B_TokenFactory.address,
                        deployed.l1ERC20C_TokenFactory.address,
                        deployed.l1ERC20D_TokenFactory.address,
                    ]
                )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL1TokenFactories can be executed by only owner', async () => {
            await deployed.l1ProjectManager.connect(deployer).setL1TokenFactories(
                [0,1,2,3],
                [
                    deployed.l1ERC20A_TokenFactory.address,
                    deployed.l1ERC20B_TokenFactory.address,
                    deployed.l1ERC20C_TokenFactory.address,
                    deployed.l1ERC20D_TokenFactory.address,
                ]
            )

            expect(await deployed.l1ProjectManager.l1TokenFactory(0)).to.eq(deployed.l1ERC20A_TokenFactory.address)
            expect(await deployed.l1ProjectManager.l1TokenFactory(1)).to.eq(deployed.l1ERC20B_TokenFactory.address)
            expect(await deployed.l1ProjectManager.l1TokenFactory(2)).to.eq(deployed.l1ERC20C_TokenFactory.address)
            expect(await deployed.l1ProjectManager.l1TokenFactory(3)).to.eq(deployed.l1ERC20D_TokenFactory.address)

        })

    });

    describe('# setL2TokenFactory', () => {

        it('setL2TokenFactory can not be executed by not owner', async () => {
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL2TokenFactory(0, deployed.l2TokenFactory.address)
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2TokenFactory can be executed by only owner ', async () => {

            await deployed.l1ProjectManager.connect(deployer).setL2TokenFactory(0, deployed.l2TokenFactory.address)
            expect(await deployed.l1ProjectManager.l2TokenFactory(0)).to.eq(deployed.l2TokenFactory.address)

        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.l1ProjectManager.connect(deployer).setL2TokenFactory(0, deployed.l2TokenFactory.address)
                ).to.be.revertedWith("same")
        })
    });

    describe('# setL2ProjectManager', () => {

        it('setL2Vaults can not be executed before setting l2ProjectManager', async () => {

            await expect(
                deployed.l1ProjectManager.connect(addr2).setL2Vaults(
                    ethers.constants.One,
                    20000
                    )
                ).to.be.revertedWith("Z2")
        })

        it('setL2ProjectManager can not be executed by not owner', async () => {
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL2ProjectManager(0, deployed.l2ProjectManager.address)
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2ProjectManager can be executed by only owner ', async () => {

            await deployed.l1ProjectManager.connect(deployer).setL2ProjectManager(0, deployed.l2ProjectManager.address)
            expect(await deployed.l1ProjectManager.l2ProjectManager(0)).to.eq(deployed.l2ProjectManager.address)

        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.l1ProjectManager.connect(deployer).setL2ProjectManager(0, deployed.l2ProjectManager.address)
                ).to.be.revertedWith("same")
        })
    });

    describe('# createProject', () => {

        it('Anybody can create project', async () => {

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
                l2Type: 0,
                addressManager: ethers.constants.AddressZero
            }

            const topic = deployed.l1ProjectManager.interface.getEventTopic('CreatedProject');

            const receipt = await (await deployed.l1ProjectManager.connect(deployer).createProject(
                projectInfo.tokenOwner,
                projectInfo.projectOwner,
                projectInfo.initialTotalSupply,
                projectInfo.tokenType,
                projectInfo.projectName,
                projectInfo.tokenName,
                projectInfo.tokenSymbol,
            )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1ProjectManager.interface.parseLog(log);

            projectInfo.projectId = deployedEvent.args.projectId;
            projectInfo.l1Token = deployedEvent.args.l1Token;

            expect(deployedEvent.args.projectName).to.eq(projectInfo.projectName)
            expect(deployedEvent.args.projectOwner).to.eq(projectInfo.projectOwner)
            expect(deployedEvent.args.tokenName).to.eq(projectInfo.tokenName)
            expect(deployedEvent.args.tokenSymbol).to.eq(projectInfo.tokenSymbol)
            expect(deployedEvent.args.initialTotalSupply).to.eq(projectInfo.initialTotalSupply)

            expect(projectInfo.projectId).to.gt(ethers.constants.Zero)
            expect(projectInfo.l1Token).to.not.eq(ethers.constants.AddressZero)

            const tokenContract = await ethers.getContractAt(ERC20A.abi, projectInfo.l1Token, addr1);
            expect(await tokenContract.totalSupply()).to.be.eq(projectInfo.initialTotalSupply)
            expect(await tokenContract.balanceOf(deployed.l1ProjectManager.address)).to.be.eq(projectInfo.initialTotalSupply)

        })
    });


    describe('# setL2Token', () => {

        it('setL2Token can not be executed by not projectOwner', async () => {

            projectInfo.addressManager = deployed.addressManager.address;
            projectInfo.l2Token = projectInfo.l1Token
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL2Token(
                    projectInfo.projectId,
                    projectInfo.l2Type,
                    projectInfo.addressManager,
                    projectInfo.l2Token
                    )
                ).to.be.revertedWith("caller is not projectOwner.")
        })

        it('setL2Token can be executed by only projectOwner ', async () => {

            await deployed.l1ProjectManager.connect(addr2).setL2Token(
                projectInfo.projectId,
                projectInfo.l2Type,
                projectInfo.addressManager,
                projectInfo.l2Token
                );

            let info = await deployed.l1ProjectManager.projects(projectInfo.projectId);

            expect(info.projectOwner).to.be.eq(projectInfo.projectOwner)
            expect(info.tokenOwner).to.be.eq(projectInfo.tokenOwner)
            expect(info.l1Token).to.be.eq(projectInfo.l1Token)
            expect(info.l2Token).to.be.eq(projectInfo.l2Token)
            expect(info.addressManager).to.be.eq(projectInfo.addressManager)
            expect(info.initialTotalSupply).to.be.eq(projectInfo.initialTotalSupply)
            expect(info.tokenType).to.be.eq(projectInfo.tokenType)
            expect(info.l2Type).to.be.eq(projectInfo.l2Type)
            expect(info.projectName).to.be.eq(projectInfo.projectName)
        })

    });

    describe('# setL2Vaults', () => {
        it('setL2Vaults can not be executed by not projectOwner', async () => {

            projectInfo.addressManager = deployed.addressManager.address;
            projectInfo.l2Token = projectInfo.l1Token
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL2Vaults(
                    projectInfo.projectId,
                    20000
                    )
                ).to.be.revertedWith("caller is not projectOwner.")
        })

        it('setL2Vaults can be executed', async () => {
            const topic = deployed.l1Messenger.interface.getEventTopic('SentMessage');

            const receipt = await (await deployed.l1ProjectManager.connect(addr2).setL2Vaults(
                projectInfo.projectId,
                20000
            )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1Messenger.interface.parseLog(log);

            expect(deployedEvent.args.target).to.be.eq(deployed.l2ProjectManager.address);
            expect(deployedEvent.args.sender).to.be.eq(deployed.l1ProjectManager.address);

            const iL2ProjectManagerAbi = [{
                "inputs": [
                  {
                    "internalType": "string",
                    "name": "_msg",
                    "type": "string"
                  }
                ],
                "name": "hello",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "l2Token",
                    "type": "address"
                  }
                ],
                "name": "balanceOf",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              }];
            let iL2ProjectManager = new ethers.utils.Interface(iL2ProjectManagerAbi);
            let xDomainCalldata = iL2ProjectManager.encodeFunctionData("balanceOf",[projectInfo.l2Token]);
            expect(deployedEvent.args.message).to.be.eq(xDomainCalldata);

        })

    });

    describe('# depositL1TokenToL2', () => {
        it('depositL1TokenToL2 can not be executed by not projectOwner', async () => {

            await expect(
                deployed.l1ProjectManager.connect(addr1).depositL1TokenToL2(
                    projectInfo.projectId,
                    projectInfo.initialTotalSupply,
                    20000
                    )
                ).to.be.revertedWith("caller is not projectOwner.")
        })

        it('depositL1TokenToL2 can be executed', async () => {
            const topic = deployed.l1Bridge.interface.getEventTopic('ERC20DepositInitiated');

            const receipt = await (await deployed.l1ProjectManager.connect(addr2).depositL1TokenToL2(
                projectInfo.projectId,
                projectInfo.initialTotalSupply,
                20000
            )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1Bridge.interface.parseLog(log);

            expect(deployedEvent.args._l1Token).to.be.eq(projectInfo.l1Token);
            expect(deployedEvent.args._l2Token).to.be.eq(projectInfo.l2Token);
            expect(deployedEvent.args._from).to.be.eq(deployed.l1ProjectManager.address);
            expect(deployedEvent.args._to).to.be.eq(deployed.l2ProjectManager.address);
            expect(deployedEvent.args._amount).to.be.eq(projectInfo.initialTotalSupply);
            let projectIdBytes = ethers.utils.solidityPack(
                ["uint256"],
                [projectInfo.projectId]
            );
            expect(deployedEvent.args._data).to.be.eq(projectIdBytes);

        })

    });
});

