import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { Signer, BigNumber} from 'ethers'
import { l2ProjectLaunchFixtures, l2ProjectLaunchFixtures2, l2UniswapInfo } from './shared/fixtures'
import { SetL2ProjectLaunchFixture, ProjectInfo } from './shared/fixtureInterfaces'

// import snapshotGasCost from './shared/snapshotGasCost'
import univ3prices from '@thanpolas/univ3prices';

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
import ERC20C from './abi/ERC20C.json'
import ERC20D from './abi/ERC20D.json'

function getPublicSaleParams (
    tier:Array<number>,
    percents:Array<number>,
    saleAmount:Array<number>,
    price:Array<number>,
    hardcapAmount: number,
    changeTOSPercent:number,
    times:Array<number>,
    claimCounts: number,
    claimTimes: Array<number>,
    claimPercents: Array<number>,
    )
{
    let InitalParameterPublicSaleVault = {
         stosTier1: ethers.BigNumber.from(""+tier[0]),
         stosTier2: ethers.BigNumber.from(""+tier[1]),
         stosTier3: ethers.BigNumber.from(""+tier[2]),
         stosTier4: ethers.BigNumber.from(""+tier[3]),
         tier1Percents: ethers.BigNumber.from(""+percents[0]),
         tier2Percents: ethers.BigNumber.from(""+percents[1]),
         tier3Percents: ethers.BigNumber.from(""+percents[2]),
         tier4Percents: ethers.BigNumber.from(""+percents[3]),
         total1roundSaleAmount: ethers.BigNumber.from(""+saleAmount[0]),
         total2roundSaleAmount: ethers.BigNumber.from(""+saleAmount[1]),
         saleTokenPrice: ethers.BigNumber.from(""+price[0]),
         payTokenPrice: ethers.BigNumber.from(""+price[1]),
         hardcapAmount: ethers.BigNumber.from(""+hardcapAmount),
         changeTOSPercent: ethers.BigNumber.from(""+changeTOSPercent),
         startWhiteTime: ethers.BigNumber.from(""+times[0]),
         endWhiteTime: ethers.BigNumber.from(""+times[1]),
         start1roundTime: ethers.BigNumber.from(""+times[2]),
         end1roundTime: ethers.BigNumber.from(""+times[3]),
         snapshotTime: ethers.BigNumber.from(""+times[4]),
         start2roundTime: ethers.BigNumber.from(""+times[5]),
         end2roundTime: ethers.BigNumber.from(""+times[6]),
         claimCounts: ethers.BigNumber.from(""+claimCounts),
    }

    type claimInterface = {
        claimTimes: Array<BigNumber>,
        claimPercents:  Array<BigNumber>
    }

    let InitalParameterPublicSaleClaim:claimInterface = {
        claimTimes: [],
        claimPercents: []
    }

    for(let i = 0; i < claimCounts ; i++){
        InitalParameterPublicSaleClaim.claimTimes.push(ethers.BigNumber.from(""+claimTimes[i]));
        InitalParameterPublicSaleClaim.claimPercents.push(ethers.BigNumber.from(""+claimPercents[i]));
    }

    return {
        vaultParams: InitalParameterPublicSaleVault,
        claimParams: InitalParameterPublicSaleClaim
    }
}

function getInitialLiquidityParams (
    totalAmount:number,
    tosPrice:number,
    tokenPrice:number,
    price:string,
    startTime:number,
    fee:number )
{
    return  {
        totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
        tosPrice: ethers.BigNumber.from(""+tosPrice),
        tokenPrice: ethers.BigNumber.from(""+tokenPrice),
        initSqrtPrice: ethers.BigNumber.from(price),
        startTime:  ethers.BigNumber.from(""+startTime),
        fee: fee
    };
}

function getLpRewardParams (
    poolAddress: string,
    totalAmount:number,
    totalClaimCount:number,
    firstClaimAmount:number,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number )
{
    return  {
        poolAddress: poolAddress,
        params : {
            totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: ethers.BigNumber.from(""+firstClaimAmount),
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
        }
    };
}

function getTosAirdropParams (
    totalAmount:number,
    totalClaimCount:number,
    firstClaimAmount:number,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number )
{
    return  {
            totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: ethers.BigNumber.from(""+firstClaimAmount),
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
    };
}

function getTonAirdropParams (
    totalAmount:number,
    totalClaimCount:number,
    firstClaimAmount:number,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number )
{
    return  {
            totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: ethers.BigNumber.from(""+firstClaimAmount),
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
    };
}

function getScheduleParams (
    name: string,
    totalAmount:number,
    totalClaimCount:number,
    firstClaimAmount:number,
    firstClaimTime:number,
    secondClaimTime:number,
    roundIntervalTime:number )
{
    return  {
        vaultName: name,
        params: {
            totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount),
            totalClaimCount: ethers.BigNumber.from(""+totalClaimCount),
            firstClaimAmount: ethers.BigNumber.from(""+firstClaimAmount),
            firstClaimTime: firstClaimTime,
            secondClaimTime: secondClaimTime,
            roundIntervalTime: roundIntervalTime
        }
    }
}

function getNonScheduleParams (
    name: string,
    totalAmount:number )
{
    return  {
        vaultName: name,
        totalAllocatedAmount: ethers.BigNumber.from(""+totalAmount)
    }
}

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
                        ethers.constants.AddressZero,
                        ethers.constants.AddressZero,
                        deployed.scheduleVaultProxy.address,
                        deployed.nonScheduleVaultBProxy.address
                        )
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })

            it('setTokamakVaults can be executed by only owner ', async () => {

                await deployed.l2ProjectManager.connect(deployer).setTokamakVaults(
                    ethers.constants.AddressZero,
                    deployed.initialLiquidityVaultProxy.address,
                    ethers.constants.AddressZero,
                    ethers.constants.AddressZero,
                    ethers.constants.AddressZero,
                    deployed.scheduleVaultProxy.address,
                    deployed.nonScheduleVaultBProxy.address
                )

                expect(await deployed.l2ProjectManager.initialLiquidityVault()).to.be.eq(deployed.initialLiquidityVaultProxy.address)
                expect(await deployed.l2ProjectManager.scheduleVault()).to.be.eq(deployed.scheduleVaultProxy.address)
                expect(await deployed.l2ProjectManager.nonScheduleVault()).to.be.eq(deployed.nonScheduleVaultBProxy.address)

            })

            it('setTokamakVaults can set only once', async () => {
                await expect(
                    deployed.l2ProjectManager.connect(deployer).setTokamakVaults(
                        ethers.constants.AddressZero,
                        deployed.initialLiquidityVaultProxy.address,
                        ethers.constants.AddressZero,
                        ethers.constants.AddressZero,
                        ethers.constants.AddressZero,
                        deployed.scheduleVaultProxy.address,
                        deployed.nonScheduleVaultBProxy.address
                    )
                ).to.be.revertedWith("already set")
            })
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

            const tokenContract = await ethers.getContractAt(ERC20A.abi, projectInfo.l1Token, addr1);
            expect(await tokenContract.totalSupply()).to.be.eq(projectInfo.initialTotalSupply)
            expect(await tokenContract.balanceOf(deployed.l1ProjectManager.address)).to.be.eq(projectInfo.initialTotalSupply)

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
            let rewardParams = getLpRewardParams(ethers.constants.AddressZero, 0, 0, 0, 0, 0, 0);
            let tosAirdropParams =  getTosAirdropParams(0, 0, 0, 0, 0, 0);
            let tonAirdropParams =  getTonAirdropParams(0, 0, 0, 0, 0, 0);

            let daoParams =  getNonScheduleParams("DAO", 0);
            let teamParams =  getScheduleParams(
                "TEAM",
                0, //totalAllocatedAmount
                0, // totalClaimCount
                0, //firstClaimAmount
                0, //firstClaimTime
                0, //secondClaimTime
                0 //roundIntervalTime
                );

            let marketingParams =  getScheduleParams(
                "MARKETING",
                0, //totalAllocatedAmount
                0, // totalClaimCount
                0, //firstClaimAmount
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

            // await expect(
            //     deployed.l1ProjectManager.connect(addr1).launchProject(
            //         projectInfo.projectId,
            //         projectInfo.l2Token,
            //         projectInfo.initialTotalSupply,
            //         tokamakVaults,
            //         customScheduleVaults,
            //         customNonScheduleVaults
            //         )
            //     ).to.be.revertedWith("caller is not projectOwner")

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
            let rewardParams = getLpRewardParams(ethers.constants.AddressZero, 0, 0, 0, 0, 0, 0);
            let tosAirdropParams =  getTosAirdropParams(0, 0, 0, 0, 0, 0);
            let tonAirdropParams =  getTonAirdropParams(0, 0, 0, 0, 0, 0);

            let tokamakVaults = {
                publicSaleParams: publicSaleParams,
                initialVaultParams : initialVaultParams,
                rewardParams: rewardParams,
                tosAirdropParams: tosAirdropParams,
                tonAirdropParams: tonAirdropParams
            }

            let customScheduleVaults = [{}]
            let customNonScheduleVaults = [{}]

            // await expect(
            //     deployed.l1ProjectManager.connect(addr1).launchProject(
            //         projectInfo.projectId,
            //         projectInfo.l2Token,
            //         projectInfo.initialTotalSupply,
            //         tokamakVaults,
            //         customScheduleVaults,
            //         customNonScheduleVaults
            //         )
            //     ).to.be.revertedWith("caller is not projectOwner")

            const topic = deployed.l1ProjectManager.interface.getEventTopic('LaunchedProject');

            const receipt = await (await deployed.l1ProjectManager.connect(addr2).launchProject(
                    projectInfo.projectId,
                    projectInfo.l2Token,
                    projectInfo.initialTotalSupply,
                    tokamakVaults
                    )).wait();

            const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
            const deployedEvent = deployed.l1ProjectManager.interface.parseLog(log);

            expect(deployedEvent.args.projectId).to.be.eq(projectInfo.projectId)
            expect(deployedEvent.args.l1Token).to.be.eq(projectInfo.l1Token)
            expect(deployedEvent.args.l2Token).to.be.eq(projectInfo.l2Token)
            expect(deployedEvent.args.totalAmount).to.be.eq(projectInfo.initialTotalSupply)

        });

    });

});

