import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { BigNumber, Signer } from 'ethers'
import { l2ProjectLaunchFixtures, l1Fixtures } from './shared/fixtures'
import { L2ProjectLaunchFixture, L1Fixture } from './shared/fixtureInterfaces'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
import ERC20C from './abi/ERC20C.json'
import ERC20D from './abi/ERC20D.json'
import L2StandardERC20 from './abi/L2StandardERC20.json'
import snapshotGasCost from './shared/snapshotGasCost'

import { time } from "@nomicfoundation/hardhat-network-helpers";

const TON_ABI = require("../abis/TON.json");
const TOS_ABI = require("../abis/TOS.json");

describe('L2TokenFactory', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer, addr3: Signer, addr4: Signer, addr5: Signer;
    let deployed: L2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string, addr3Address: string, addr4Address: string, addr5Address: string;
    let projectInfo: any;

    let l1deployed: L1Fixture
    let lockTOS: any;
    let tosContract: any;
    let tonContract: any;

    let l2ProjectManager: Signer
    let l2ProjectManagerAddresss: string
    
    let vestingFund: Signer
    let vestingFundAddress: string

    let l2vaultAdmin: Signer
    let l2vaultAdminAddress: string

    let erc20Atoken: any;

    let tier1Amount: BigNumber;

    //mainnet
    let quoter = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
    let uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    let tos = "0x409c4D8cd5d2924b9bc5509230d16a61289c8153"
    let ton = "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5"

    //goerli
    // let tos = "0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9"
    // let ton = "0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00"

    let minPer = 5;
    let maxPer = 10;

    let standardTier1 = 100;
    let standardTier2 = 200;
    let standardTier3 = 1000;
    let standardTier4 = 4000;
    
    let delayTime = 600;

    let settingTier1 = 100;
    let settingTier2 = 200;
    let settingTier3 = 1000;
    let settingTier4 = 4000;

    let settingTierPercent1 = 600;
    let settingTierPercent2 = 1200;
    let settingTierPercent3 = 2200;
    let settingTierPercent4 = 6000;

    let round1SaleAmount = ethers.utils.parseUnits("50000", 18);
    let round2SaleAmount = ethers.utils.parseUnits("50000", 18);

    let saleTokenPrice = 200;
    let tonTokenPrice = 2000;
    
    let hardcapAmount = ethers.utils.parseUnits("100", 18);
    let changeTick = 18;
    let changeTOS = 10;

    let setSnapshot: any;
    let whitelistStartTime: any, whitelistEndTime: any;
    let round1StartTime: any, round1EndTime: any;
    let round2StartTime: any, round2EndTime: any;
    
    let claimTime1: any, claimTime2: any, claimTime3: any, claimTime4: any, claimTime5: any
    let claimPercent1 = 3000;
    let claimPercent2 = 2000;
    let claimPercent3 = 2000;
    let claimPercent4 = 2000;
    let claimPercent5 = 1000;

    let realclaimPercents1 = 3000;
    let realclaimPercents2 = 5000;
    let realclaimPercents3 = 7000;
    let realclaimPercents4 = 9000;
    let realclaimPercents5 = 10000;

    let totalclaimCounts = 5;

    let blockTime: any;

    let tosAmount = 100000000000;

    let addr1lockTOSIds: any[] = [];
    let addr2lockTOSIds: any[] = [];
    let addr3lockTOSIds: any[] = [];
    let addr4lockTOSIds: any[] = [];
    let addr5lockTOSIds: any[] = [];

    let round1addr1Amount: any;
    let round1addr2Amount: any;
    let round1addr3Amount: any;
    let round1addr4Amount: any;
    let round1addr5Amount: any;

    let round2Amount: any;

    let contractHaveTON = ethers.utils.parseUnits("10000", 18);

    let refundTONAmount = ethers.utils.parseUnits("1000", 18);

    //goerli
    // let testAccount = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea"

    //mainnet
    let testAccount = "0x156DD25d342a6B63874333985140aA3103bf1Ff0"
    let testAccount2 = "0x70115ba3b49D60776AaA2976ADffB5CfABf31689"
    let richTON: Signer;
    let richTOS: Signer;

    before('create fixture loader', async () => {
        deployed = await l2ProjectLaunchFixtures()
        deployer = deployed.deployer;
        addr1 = deployed.addr1;
        addr2 = deployed.addr2;
        addr3 = deployed.addr3;
        addr4 = deployed.addr4;
        addr5 = deployed.addr5;
        l2ProjectManager = deployed.l2ProjectManagerAddr;
        vestingFund = deployed.vestingFundAddr;
        l2vaultAdmin = deployed.l2VaultAdmin;

        l1deployed = await l1Fixtures()
        lockTOS = l1deployed.lockTOS;
        tosContract = l1deployed.tos;
        tonContract = l1deployed.ton;

        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
        addr3Address = await addr3.getAddress();
        addr4Address = await addr4.getAddress();
        addr5Address = await addr5.getAddress();
        l2ProjectManagerAddresss = await l2ProjectManager.getAddress();
        vestingFundAddress = await vestingFund.getAddress();
        l2vaultAdminAddress = await l2vaultAdmin.getAddress();

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [testAccount],
        });

        richTON = await ethers.getSigner(testAccount);        //ton주인

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [testAccount2],
        });

        richTOS = await ethers.getSigner(testAccount2);        //ton주인
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
            // console.log(tx);
            await erc20Atoken.connect(addr1).transfer(l2vaultAdminAddress,tx);

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

    describe("# set TOS", () => {
        it("setting the TOS Contract", async () => {
            tosContract = await ethers.getContractAt(TOS_ABI.abi, tos, deployer)
        })

        it("transfer TOS", async () => {
            let transferTOS = ethers.utils.parseUnits("1000", 18);
            let tx = await tosContract.balanceOf(richTOS.address);
            console.log(tx)
            await tosContract.connect(richTOS).transfer(addr1Address,transferTOS)
            await tosContract.connect(richTOS).transfer(addr2Address,transferTOS)
        })
    })

    describe("# initialize lockTOS", () => {
        it("initialize lockTOS", async () => {
            const lockTosInitializeIfo = {
                epochUnit: ethers.BigNumber.from("604800"),
                maxTime: ethers.BigNumber.from("94348800")
            }

            await (await lockTOS.connect(deployer).initialize(
                tosContract.address,
                lockTosInitializeIfo.epochUnit,
                lockTosInitializeIfo.maxTime
            )).wait()
        })
    })

    describe("# set TON", () => {
        it("setting the TON Contract", async () => {
            tonContract = await ethers.getContractAt(TON_ABI.abi, ton, deployer)
        })

        it("transfer TON", async () => {
            let transferTON = ethers.utils.parseUnits("5000", 18);
            await tonContract.connect(richTON).transfer(addr1Address,transferTON)
            await tonContract.connect(richTON).transfer(addr2Address,transferTON)
            await tonContract.connect(richTON).transfer(addr3Address,transferTON)
            await tonContract.connect(richTON).transfer(addr4Address,transferTON)
            await tonContract.connect(richTON).transfer(addr5Address,transferTON)
        })
    })
    
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
                            lockTOS.address,
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
                        lockTOS.address,
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
                expect(await deployed.l2PublicProxy.lockTOS()).to.eq(lockTOS.address)
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
            it('setVaultAdmin can not be executed by not l2ProjectManager', async () => {
                await expect(
                    deployed.l2PublicProxy.connect(addr1).setVaultAdmin(
                        erc20Atoken.address,
                        l2vaultAdminAddress
                        )
                    ).to.be.revertedWith("caller is not l2ProjectManager")
            })
    
            it('setVaultAdmin can be executed by only l2ProjectManager ', async () => {
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

    describe("# stake lockTOS for user", () => {
        it("check tos balance", async () => {
            let addr1balance = await tosContract.balanceOf(addr1Address);
            let addr2balance = await tosContract.balanceOf(addr2Address);
            let addr3balance = await tosContract.balanceOf(addr3Address);
            let addr4balance = await tosContract.balanceOf(addr4Address);
            let addr5balance = await tosContract.balanceOf(addr5Address);
            expect(addr1balance).to.be.gt(0);
            expect(addr2balance).to.be.gt(0);
            expect(addr3balance).to.be.equal(0);
            expect(addr4balance).to.be.equal(0);
            expect(addr5balance).to.be.equal(0);
            await tosContract.connect(addr1).transfer(addr3Address,tosAmount);
            await tosContract.connect(addr1).transfer(addr4Address,tosAmount);
            await tosContract.connect(addr1).transfer(addr5Address,tosAmount);
            addr3balance = await tosContract.balanceOf(addr3Address);
            addr4balance = await tosContract.balanceOf(addr4Address);
            addr5balance = await tosContract.balanceOf(addr4Address);
            expect(addr3balance).to.be.gt(0);
            expect(addr4balance).to.be.gt(0);
            expect(addr5balance).to.be.gt(0);
        })

        it("create locks for user", async () => {
            await tosContract.connect(addr1).approve(lockTOS.address, 15500)
            await lockTOS.connect(addr1).createLock(15500, 2);

            let userLocks = await lockTOS.connect(addr1).locksOf(addr1Address);
            let lockId = userLocks[userLocks.length - 1];
            expect(lockId).to.be.equal(1);
            addr1lockTOSIds.push(lockId);

            await tosContract.connect(addr2).approve(lockTOS.address, 35000) 
            await lockTOS.connect(addr2).createLock(35000, 2);

            userLocks = await lockTOS.connect(addr2).locksOf(addr2Address);
            lockId = userLocks[userLocks.length - 1];
            expect(lockId).to.be.equal(2);
            addr2lockTOSIds.push(lockId);

            await tosContract.connect(addr3).approve(lockTOS.address, 170000) 
            await lockTOS.connect(addr3).createLock(170000, 2);

            userLocks = await lockTOS.connect(addr3).locksOf(addr3Address);
            lockId = userLocks[userLocks.length - 1];
            expect(lockId).to.be.equal(3);
            addr3lockTOSIds.push(lockId);

            await tosContract.connect(addr4).approve(lockTOS.address, 650000) 
            await lockTOS.connect(addr4).createLock(650000, 2);

            userLocks = await lockTOS.connect(addr4).locksOf(addr4Address);
            lockId = userLocks[userLocks.length - 1];
            expect(lockId).to.be.equal(4);
            addr4lockTOSIds.push(lockId);

            await tosContract.connect(addr5).approve(lockTOS.address, 650000) 
            await lockTOS.connect(addr5).createLock(650000, 2);

            userLocks = await lockTOS.connect(addr5).locksOf(addr5Address);
            lockId = userLocks[userLocks.length - 1];
            expect(lockId).to.be.equal(5);
            addr5lockTOSIds.push(lockId);
        })

        it("check lockTOS balance", async () => {
            const block = await ethers.provider.getBlock('latest')
            if (!block) {
                throw new Error('null block returned from provider')
            }


            setSnapshot = block.timestamp;
            // console.log(Number(setSnapshot))

            let addr1balanceOfAt = Number(await lockTOS.balanceOfAt(addr1Address, setSnapshot))
            
            let addr2balanceOfAt = Number(await lockTOS.balanceOfAt(addr2Address, setSnapshot))
            
            let addr3balanceOfAt = Number(await lockTOS.balanceOfAt(addr3Address, setSnapshot))
            
            let addr4balanceOfAt = Number(await lockTOS.balanceOfAt(addr4Address, setSnapshot))
            
            let addr5balanceOfAt = Number(await lockTOS.balanceOfAt(addr5Address, setSnapshot))

            console.log(addr1balanceOfAt)
            console.log(addr2balanceOfAt)
            console.log(addr3balanceOfAt)
            console.log(addr4balanceOfAt)
            console.log(addr5balanceOfAt)
            
            expect(addr1balanceOfAt).to.be.above(0);
            expect(addr2balanceOfAt).to.be.above(0);
            expect(addr3balanceOfAt).to.be.above(0);
            expect(addr4balanceOfAt).to.be.above(0);
            expect(addr5balanceOfAt).to.be.above(0);
        })
    })


    describe("# setL2PublicSaleVault L2VaultAdmin", () => {
        it("check the is L2Token", async () => {
            expect(await deployed.l2PublicProxy.isL2Token(l2vaultAdminAddress)).to.be.equal(false);
            expect(await deployed.l2PublicProxy.isL2Token(erc20Atoken.address)).to.be.equal(true);
        })

        it("check the isVaultAdmin", async () => {
            expect(await deployed.l2PublicProxy.isVaultAdmin(erc20Atoken.address,l2ProjectManagerAddresss)).to.be.equal(false)
            expect(await deployed.l2PublicProxy.isVaultAdmin(ton,l2vaultAdminAddress)).to.be.equal(false)
            expect(await deployed.l2PublicProxy.isVaultAdmin(erc20Atoken.address,l2vaultAdminAddress)).to.be.equal(true)
        })
        
        it("vaultInitialize can not be executed by not vaultAdmin", async () => {
            blockTime = Number(await time.latest())
            whitelistStartTime = blockTime + 86400;
            whitelistEndTime = whitelistStartTime + (86400*7);
            round1StartTime = whitelistEndTime + 1;
            round1EndTime = round1StartTime + (86400*7);
            round2StartTime = round1EndTime + 1;
            round2EndTime = round2StartTime + (86400*7);
            claimTime1 = round2EndTime + (86400 * 20);
            claimTime2 = claimTime1 + (60 * 1);
            claimTime3 = claimTime2 + (60 * 2);
            claimTime4 = claimTime3 + (60 * 3);
            claimTime5 = claimTime4 + (60 * 4);

            await expect(
                deployed.l2PublicProxy.connect(addr1).vaultInitialize(
                    erc20Atoken.address,
                    [settingTier1,settingTier2,settingTier3,settingTier4,settingTierPercent1,settingTierPercent2,settingTierPercent3,settingTierPercent4],
                    [round1SaleAmount,round2SaleAmount,saleTokenPrice,tonTokenPrice,hardcapAmount,changeTOS,changeTick],
                    [setSnapshot,whitelistStartTime,whitelistEndTime,round1StartTime,round1EndTime,round2StartTime,round2EndTime,totalclaimCounts],
                    [claimTime1,claimTime2,claimTime3,claimTime4,claimTime5],
                    [claimPercent1,claimPercent2,claimPercent3,claimPercent4,claimPercent5]
                )
            ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        })

        it("vaultInitialize can not be executed by input not L2TokenAddr", async () => {
            await expect(
                deployed.l2PublicProxy.connect(l2vaultAdmin).vaultInitialize(
                    addr1Address,
                    [settingTier1,settingTier2,settingTier3,settingTier4,settingTierPercent1,settingTierPercent2,settingTierPercent3,settingTierPercent4],
                    [round1SaleAmount,round2SaleAmount,saleTokenPrice,tonTokenPrice,hardcapAmount,changeTOS,changeTick],
                    [setSnapshot,whitelistStartTime,whitelistEndTime,round1StartTime,round1EndTime,round2StartTime,round2EndTime,totalclaimCounts],
                    [claimTime1,claimTime2,claimTime3,claimTime4,claimTime5],
                    [claimPercent1,claimPercent2,claimPercent3,claimPercent4,claimPercent5]
                )
            ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        })

        it("vaultInitialize can not be executed by not input token", async () => {
            await expect(
                deployed.l2PublicProxy.connect(l2vaultAdmin).vaultInitialize(
                    erc20Atoken.address,
                    [settingTier1,settingTier2,settingTier3,settingTier4,settingTierPercent1,settingTierPercent2,settingTierPercent3,settingTierPercent4],
                    [round1SaleAmount,round2SaleAmount,saleTokenPrice,tonTokenPrice,hardcapAmount,changeTOS,changeTick],
                    [setSnapshot,whitelistStartTime,whitelistEndTime,round1StartTime,round1EndTime,round2StartTime,round2EndTime,totalclaimCounts],
                    [claimTime1,claimTime2,claimTime3,claimTime4,claimTime5],
                    [claimPercent1,claimPercent2,claimPercent3,claimPercent4,claimPercent5]
                )
            ).to.be.revertedWith("not input token")
        })

        it("vaultInitialize can be executed by only L2VaultAdmin & l2Token", async () => {
            // console.log("blockTime : ",blockTime)
            // console.log("setSnapshot : ",setSnapshot)
            // console.log("whitelistStartTime : ",whitelistStartTime)
            // console.log("whitelistEndTime : ",whitelistEndTime)
            // console.log("round1StartTime : ",round1StartTime)
            // console.log("round1EndTime : ",round1EndTime)
            // console.log("round2StartTime : ",round2StartTime)
            // console.log("round2EndTime : ",round2EndTime)
            // console.log("claimTime1 : ",claimTime1)
            // console.log("claimTime2 : ",claimTime2)
            // console.log("claimTime3 : ",claimTime3)
            // console.log("claimTime4 : ",claimTime4)
            // console.log("claimTime5 : ",claimTime5)

            // console.log("round1SaleAmount : ",round1SaleAmount)
            // console.log("round2SaleAmount : ",round2SaleAmount)
            // console.log("saleTokenPrice : ",saleTokenPrice)
            // console.log("tonTokenPrice : ",tonTokenPrice)
            // console.log("hardcapAmount : ",hardcapAmount)
            // console.log("changeTOS : ",changeTOS)
            // console.log("changeTick : ",changeTick)
            // console.log("totalclaimCounts : ",totalclaimCounts)
            // console.log("claimPercent1 : ",claimPercent1)
            // console.log("claimPercent2 : ",claimPercent2)
            // console.log("claimPercent3 : ",claimPercent3)
            // console.log("claimPercent4 : ",claimPercent4)
            // console.log("claimPercent5 : ",claimPercent5)
            let tx = await erc20Atoken.balanceOf(l2vaultAdminAddress)
            await erc20Atoken.connect(l2vaultAdmin).transfer(deployed.l2PublicProxy.address,tx);

            await deployed.l2PublicProxy.connect(l2vaultAdmin).vaultInitialize(
                erc20Atoken.address,
                [settingTier1,settingTier2,settingTier3,settingTier4,settingTierPercent1,settingTierPercent2,settingTierPercent3,settingTierPercent4],
                [round1SaleAmount,round2SaleAmount,saleTokenPrice,tonTokenPrice,hardcapAmount,changeTOS,changeTick],
                [setSnapshot,whitelistStartTime,whitelistEndTime,round1StartTime,round1EndTime,round2StartTime,round2EndTime,totalclaimCounts],
                [claimTime1,claimTime2,claimTime3,claimTime4,claimTime5],
                [claimPercent1,claimPercent2,claimPercent3,claimPercent4,claimPercent5]
            )
        })

        it("check setting value", async () => {
            let timeInfo = await deployed.l2PublicProxy.timeInfo(erc20Atoken.address)
            let manageInfo = await deployed.l2PublicProxy.manageInfo(erc20Atoken.address)
            let claimInfo = await deployed.l2PublicProxy.claimInfo(erc20Atoken.address)
            
            expect(manageInfo.set1rdTokenAmount).to.be.equal(round1SaleAmount)
            expect(manageInfo.set2rdTokenAmount).to.be.equal(round2SaleAmount)
            expect(manageInfo.saleTokenPrice).to.be.equal(saleTokenPrice)
            expect(manageInfo.tonPrice).to.be.equal(tonTokenPrice)
            expect(manageInfo.hardCap).to.be.equal(hardcapAmount)
            expect(manageInfo.changeTOS).to.be.equal(changeTOS)
            expect(manageInfo.changeTick).to.be.equal(changeTick)

            // console.log("blockTime : ",blockTime)
            // console.log("setSnapshot : ",setSnapshot)
            // console.log("whitelistStartTime : ",whitelistStartTime)
            // console.log("whitelistEndTime : ",whitelistEndTime)
            // console.log("round1StartTime : ",round1StartTime)
            // console.log("round1EndTime : ",round1EndTime)
            // console.log("round2StartTime : ",round2StartTime)
            // console.log("round2EndTime : ",round2EndTime)

            expect(Number(timeInfo.whiteListStartTime)).to.be.equal(whitelistStartTime)
            expect(Number(timeInfo.whiteListEndTime)).to.be.equal(whitelistEndTime)
            expect(Number(timeInfo.round1StartTime)).to.be.equal(round1StartTime)
            expect(Number(timeInfo.round1EndTime)).to.be.equal(round1EndTime)
            expect(Number(timeInfo.round2StartTime)).to.be.equal(round2StartTime)
            expect(Number(timeInfo.round2EndTime)).to.be.equal(round2EndTime)
            expect(Number(timeInfo.snapshot)).to.be.equal(setSnapshot)

            expect(claimInfo.totalClaimCounts).to.be.equal(totalclaimCounts)

            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,1)).to.be.equal(settingTier1)
            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,2)).to.be.equal(settingTier2)
            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,3)).to.be.equal(settingTier3)
            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,4)).to.be.equal(settingTier4)
            // console.log(await deployed.l2PublicProxy.tiers(erc20Atoken.address,1))

            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,1)).to.be.equal(settingTierPercent1)
            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,2)).to.be.equal(settingTierPercent2)
            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,3)).to.be.equal(settingTierPercent3)
            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,4)).to.be.equal(settingTierPercent4)
            // console.log(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,1))

            expect(await deployed.l2PublicProxy.claimTimes(erc20Atoken.address,0)).to.be.equal(claimTime1)
            expect(await deployed.l2PublicProxy.claimTimes(erc20Atoken.address,1)).to.be.equal(claimTime2)
            expect(await deployed.l2PublicProxy.claimTimes(erc20Atoken.address,2)).to.be.equal(claimTime3)
            expect(await deployed.l2PublicProxy.claimTimes(erc20Atoken.address,3)).to.be.equal(claimTime4)
            expect(await deployed.l2PublicProxy.claimTimes(erc20Atoken.address,4)).to.be.equal(claimTime5)

            expect(await deployed.l2PublicProxy.claimPercents(erc20Atoken.address,0)).to.be.equal(realclaimPercents1)
            expect(await deployed.l2PublicProxy.claimPercents(erc20Atoken.address,1)).to.be.equal(realclaimPercents2)
            expect(await deployed.l2PublicProxy.claimPercents(erc20Atoken.address,2)).to.be.equal(realclaimPercents3)
            expect(await deployed.l2PublicProxy.claimPercents(erc20Atoken.address,3)).to.be.equal(realclaimPercents4)
            expect(await deployed.l2PublicProxy.claimPercents(erc20Atoken.address,4)).to.be.equal(realclaimPercents5)
        })
    })

    describe("# PublicSale Test", () => {
        describe("# whiteList", () => {
            it("calculTier for user", async () => {
                let addr1Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr1Address
                );
                let addr2Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr2Address
                );
                let addr3Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr3Address
                );
                let addr4Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr4Address
                );
                let addr5Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr5Address
                );
                expect(addr1Tier).to.be.equal(1)
                expect(addr2Tier).to.be.equal(2)
                expect(addr3Tier).to.be.equal(3)
                expect(addr4Tier).to.be.equal(4)
                expect(addr5Tier).to.be.equal(4)
            })

            it("calculTierAmount for user", async () => {
                let addr1Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr1Address
                );
                let addr2Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr2Address
                );
                let addr3Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr3Address
                );
                let addr4Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr4Address
                );
                let addr5Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr5Address
                );

                let tier1Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,1)
                let tier2Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,2)
                let tier3Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,3)
                let tier4Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,4)

                let tier1stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,1)).add(1);
                let tier2stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,2)).add(1);
                let tier3stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,3)).add(1);
                let tier4stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,4)).add(1);

                let tier1Amount = round1SaleAmount.mul(tier1Percents).div(10000).div(tier1stAccount);
                let tier2Amount = round1SaleAmount.mul(tier2Percents).div(10000).div(tier2stAccount);
                let tier3Amount = round1SaleAmount.mul(tier3Percents).div(10000).div(tier3stAccount);
                let tier4Amount = round1SaleAmount.mul(tier4Percents).div(10000).div(tier4stAccount);

                expect(addr1Tier).to.be.equal(tier1Amount)
                expect(addr2Tier).to.be.equal(tier2Amount)
                expect(addr3Tier).to.be.equal(tier3Amount)
                expect(addr4Tier).to.be.equal(tier4Amount)
                expect(addr5Tier).to.be.equal(tier4Amount)
            })

            // it("check ton amount", async () => {
            //     let tonbalance = await tonContract.balanceOf(addr1Address);
            //     console.log(tonbalance)
            // })

            it("duration the time", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [whitelistStartTime]);
                await ethers.provider.send('evm_mine');
            })

            it("add whiteList", async () => {
                let tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,1));
                expect(tiersWhitelist).to.be.equal(0)
                await deployed.l2PublicProxyLogic.connect(addr1).addWhiteList(erc20Atoken.address);
                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,1));
                expect(tiersWhitelist).to.be.equal(1)

                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,2));
                expect(tiersWhitelist).to.be.equal(0)
                await deployed.l2PublicProxyLogic.connect(addr2).addWhiteList(erc20Atoken.address);
                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,2));
                expect(tiersWhitelist).to.be.equal(1)

                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,3));
                expect(tiersWhitelist).to.be.equal(0)
                await deployed.l2PublicProxyLogic.connect(addr3).addWhiteList(erc20Atoken.address);
                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,3));
                expect(tiersWhitelist).to.be.equal(1)

                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,4));
                expect(tiersWhitelist).to.be.equal(0)
                await deployed.l2PublicProxyLogic.connect(addr4).addWhiteList(erc20Atoken.address);
                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,4));
                expect(tiersWhitelist).to.be.equal(1)

                await deployed.l2PublicProxyLogic.connect(addr5).addWhiteList(erc20Atoken.address);
                tiersWhitelist = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,4));
                expect(tiersWhitelist).to.be.equal(2)
            })

            it("calculTierAmount for user after addWhitelist", async () => {
                let addr1Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr1Address
                );
                let addr2Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr2Address
                );
                let addr3Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr3Address
                );
                let addr4Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr4Address
                );
                let addr5Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr5Address
                );

                let tier1Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,1)
                let tier2Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,2)
                let tier3Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,3)
                let tier4Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,4)

                let tier1stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,1));
                let tier2stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,2));
                let tier3stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,3));
                let tier4stAccount = (await deployed.l2PublicProxy.tiersWhiteList(erc20Atoken.address,4));

                let tier1Amount = round1SaleAmount.mul(tier1Percents).div(10000).div(tier1stAccount);
                let tier2Amount = round1SaleAmount.mul(tier2Percents).div(10000).div(tier2stAccount);
                let tier3Amount = round1SaleAmount.mul(tier3Percents).div(10000).div(tier3stAccount);
                let tier4Amount = round1SaleAmount.mul(tier4Percents).div(10000).div(tier4stAccount);

                expect(addr1Tier).to.be.equal(tier1Amount)
                expect(addr2Tier).to.be.equal(tier2Amount)
                expect(addr3Tier).to.be.equal(tier3Amount)
                expect(addr4Tier).to.be.equal(tier4Amount)
                expect(addr5Tier).to.be.equal(tier4Amount)
            })

            it("can not addwhitelist who have already applied", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).addWhiteList(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("already attended")
            })
        })

        describe("# round1 Sale", () => {
            it("can not attend before round1 startTime", async () => {
                round1addr1Amount = ethers.utils.parseUnits("300", 18);
                await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round1addr1Amount)
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address,round1addr1Amount)
                await expect(tx).to.be.revertedWith("not round1SaleTime")
            })

            it("duration the time", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [round1StartTime]);
                await ethers.provider.send('evm_mine');

                await time.increaseTo(round1StartTime+86400);
            })

            it("can not addwhitelist after whitelistTIme", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).addWhiteList(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("end whitelistTime")
            })

            it("round1Sale after round1Sale StartTime", async () => {
                round1addr1Amount = ethers.utils.parseUnits("300", 18);
                round1addr2Amount = ethers.utils.parseUnits("600", 18);
                round1addr3Amount = ethers.utils.parseUnits("1100", 18);
                round1addr4Amount = ethers.utils.parseUnits("1500", 18);
                round1addr5Amount = ethers.utils.parseUnits("1500", 18);

                await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round1addr1Amount)
                await tonContract.connect(addr2).approve(deployed.l2PublicProxy.address, round1addr2Amount)
                await tonContract.connect(addr3).approve(deployed.l2PublicProxy.address, round1addr3Amount)
                await tonContract.connect(addr4).approve(deployed.l2PublicProxy.address, round1addr4Amount)
                await tonContract.connect(addr5).approve(deployed.l2PublicProxy.address, round1addr5Amount)

                await deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address,round1addr1Amount)
                await deployed.l2PublicProxyLogic.connect(addr2).round1Sale(erc20Atoken.address,round1addr2Amount)
                await deployed.l2PublicProxyLogic.connect(addr3).round1Sale(erc20Atoken.address,round1addr3Amount)
                await deployed.l2PublicProxyLogic.connect(addr4).round1Sale(erc20Atoken.address,round1addr4Amount)
                await deployed.l2PublicProxyLogic.connect(addr5).round1Sale(erc20Atoken.address,round1addr5Amount)
            })

            it("claimAmount check after round1", async () => {
                let addr1claimAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,round1addr1Amount);
                let addr2claimAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,round1addr2Amount);
                let addr3claimAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,round1addr3Amount);
                let addr4claimAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,round1addr4Amount);
                let addr5claimAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,round1addr5Amount);


                let realaddr1Amount = await deployed.l2PublicProxyLogic.user1rd(erc20Atoken.address,addr1Address);
                let realaddr2Amount = await deployed.l2PublicProxyLogic.user1rd(erc20Atoken.address,addr2Address);
                let realaddr3Amount = await deployed.l2PublicProxyLogic.user1rd(erc20Atoken.address,addr3Address);
                let realaddr4Amount = await deployed.l2PublicProxyLogic.user1rd(erc20Atoken.address,addr4Address);
                let realaddr5Amount = await deployed.l2PublicProxyLogic.user1rd(erc20Atoken.address,addr5Address);

                expect(addr1claimAmount).to.be.equal(realaddr1Amount.saleAmount)
                expect(addr2claimAmount).to.be.equal(realaddr2Amount.saleAmount)
                expect(addr3claimAmount).to.be.equal(realaddr3Amount.saleAmount)
                expect(addr4claimAmount).to.be.equal(realaddr4Amount.saleAmount)
                expect(addr5claimAmount).to.be.equal(realaddr5Amount.saleAmount)
            })

            it("can not attend round1Sale over amount", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address,round1addr1Amount)
                await expect(tx).to.be.revertedWith("don't over buy")
            })
        })

        describe("# round2 Sale", () => {
            it("can not attend before round2 startTime", async () => {
                round2Amount = ethers.utils.parseUnits("2000", 18);
                await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round2Amount)
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round2Sale(erc20Atoken.address,round2Amount)
                await expect(tx).to.be.revertedWith("not depositTime")
            })

            it("duration the time", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [round2StartTime+1]);
                await ethers.provider.send('evm_mine');

                // await time.increaseTo(round2StartTime+86400);
            })

            it("can not round1Sale attend after round1Sale EndTime", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address,round1addr1Amount)
                await expect(tx).to.be.revertedWith("end round1SaleTime")
            })

            it("can round2Sale after round2Sale StartTime", async () => {
                await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round2Amount)
                await tonContract.connect(addr2).approve(deployed.l2PublicProxy.address, round2Amount)
                await tonContract.connect(addr3).approve(deployed.l2PublicProxy.address, round2Amount)
                await tonContract.connect(addr4).approve(deployed.l2PublicProxy.address, round2Amount)
                await tonContract.connect(addr5).approve(deployed.l2PublicProxy.address, round2Amount)

                await deployed.l2PublicProxyLogic.connect(addr1).round2Sale(erc20Atoken.address,round2Amount)
                await deployed.l2PublicProxyLogic.connect(addr2).round2Sale(erc20Atoken.address,round2Amount)
                await deployed.l2PublicProxyLogic.connect(addr3).round2Sale(erc20Atoken.address,round2Amount)
                await deployed.l2PublicProxyLogic.connect(addr4).round2Sale(erc20Atoken.address,round2Amount)
                await deployed.l2PublicProxyLogic.connect(addr5).round2Sale(erc20Atoken.address,round2Amount)
            })

            it("check round2 attend (depositAmount check)", async () => {
                let depositAmount1 = await deployed.l2PublicProxyLogic.user2rd(erc20Atoken.address,addr1Address);
                let depositAmount2 = await deployed.l2PublicProxyLogic.user2rd(erc20Atoken.address,addr2Address);
                let depositAmount3 = await deployed.l2PublicProxyLogic.user2rd(erc20Atoken.address,addr3Address);
                let depositAmount4 = await deployed.l2PublicProxyLogic.user2rd(erc20Atoken.address,addr4Address);
                let depositAmount5 = await deployed.l2PublicProxyLogic.user2rd(erc20Atoken.address,addr5Address);

                expect(round2Amount).to.be.equal(depositAmount1.depositAmount)
                expect(round2Amount).to.be.equal(depositAmount2.depositAmount)
                expect(round2Amount).to.be.equal(depositAmount3.depositAmount)
                expect(round2Amount).to.be.equal(depositAmount4.depositAmount)
                expect(round2Amount).to.be.equal(depositAmount5.depositAmount)
            })

            it("check 2round buy amount(saleToken amount)", async () => {
                let getround2Amount = ethers.utils.parseUnits("1000", 18);
                let addr1round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr1Address,0)
                let addr2round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr2Address,0)
                let addr3round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr3Address,0)
                let addr4round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr4Address,0)
                let addr5round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr5Address,0)

                let calcultokenAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,getround2Amount);

                expect(addr1round2Amount).to.be.equal(calcultokenAmount)
                expect(addr2round2Amount).to.be.equal(calcultokenAmount)
                expect(addr3round2Amount).to.be.equal(calcultokenAmount)
                expect(addr4round2Amount).to.be.equal(calcultokenAmount)
                expect(addr5round2Amount).to.be.equal(calcultokenAmount)
            })

            it("openSaleUserAmount check", async () => {
                let getround2Amount = ethers.utils.parseUnits("1000", 18);
                let addr1round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr1Address)
                let addr2round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr2Address)
                let addr3round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr3Address)
                let addr4round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr4Address)
                let addr5round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr5Address)

                let calcultokenAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,getround2Amount);

                expect(addr1round2Amount._refundAmount).to.be.equal(refundTONAmount)
                expect(addr2round2Amount._refundAmount).to.be.equal(refundTONAmount)
                expect(addr3round2Amount._refundAmount).to.be.equal(refundTONAmount)
                expect(addr4round2Amount._refundAmount).to.be.equal(refundTONAmount)
                expect(addr5round2Amount._refundAmount).to.be.equal(refundTONAmount)

                expect(addr1round2Amount._realPayAmount).to.be.equal(getround2Amount)
                expect(addr2round2Amount._realPayAmount).to.be.equal(getround2Amount)
                expect(addr3round2Amount._realPayAmount).to.be.equal(getround2Amount)
                expect(addr4round2Amount._realPayAmount).to.be.equal(getround2Amount)
                expect(addr5round2Amount._realPayAmount).to.be.equal(getround2Amount)

                expect(addr1round2Amount._realSaleAmount).to.be.equal(calcultokenAmount)
                expect(addr2round2Amount._realSaleAmount).to.be.equal(calcultokenAmount)
                expect(addr3round2Amount._realSaleAmount).to.be.equal(calcultokenAmount)
                expect(addr4round2Amount._realSaleAmount).to.be.equal(calcultokenAmount)
                expect(addr5round2Amount._realSaleAmount).to.be.equal(calcultokenAmount)

            })

            it("duration the time", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [round2EndTime+1]);
                await ethers.provider.send('evm_mine');

                // await time.increaseTo(round2StartTime+86400);
            })

            it("can not round2Sale attend after round2Sale EndTime", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round2Sale(erc20Atoken.address,round2Amount)
                await expect(tx).to.be.revertedWith("end depositTime")
            })
        })

        describe("# claim", () => {
            it("claim fail before claimTime1", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("not claimTime")
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [claimTime1+1]);
                await ethers.provider.send('evm_mine');
            })

            it("claim and refund success after claimTime1", async () => {
                expect(await erc20Atoken.balanceOf(addr1Address)).to.be.equal(0)
                let beforeAddr1TONAmount = await tonContract.balanceOf(addr1Address)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,1)
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);

                let afterAddr1TONAmount = await tonContract.balanceOf(addr1Address)
                expect(afterAddr1TONAmount.sub(beforeAddr1TONAmount)).to.be.equal(refundTONAmount);
                expect(await erc20Atoken.balanceOf(addr1Address)).to.be.equal(getAddr1Amount._reward)
            })

            it("claim fail after claimTime1 because no buy", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(l2ProjectManager).claim(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("no purchase amount")
            })

            it("if already get reward about round, claim fail", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("no reward")
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [claimTime2+1]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after claimTime2", async () => {
                expect(await erc20Atoken.balanceOf(addr2Address)).to.be.equal(0)
                let beforeAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let beforeAddr2TONAmount = await tonContract.balanceOf(addr2Address)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,2)
                let getAddr2Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr2Address,0)
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr2).claim(erc20Atoken.address);

                let afterAddr2TONAmount = await tonContract.balanceOf(addr2Address)
                let afterAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                expect(afterAddr2TONAmount.sub(beforeAddr2TONAmount)).to.be.equal(refundTONAmount)
                expect(afterAddr1Amount.sub(beforeAddr1Amount)).to.be.equal(getAddr1Amount._reward)
                expect(await erc20Atoken.balanceOf(addr2Address)).to.be.equal(getAddr2Amount._reward)
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [claimTime3+1]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after claimTime3", async () => {
                expect(await erc20Atoken.balanceOf(addr3Address)).to.be.equal(0)
                let beforeAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let beforeAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let beforeAddr3TONAmount = await tonContract.balanceOf(addr3Address)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,3)
                let getAddr2Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr2Address,3)
                let getAddr3Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr3Address,0)
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr2).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr3).claim(erc20Atoken.address);

                let afterAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let afterAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let afterAddr3TONAmount = await tonContract.balanceOf(addr3Address)

                expect(afterAddr3TONAmount.sub(beforeAddr3TONAmount)).to.be.equal(refundTONAmount)

                expect(afterAddr1Amount.sub(beforeAddr1Amount)).to.be.equal(getAddr1Amount._reward)
                expect(afterAddr2Amount.sub(beforeAddr2Amount)).to.be.equal(getAddr2Amount._reward)
                expect(await erc20Atoken.balanceOf(addr3Address)).to.be.equal(getAddr3Amount._reward)
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [claimTime4+1]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after claimTime4", async () => {
                expect(await erc20Atoken.balanceOf(addr4Address)).to.be.equal(0)
                let beforeAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let beforeAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let beforeAddr3Amount = await erc20Atoken.balanceOf(addr3Address)
                let beforeAddr4TONAmount = await tonContract.balanceOf(addr4Address)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,4)
                let getAddr2Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr2Address,4)
                let getAddr3Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr3Address,4)
                let getAddr4Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr4Address,0)
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr2).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr3).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr4).claim(erc20Atoken.address);

                let afterAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let afterAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let afterAddr3Amount = await erc20Atoken.balanceOf(addr3Address)
                let afterAddr4TONAmount = await tonContract.balanceOf(addr4Address)

                expect(afterAddr4TONAmount.sub(beforeAddr4TONAmount)).to.be.equal(refundTONAmount)

                expect(afterAddr1Amount.sub(beforeAddr1Amount)).to.be.equal(getAddr1Amount._reward)
                expect(afterAddr2Amount.sub(beforeAddr2Amount)).to.be.equal(getAddr2Amount._reward)
                expect(afterAddr3Amount.sub(beforeAddr3Amount)).to.be.equal(getAddr3Amount._reward)
                expect(await erc20Atoken.balanceOf(addr4Address)).to.be.equal(getAddr4Amount._reward)
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [claimTime5+1]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after claimTime5", async () => {
                expect(await erc20Atoken.balanceOf(addr5Address)).to.be.equal(0)
                let beforeAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let beforeAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let beforeAddr3Amount = await erc20Atoken.balanceOf(addr3Address)
                let beforeAddr4Amount = await erc20Atoken.balanceOf(addr4Address)
                let beforeAddr5TONAmount = await tonContract.balanceOf(addr5Address)

                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,5)
                let getAddr2Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr2Address,5)
                let getAddr3Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr3Address,5)
                let getAddr4Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr4Address,5)
                let getAddr5Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr5Address,0)
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr2).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr3).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr4).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr5).claim(erc20Atoken.address);

                let afterAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let afterAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let afterAddr3Amount = await erc20Atoken.balanceOf(addr3Address)
                let afterAddr4Amount = await erc20Atoken.balanceOf(addr4Address)
                let afterAddr5TONAmount = await tonContract.balanceOf(addr5Address)

                expect(afterAddr5TONAmount.sub(beforeAddr5TONAmount)).to.be.equal(refundTONAmount)

                expect(afterAddr1Amount.sub(beforeAddr1Amount)).to.be.equal(getAddr1Amount._reward)
                expect(afterAddr2Amount.sub(beforeAddr2Amount)).to.be.equal(getAddr2Amount._reward)
                expect(afterAddr3Amount.sub(beforeAddr3Amount)).to.be.equal(getAddr3Amount._reward)
                expect(afterAddr4Amount.sub(beforeAddr4Amount)).to.be.equal(getAddr4Amount._reward)
                expect(await erc20Atoken.balanceOf(addr5Address)).to.be.equal(getAddr5Amount._reward)
            })

            it("if already get Allreward, claim fail", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("no purchase amount")
                let tx2 = deployed.l2PublicProxyLogic.connect(addr5).claim(erc20Atoken.address)
                await expect(tx2).to.be.revertedWith("no purchase amount")
            })

            it("PublicSale have TON for saleToken", async () => {
                expect(await tonContract.balanceOf(deployed.l2PublicProxy.address)).to.be.equal(contractHaveTON);
            })
        })

        describe("# exchangeWTONtoTOS", () => {
            it("depositWithdraw fail before exchangeWTONtoTOS", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(l2ProjectManager).depositWithdraw(erc20Atoken.address);
                await expect(tx).to.be.revertedWith("need the exchangeWTONtoTOS")
            })

            it("hardcapCalcul(how much TON change to TOS) view test", async () => {
                let changeTONamount = await deployed.l2PublicProxyLogic.hardcapCalcul(erc20Atoken.address)
                expect(changeTONamount).to.be.gte(0)
            })

            it("anybody can execute exchangeWTONtoTOS", async () => {
                // let changeTick = await deployed.l2PublicProxyLogic.changeTick();
                // console.log("changeTick :", changeTick)
                let amount1 = ethers.utils.parseUnits("1", 27);
                expect(await tosContract.balanceOf(deployed.l2LiquidityProxy.address)).to.be.equal(0)
                await deployed.l2PublicProxyLogic.connect(l2ProjectManager).exchangeWTONtoTOS(erc20Atoken.address,amount1)
                // console.log(await tosContract.balanceOf(deployed.l2LiquidityProxy.address))
                expect(await tosContract.balanceOf(deployed.l2LiquidityProxy.address)).to.be.gt(0)
            })
        })

        describe("# depositWithdraw", () => {
            it("despotiWithdraw execute", async () => {
                expect(await tonContract.balanceOf(vestingFundAddress)).to.be.equal(0)
                await deployed.l2PublicProxyLogic.connect(l2ProjectManager).depositWithdraw(erc20Atoken.address);
                let round1TONAmount = await deployed.l2PublicProxyLogic.saleInfo(erc20Atoken.address);
                let round2TONAmount = await deployed.l2PublicProxyLogic.totalOpenPurchasedAmount(erc20Atoken.address)
                let liquidityTON = await deployed.l2PublicProxyLogic.hardcapCalcul(erc20Atoken.address)
                let vestingTON = round1TONAmount.total1rdTONAmount.add(round2TONAmount).sub(liquidityTON)
                expect(await tonContract.balanceOf(vestingFundAddress)).to.be.equal(vestingTON);
            })
        })
    })

});

