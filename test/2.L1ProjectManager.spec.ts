import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures, l2ProjectLaunchFixtures2, l2UniswapInfo } from './shared/fixtures'
import { SetL2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'
import {
    getPublicSaleParams, getInitialLiquidityParams, getLpRewardParams,
    getTosAirdropParams, getTonAirdropParams, getScheduleParams, getNonScheduleParams } from './shared/vaultParameters'

import { ERC20A } from '../typechain-types/contracts/L1/tokens/ERC20A'

import univ3prices from '@thanpolas/univ3prices';

import ERC20AJson from './abi/ERC20A.json'
import L2StandardERC20Json from './abi/L2StandardERC20.json';

const mockL2FactoryFlag = true
describe('L1ProjectManager', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer;
    let deployed: SetL2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string;
    let projectInfo: any;
    let l2TokenContract: any;

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures2(mockL2FactoryFlag)
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })
    describe('# l1ProjectManager  ', () => {
        describe(' setL1TokenFactories', () => {

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

        describe(' setL2Infos', () => {

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
    });

    describe('# L2TokenFactory ', () => {

        describe('# setL2ProjectManager ', () => {

            it('setL2ProjectManager can not be executed by not owner', async () => {
                await expect(
                    deployed.l2TokenFactory.connect(addr1).setL2ProjectManager(
                        deployed.l2ProjectManagerProxy.address
                        )
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })

            it('setL2ProjectManager can be executed by only owner ', async () => {

                await deployed.l2TokenFactory.connect(deployer).setL2ProjectManager(
                    deployed.l2ProjectManagerProxy.address
                )

                expect(await deployed.l2TokenFactory.l2ProjectManager()).to.be.eq(deployed.l2ProjectManagerProxy.address)

            })

            it('setL2ProjectManager cannot be changed to the same value', async () => {
                await expect(
                    deployed.l2TokenFactory.connect(deployer).setL2ProjectManager(
                        deployed.l2ProjectManagerProxy.address
                    )
                ).to.be.revertedWith("same")
            })
        });
    });

    describe('# L2ProjectManager ', () => {

        describe('# setL1ProjectManager ', () => {

            it('setL1ProjectManager can not be executed by not owner', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(addr1).setL1ProjectManager(
                        deployed.l1ProjectManagerProxy.address
                        )
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })

            it('setL1ProjectManager can be executed by only owner ', async () => {

                await deployed.l2ProjectManager.connect(deployer).setL1ProjectManager(
                    deployed.l1ProjectManagerProxy.address
                )

                expect(await deployed.l2ProjectManager.l1ProjectManager()).to.be.eq(deployed.l1ProjectManagerProxy.address)

            })

            it('setL1ProjectManager cannot be changed to the same value', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(deployer).setL1ProjectManager(
                        deployed.l1ProjectManagerProxy.address
                    )
                ).to.be.revertedWith("same")
            })
        });

        describe('# setL2TokenFactory ', () => {

            it('setL2TokenFactory can not be executed by not owner', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(addr1).setL2TokenFactory(
                        deployed.l2ProjectManagerProxy.address
                        )
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })

            it('setL2TokenFactory can be executed by only owner ', async () => {

                await deployed.l2ProjectManager.connect(deployer).setL2TokenFactory(
                    deployed.l2TokenFactory.address
                )

                expect(await deployed.l2ProjectManager.l2TokenFactory()).to.be.eq(deployed.l2TokenFactory.address)

            })

            it('setL2TokenFactory cannot be changed to the same value', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(deployer).setL2TokenFactory(
                        deployed.l2TokenFactory.address
                    )
                ).to.be.revertedWith("same")
            })

        });

        describe('# setL2CrossDomainMessenger ', () => {

            it('setL2CrossDomainMessenger can not be executed by not owner', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(addr1).setL2CrossDomainMessenger(
                        deployed.l2Messenger.address
                        )
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })

            it('setL2CrossDomainMessenger can be executed by only owner ', async () => {

                await deployed.l2ProjectManager.connect(deployer).setL2CrossDomainMessenger(
                    deployed.l2Messenger.address
                )

                expect(await deployed.l2ProjectManager.l2CrossDomainMessenger()).to.be.eq(deployed.l2Messenger.address)

            })

            it('setL2CrossDomainMessenger cannot be changed to the same value', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(deployer).setL2CrossDomainMessenger(
                        deployed.l2Messenger.address
                    )
                ).to.be.revertedWith("same")
            })
        });

        describe('# setTokamakVaults ', () => {

            it('setTokamakVaults can not be executed by not owner', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(addr1).setTokamakVaults(
                        ethers.constants.AddressZero,
                        deployed.initialLiquidityVaultProxy.address,
                        ethers.constants.AddressZero,
                        deployed.airdropTonVault.address,
                        deployed.airdropStosVault.address,
                        deployed.scheduleVaultProxy.address,
                        deployed.nonScheduleVaultProxy.address
                        )
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })

            it('setTokamakVaults can be executed by only owner ', async () => {

                await deployed.l2ProjectManager.connect(deployer).setTokamakVaults(
                    ethers.constants.AddressZero,
                    deployed.initialLiquidityVaultProxy.address,
                    ethers.constants.AddressZero,
                    deployed.airdropTonVault.address,
                    deployed.airdropStosVault.address,
                    deployed.scheduleVaultProxy.address,
                    deployed.nonScheduleVaultProxy.address
                )

                expect(await deployed.l2ProjectManager.initialLiquidityVault()).to.be.eq(deployed.initialLiquidityVaultProxy.address)
                expect(await deployed.l2ProjectManager.scheduleVault()).to.be.eq(deployed.scheduleVaultProxy.address)
                expect(await deployed.l2ProjectManager.nonScheduleVault()).to.be.eq(deployed.nonScheduleVaultProxy.address)
                expect(await deployed.l2ProjectManager.tosAirdropVault()).to.be.eq(deployed.airdropStosVault.address)
                expect(await deployed.l2ProjectManager.tonAirdropVault()).to.be.eq(deployed.airdropTonVault.address)

            })

            // it('setTokamakVaults can set only once', async () => {
            //     await expect(
            //         deployed.l2ProjectManager.connect(deployer).setTokamakVaults(
            //             ethers.constants.AddressZero,
            //             deployed.initialLiquidityVaultProxy.address,
            //             ethers.constants.AddressZero,
            //             deployed.airdropTonVault.address,
            //             deployed.airdropStosVault.address,
            //             deployed.scheduleVaultProxy.address,
            //             deployed.nonScheduleVaultProxy.address
            //         )
            //     ).to.be.revertedWith("already set")
            // })
        });

    });


    describe('# initialLiquidityVault  ', () => {
        describe(' setUniswapInfo ', () => {

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

            it('setUniswapInfo can be executed by only owner ', async () => {

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

            it('setUniswapInfo cannot be changed to the same value', async () => {
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
    });

    describe('# STEP 1. Create Project ', () => {

        it('Anybody can create project', async () => {

            projectInfo = {
                projectId :  ethers.constants.Zero,
                tokenOwner: addr1Address,
                projectOwner: addr2Address,
                initialTotalSupply: ethers.utils.parseEther("120000"),
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
                deployed.addressManager.address,
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

            expect(deployedEvent.args.addressManager).to.eq(deployed.addressManager.address)
            expect(deployedEvent.args.tokenOwner).to.eq(projectInfo.tokenOwner)
            expect(deployedEvent.args.projectName).to.eq(projectInfo.projectName)
            expect(deployedEvent.args.projectOwner).to.eq(projectInfo.projectOwner)
            expect(deployedEvent.args.tokenName).to.eq(projectInfo.tokenName)
            expect(deployedEvent.args.tokenSymbol).to.eq(projectInfo.tokenSymbol)
            expect(deployedEvent.args.initialTotalSupply).to.eq(projectInfo.initialTotalSupply)

            expect(projectInfo.projectId).to.gt(ethers.constants.Zero)
            expect(projectInfo.l1Token).to.not.eq(ethers.constants.AddressZero)

            const tokenContract1 = await ethers.getContractAt(ERC20AJson.abi, projectInfo.l1Token, addr1);
            expect(await tokenContract1.totalSupply()).to.be.eq(projectInfo.initialTotalSupply)
            expect(await tokenContract1.balanceOf(deployed.l1ProjectManager.address)).to.be.eq(projectInfo.initialTotalSupply)

        })
    });

    describe('# STEP 2. Create L2Token ', () => {

        it('Anybody can create L2Token', async () => {

            const topic = deployed.l2TokenFactory.interface.getEventTopic('StandardL2TokenCreated');

            const receipt = await (await deployed.l2TokenFactory.connect(deployer).createL2Token(
                projectInfo.projectOwner,
                projectInfo.l1Token,
                projectInfo.tokenName,
                projectInfo.tokenSymbol,
                projectInfo.projectName,
            )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l2TokenFactory.interface.parseLog(log);
            projectInfo.l2Token = deployedEvent.args.l2Token;

            expect(deployedEvent.args.l1Token).to.be.eq(projectInfo.l1Token)

            let contract = await ethers.getContractAt(
                L2StandardERC20Json.abi, projectInfo.l2Token, deployer);

            if(mockL2FactoryFlag)
                expect(await contract.l2Bridge()).to.be.eq(deployed.l2Bridge.address);

            expect(await contract.l1Token()).to.be.eq(projectInfo.l1Token);

        })

    });

    describe('# distributesL2Token', () => {

        it('Only L1 Project Manager can distribute L2Token', async () => {
            let publicSaleParams =  getPublicSaleParams (
                [0,0,0,0], //tier
                [0,0,0,0], // percentage
                [0,0], //amount
                [0,0], // price saleTokenPrice, payTokenPrice
                0, //hardcapAmount
                0, //changeTOSPercent
                [0,0,0,0,0,0,0],
                0,
                [],
                [],
                );

            let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
            let tosPrice = 1e18;
            let tokenPrice = 10e18;

            let token0Price = tosPrice;
            let token1Price = tokenPrice;

            if(deployed.tosAddress > projectInfo.l2Token) {
                token0Price = tokenPrice;
                token1Price = tosPrice;
            }

            const sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(token0Price, token1Price);
            // const price = univ3prices([18, 18], sqrtPrice).toFixed();

            let initialVaultParams = getInitialLiquidityParams(
                projectInfo.initialTotalSupply,
                tosPrice / 1e18,
                token1Price / 1e18,
                sqrtPrice.toString(),
                sTime,
                3000) ;
            let rewardParams = getLpRewardParams(addr1.address, ethers.constants.AddressZero, 0, 0, 0, 0, 0, 0);
            let tosAirdropParams =  getTosAirdropParams(addr1.address, 0, 0, 0, 0, 0, 0);
            let tonAirdropParams =  getTonAirdropParams(addr1.address, 0, 0, 0, 0, 0, 0);

            let daoParams =  getNonScheduleParams("DAO", addr1.address, BigNumber.from("0"));
            let teamParams =  getScheduleParams(
                "TEAM",
                addr1.address,
                BigNumber.from("0"), //totalAllocatedAmount
                0, // totalClaimCount
                BigNumber.from("0"), //firstClaimAmount
                0, //firstClaimTime
                0, //secondClaimTime
                0 //roundIntervalTime
                );

            let marketingParams =  getScheduleParams(
                "MARKETING",
                addr1.address,
                BigNumber.from("0"), //totalAllocatedAmount
                0, // totalClaimCount
                BigNumber.from("0"), //firstClaimAmount
                0, //firstClaimTime
                0, //secondClaimTime
                0 //roundIntervalTime
                );

            let tokamakVaults = {
                publicSaleParams: publicSaleParams,
                initialVaultParams : initialVaultParams,
                rewardParams: rewardParams,
                tosAirdropParams: tosAirdropParams,
                tonAirdropParams: tonAirdropParams
            }

            let customScheduleVaults = [teamParams, marketingParams]
            let customNonScheduleVaults = [daoParams]

            await expect(
                deployed.l1ProjectManager.connect(addr1).launchProject(
                    projectInfo.projectId,
                    projectInfo.l2Token,
                    projectInfo.initialTotalSupply,
                    tokamakVaults,
                    customScheduleVaults,
                    customNonScheduleVaults
                    )
                ).to.be.revertedWith("caller is not projectOwner.")
        });


        it('Only L1 Project Manager can distribute L2Token', async () => {
            let initialLiquidityAmount = projectInfo.initialTotalSupply.div(BigNumber.from("6"))
            let daoAmount = initialLiquidityAmount
            let teamAmount = initialLiquidityAmount
            let marketingAmount = initialLiquidityAmount
            let airdropStosAmount = initialLiquidityAmount
            let airdropTonAmount = initialLiquidityAmount

            let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
            let firstClaimTime = sTime
            let totalClaimCount = 4
            let firstClaimAmount = teamAmount.div(BigNumber.from("4"))
            let roundIntervalTime = 60*60*24*7;
            let secondClaimTime =  firstClaimTime + roundIntervalTime

            let publicSaleParams =  getPublicSaleParams (
                [0,0,0,0], //tier
                [0,0,0,0], // percentage
                [0,0], //amount
                [0,0], // price saleTokenPrice, payTokenPrice
                0, //hardcapAmount
                0, //changeTOSPercent
                [0,0,0,0,0,0,0],
                0,
                [],
                [],
                );


            let tosPrice = 1e18;
            let tokenPrice = 10e18;

            let token0Price = tosPrice;
            let token1Price = tokenPrice;

            if(deployed.tosAddress > projectInfo.l2Token) {
                token0Price = tokenPrice;
                token1Price = tosPrice;
            }

            const sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(token0Price, token1Price);
            // const price = univ3prices([18, 18], sqrtPrice).toFixed();

            let initialVaultParams = getInitialLiquidityParams(
                initialLiquidityAmount,
                tosPrice / 1e18,
                token1Price / 1e18,
                sqrtPrice.toString(),
                sTime,
                3000) ;

            let rewardParams = getLpRewardParams(addr1.address, ethers.constants.AddressZero, 0, 0, 0, 0, 0, 0);

            let tosAirdropParams =  getTosAirdropParams(
                ethers.constants.AddressZero,
                airdropStosAmount,
                totalClaimCount,
                firstClaimAmount, //firstClaimAmount
                firstClaimTime, //firstClaimTime
                secondClaimTime, //secondClaimTime
                roundIntervalTime //roundIntervalTime
                );

            let tonAirdropParams =  getTonAirdropParams(
                ethers.constants.AddressZero,
                airdropTonAmount,
                totalClaimCount,
                firstClaimAmount, //firstClaimAmount
                firstClaimTime, //firstClaimTime
                secondClaimTime, //secondClaimTime
                roundIntervalTime //roundIntervalTime
                );

            let daoParams =  getNonScheduleParams("DAO", addr1.address, daoAmount);

            let teamParams =  getScheduleParams(
                "TEAM",
                addr1.address,
                teamAmount, //totalAllocatedAmount
                totalClaimCount, // totalClaimCount
                firstClaimAmount, //firstClaimAmount
                firstClaimTime, //firstClaimTime
                secondClaimTime, //secondClaimTime
                roundIntervalTime //roundIntervalTime
                );

            let marketingParams =  getScheduleParams(
                "MARKETING",
                addr1.address,
                marketingAmount, //totalAllocatedAmount
                totalClaimCount, // totalClaimCount 4
                firstClaimAmount, //firstClaimAmount
                firstClaimTime, //firstClaimTime
                secondClaimTime, //secondClaimTime
                roundIntervalTime //roundIntervalTime
                );

            let tokamakVaults = {
                publicSaleParams: publicSaleParams,
                initialVaultParams : initialVaultParams,
                rewardParams: rewardParams,
                tosAirdropParams: tosAirdropParams,
                tonAirdropParams: tonAirdropParams
            }
            // console.log('tokamakVaults' ,tokamakVaults )
            let customScheduleVaults = [teamParams, marketingParams]
            let customNonScheduleVaults = [daoParams]
            // console.log('customScheduleVaults' ,customScheduleVaults )
            // console.log('customNonScheduleVaults' ,customNonScheduleVaults )
            const receipt = await (await deployed.l1ProjectManager.connect(addr2).launchProject(
                    projectInfo.projectId,
                    projectInfo.l2Token,
                    projectInfo.initialTotalSupply,
                    tokamakVaults,
                    customScheduleVaults,
                    customNonScheduleVaults
                    )).wait();

            //--------------------------
            const topic = deployed.l1ProjectManager.interface.getEventTopic('LaunchedProject');
            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1ProjectManager.interface.parseLog(log);

            expect(deployedEvent.args.projectId).to.be.eq(projectInfo.projectId)
            expect(deployedEvent.args.l1Token).to.be.eq(projectInfo.l1Token)
            expect(deployedEvent.args.l2Token).to.be.eq(projectInfo.l2Token)
            expect(deployedEvent.args.totalAmount).to.be.eq(projectInfo.initialTotalSupply)


            let l2TokenContract = await ethers.getContractAt(
                L2StandardERC20Json.abi, deployedEvent.args.l2Token, deployer);

            expect(
                await l2TokenContract.balanceOf(deployed.initialLiquidityVaultProxy.address))
                .to.be.eq(initialLiquidityAmount)
            expect(
                await l2TokenContract.balanceOf(deployed.airdropStosVaultProxy.address))
                .to.be.eq(airdropStosAmount)
            //--------------------------

            const topic1 = deployed.l2ProjectManager.interface.getEventTopic('DistributedL2Token');
            const log1 = receipt.logs.find(x => x.topics.indexOf(topic1) >= 0);
            const deployedEvent1 = deployed.l2ProjectManager.interface.parseLog(log1);
            expect(deployedEvent1.args.projectId).to.be.eq(projectInfo.projectId)
            expect(deployedEvent1.args.l1Token).to.be.eq(projectInfo.l1Token)
            expect(deployedEvent1.args.l2Token).to.be.eq(projectInfo.l2Token)
            expect(deployedEvent1.args.totalAmount).to.be.eq(projectInfo.initialTotalSupply)

            let project = await deployed.l2ProjectManager.viewProject(projectInfo.l2Token)
            expect(project.projectId).to.be.eq(projectInfo.projectId)
            expect(project.l1Token).to.be.eq(projectInfo.l1Token)
            expect(project.l2Token).to.be.eq(projectInfo.l2Token)
            expect(project.projectOwner).to.be.eq(projectInfo.projectOwner)

            //-----------------------------
            // vault check
            let initialLiquidityVault = await deployed.initialLiquidityVault.viewVaultInfo(projectInfo.l2Token)

            expect(initialLiquidityVault.totalAllocatedAmount).to.be.eq(initialLiquidityAmount)
            expect(initialLiquidityVault.initialTosPrice.mul(ethers.utils.parseEther("1"))).to.be.eq(BigNumber.from(""+tosPrice))
            expect(initialLiquidityVault.initialTokenPrice.mul(ethers.utils.parseEther("1"))).to.be.eq(BigNumber.from(""+tokenPrice))
            expect(initialLiquidityVault.startTime).to.be.eq(sTime)
            expect(initialLiquidityVault.initSqrtPriceX96.toString()).to.be.eq(sqrtPrice.toString())
            expect(initialLiquidityVault.fee).to.be.eq(3000)
            expect(initialLiquidityVault.boolReadyToCreatePool).to.be.eq(false)


        });

    });

});

