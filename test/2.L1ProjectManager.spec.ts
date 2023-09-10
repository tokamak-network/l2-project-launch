import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures, l2ProjectLaunchFixtures2, l2UniswapInfo } from './shared/fixtures'
import { SetL2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'

import snapshotGasCost from './shared/snapshotGasCost'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
import ERC20C from './abi/ERC20C.json'
import ERC20D from './abi/ERC20D.json'

describe('L1ProjectManager', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: SetL2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string;
    let projectInfo: any;

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures2()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })

    describe('# l1ProjectManager setL1TokenFactories', () => {

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

    describe('# l1ProjectManager setL2Infos', () => {

        it('setL2Infos can not be executed by not owner', async () => {
            await expect(
                deployed.l1ProjectManager.connect(addr1).setL2Infos(
                    0,
                    deployed.l2TokenFactory.address,
                    deployed.l2ProjectManager.address,
                    20000,
                    20000
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2Infos can be executed by only owner ', async () => {

            await deployed.l1ProjectManager.connect(deployer).setL2Infos(
                0,
                deployed.l2TokenFactory.address,
                deployed.l2ProjectManager.address,
                20000,
                20000
            )
            let l2Info = await deployed.l1ProjectManager.viewL2Info(0);

            expect(l2Info.l2TokenFactory).to.eq(deployed.l2TokenFactory.address)
            expect(l2Info.l2ProjectManager).to.eq(deployed.l2ProjectManager.address)
            expect(l2Info.depositMinGasLimit).to.eq(20000)
            expect(l2Info.sendMsgMinGasLimit).to.eq(20000)

        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.l1ProjectManager.connect(deployer).setL2Infos(
                    0,
                    deployed.l2TokenFactory.address,
                    deployed.l2ProjectManager.address,
                    20000,
                    20000
                )
            ).to.be.revertedWith("same")
        })
    });

    describe('# initialLiquidityVault setUniswapInfo ', () => {

        it('setUniswapInfo can not be executed by not owner', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(addr1).setUniswapInfo(
                    l2UniswapInfo.uniswapV3Factory,
                    l2UniswapInfo.npm,
                    l2UniswapInfo.ton,
                    l2UniswapInfo.tos
                    )
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2Infos can be executed by only owner ', async () => {

            await deployed.initialLiquidityVault.connect(deployer).setUniswapInfo(
                l2UniswapInfo.uniswapV3Factory,
                l2UniswapInfo.npm,
                l2UniswapInfo.ton,
                l2UniswapInfo.tos
            )

            expect(await deployed.initialLiquidityVault.uniswapV3Factory()).to.be.eq(l2UniswapInfo.uniswapV3Factory)
            expect(await deployed.initialLiquidityVault.nonfungiblePositionManager()).to.be.eq(l2UniswapInfo.npm)
            expect(await deployed.initialLiquidityVault.ton()).to.be.eq(l2UniswapInfo.ton)
            expect(await deployed.initialLiquidityVault.tos()).to.be.eq(l2UniswapInfo.tos)

        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.initialLiquidityVault.connect(deployer).setUniswapInfo(
                    l2UniswapInfo.uniswapV3Factory,
                    l2UniswapInfo.npm,
                    l2UniswapInfo.ton,
                    l2UniswapInfo.tos
                )
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

    describe('# launchProject', () => {

        it('Only project Manager can launch project', async () => {

        });

    });

});

