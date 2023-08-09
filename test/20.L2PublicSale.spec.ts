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

describe('L2TokenFactory', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: L2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string;
    let projectInfo: any;

    let l2ProjectManager: Signer
    let l2ProjectManagerAddresss: string
    
    let vestingFund: Signer
    let vestingFundAddress: string

    let l2vaultAdmin: Signer
    let l2vaultAdminAddress: string

    let erc20Atoken: any;

    //mainnet
    let quoter = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
    let uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    let tos = "0x409c4D8cd5d2924b9bc5509230d16a61289c8153"
    let ton = "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5"

    let minPer = 5;
    let maxPer = 10;

    let standardTier1 = 100;
    let standardTier2 = 300;
    let standardTier3 = 1000;
    let standardTier4 = 4000;
    
    let delayTime = 600;

    let changeTOS = 10;

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        l2ProjectManager = deployed.l2ProjectManagerAddr;
        vestingFund = deployed.vestingFundAddr;
        l2vaultAdmin = deployed.l2VaultAdmin;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
        l2ProjectManagerAddresss = await l2ProjectManager.getAddress();
        vestingFundAddress = await vestingFund.getAddress();
        l2vaultAdminAddress = await l2vaultAdmin.getAddress();
    })

    describe('# setL2ProjectManager', () => {
        it('setL2ProjectManager can not be executed by not owner', async () => {
            await expect(
                deployed.l2TokenFactory.connect(addr1).setL2ProjectManager(deployed.l2ProjectManager.address)
                ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setL2ProjectManager can be executed by only owner ', async () => {
            await deployed.l2TokenFactory.connect(deployer).setL2ProjectManager(deployed.l2ProjectManager.address)
            expect(await deployed.l2TokenFactory.l2ProjectManager()).to.eq(deployed.l2ProjectManager.address)
        })

        it('cannot be changed to the same value', async () => {
            await expect(
                deployed.l2TokenFactory.connect(deployer).setL2ProjectManager(deployed.l2ProjectManager.address)
                ).to.be.revertedWith("same")
        })
    });

    describe('# createL2Token', () => {
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
            
            erc20Atoken = await ethers.getContractAt(ERC20A.abi, projectInfo.l1Token, addr1);
            let tx = await erc20Atoken.balanceOf(addr1Address)
            console.log(tx);

            expect(deployedEvent.args.contractAddress).to.not.eq(ethers.constants.AddressZero);
            expect(deployedEvent.args.name).to.eq(projectInfo.tokenName);
            expect(deployedEvent.args.symbol).to.eq(projectInfo.tokenSymbol);
            expect(deployedEvent.args.initialSupply).to.eq(projectInfo.initialTotalSupply);
            expect(deployedEvent.args.to).to.eq(projectInfo.tokenOwner);
        });

        it('createL2Token is failed if it didn\'t set L2TokenFactory in L2ProjectManager.', async () => {
            await expect(deployed.l2TokenFactory.connect(deployer).createL2Token(
                projectInfo.projectOwner,
                projectInfo.l1Token,
                projectInfo.tokenName,
                projectInfo.tokenSymbol,
                projectInfo.projectName
            )).to.be.revertedWith("caller is not l2TokenFactory");
        });

        it('L2ProjectManager: setL2TokenFactory ', async () => {
            await deployed.l2ProjectManager.connect(deployer).setL2TokenFactory(deployed.l2TokenFactory.address)
            expect(await deployed.l2ProjectManager.l2TokenFactory()).to.eq(deployed.l2TokenFactory.address)
        });

        it('Anyone can create L2Token', async () => {
            const topic = deployed.l2TokenFactory.interface.getEventTopic('StandardL2TokenCreated');
            const receipt = await (await deployed.l2TokenFactory.connect(addr1).createL2Token(
                projectInfo.projectOwner,
                projectInfo.l1Token,
                projectInfo.tokenName,
                projectInfo.tokenSymbol,
                projectInfo.projectName
            )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l2TokenFactory.interface.parseLog(log);
            projectInfo.l2Token = deployedEvent.args.l2Token;

            expect(deployedEvent.args.l1Token).to.eq(projectInfo.l1Token)
            expect(projectInfo.l2Token).to.not.eq(ethers.constants.AddressZero)

            const tokenContract = await ethers.getContractAt(L2StandardERC20.abi, projectInfo.l2Token, addr1);
            expect(await tokenContract.totalSupply()).to.be.eq(ethers.constants.Zero)
            expect(await tokenContract.name()).to.be.eq(projectInfo.tokenName)
            expect(await tokenContract.symbol()).to.be.eq(projectInfo.tokenSymbol)

            const addProject = await deployed.l2ProjectManager.projects(projectInfo.l2Token)
            expect(addProject[0]).to.be.eq(projectInfo.projectOwner);
            expect(addProject[1]).to.be.eq(projectInfo.l1Token);
            expect(addProject[2]).to.be.eq(projectInfo.l2Token);
            expect(addProject[3]).to.be.eq(projectInfo.projectName);
        })

    });

    describe("# setL2PublicSale L2ProjectManager", () => {
        describe("# set L2ProjectManager", () => {
            it('setL2ProjectManager can not be executed by not owner', async () => {
                await expect(
                    deployed.l2PublicProxy.connect(addr1).setL2ProjectManager(l2ProjectManagerAddresss)
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })
    
            it('setL2ProjectManager can be executed by only owner ', async () => {
                await deployed.l2PublicProxy.connect(deployer).setL2ProjectManager(l2ProjectManagerAddresss)
                expect(await deployed.l2PublicProxy.l2ProjectManager()).to.eq(l2ProjectManagerAddresss)
            })
    
            it('cannot be changed to the same value', async () => {
                await expect(
                    deployed.l2PublicProxy.connect(deployer).setL2ProjectManager(l2ProjectManagerAddresss)
                    ).to.be.revertedWith("same")
            })
        })

        describe("# set PublicSale basic value", () => {
            it("set initialize can not executed by not owner", async () => {
                await expect(
                    deployed.l2PublicProxy.connect(addr1).initialize(
                        [
                            quoter,
                            vestingFundAddress,
                            deployed.l2LiquidityProxy.address,
                            uniswapRouter,
                            uniswapRouter,
                            tos,
                            ton
                        ],
                        minPer,
                        maxPer,
                        standardTier1,
                        standardTier2,
                        standardTier3,
                        standardTier4,
                        delayTime
                    )).to.be.revertedWith("caller is not l2ProjectManager")
            })

            it('set initialize can be executed by only ProjectManager ', async () => {
                await deployed.l2PublicProxy.connect(l2ProjectManager).initialize(
                    [
                        quoter,
                        vestingFundAddress,
                        deployed.l2LiquidityProxy.address,
                        uniswapRouter,
                        uniswapRouter,
                        tos,
                        ton
                    ],
                    minPer,
                    maxPer,
                    standardTier1,
                    standardTier2,
                    standardTier3,
                    standardTier4,
                    delayTime
                )
                expect(await deployed.l2PublicProxy.quoter()).to.eq(quoter)
                expect(await deployed.l2PublicProxy.vestingFund()).to.eq(vestingFundAddress)
                expect(await deployed.l2PublicProxy.liquidityVault()).to.eq(deployed.l2LiquidityProxy.address)
                expect(await deployed.l2PublicProxy.uniswapRouter()).to.eq(uniswapRouter)
                expect(await deployed.l2PublicProxy.lockTOS()).to.eq(uniswapRouter)
                expect(await deployed.l2PublicProxy.tos()).to.eq(tos)
                expect(await deployed.l2PublicProxy.ton()).to.eq(ton)
                expect(await deployed.l2PublicProxy.minPer()).to.eq(minPer)
                expect(await deployed.l2PublicProxy.maxPer()).to.eq(maxPer)
                expect(await deployed.l2PublicProxy.stanTier1()).to.eq(standardTier1)
                expect(await deployed.l2PublicProxy.stanTier2()).to.eq(standardTier2)
                expect(await deployed.l2PublicProxy.stanTier3()).to.eq(standardTier3)
                expect(await deployed.l2PublicProxy.stanTier4()).to.eq(standardTier4)
                expect(await deployed.l2PublicProxy.delayTime()).to.eq(delayTime)
            })
        })

        describe("# setVaultAdmin", () => {
            it('setVaultAdmin can not be executed by not owner', async () => {
                await expect(
                    deployed.l2PublicProxy.connect(addr1).setVaultAdmin(
                        erc20Atoken.address,
                        l2vaultAdminAddress
                        )
                    ).to.be.revertedWith("caller is not l2ProjectManager")
            })
    
            it('setVaultAdmin can be executed by only owner ', async () => {
                await deployed.l2PublicProxy.connect(l2ProjectManager).setVaultAdmin(
                    erc20Atoken.address,
                    l2vaultAdminAddress
                )
                expect(await deployed.l2PublicProxy.l2ProjectManager()).to.eq(l2ProjectManagerAddresss)
            })
    
            it('cannot be changed to the same value', async () => {
                await expect(
                    deployed.l2PublicProxy.connect(l2ProjectManager).setVaultAdmin(
                        erc20Atoken.address,
                        l2vaultAdminAddress
                    )
                    ).to.be.revertedWith("same")
            })
        })
    })

    describe("# setL2PublicSaleVault L2VaultAdmin", () => {
        
    })
});

