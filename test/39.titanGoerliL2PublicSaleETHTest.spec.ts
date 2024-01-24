import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { BigNumber, Signer, providers } from 'ethers'
import { l2ProjectLaunchFixtures, l1Fixtures } from './shared/fixtures'
import { L2ProjectLaunchFixture, L1Fixture } from './shared/fixtureInterfaces'
import { getPublicSaleParams } from './shared/vaultParameters'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
import ERC20C from './abi/ERC20C.json'
import ERC20D from './abi/ERC20D.json'
import L2StandardERC20 from './abi/L2StandardERC20.json'
import snapshotGasCost from './shared/snapshotGasCost'

import { time, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import l2PublicSaleJson from "../artifacts/contracts/L2/vaults/L2PublicSaleVault.sol/L2PublicSaleVault.json";
import l2PublicSaleProxyJson from "../artifacts/contracts/L2/vaults/L2PublicSaleProxy.sol/L2PublicSaleProxy.json";

const Web3EthAbi = require('web3-eth-abi');
const TON_ABI = require("../abis/TON.json");
const TOS_ABI = require("../abis/TOS.json");
const ERC20_ABI = require("../abis/TestERC20.json");

describe('L2TokenFactory', () => {
    let deployer: Signer, addr1: Signer, addr2:Signer, addr3: Signer, addr4: Signer, addr5: Signer;
    let deployed: L2ProjectLaunchFixture
    let addr1Address: string, addr2Address: string, addr3Address: string, addr4Address: string, addr5Address: string;
    let projectInfo: any;

    let l2bridge: any;
    let l1BurnVaultProxyContract: any;
    let l1BurnVaultlogicContract: any;
    let l1BurnVaultProxy: any;
    let l1BurnVaultlogic: any;

    let l1deployed: L1Fixture
    let lockTOS: any;
    let tosContract: any;
    let tonContract: any;
    let lydaContract: any;

    let l2ProjectManager: Signer
    let l2ProjectManagerAddresss: string
    
    let vestingFund: Signer
    let vestingFundAddress: string

    let l2vaultAdmin: Signer
    let l2vaultAdminAddress: string

    let erc20Atoken: any;

    let tier1Amount: BigNumber;

    let l2PublicVaultLogic: any;
    let l2PublicVaultProxy: any;

    //mainnet
    // let quoter = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
    // let uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    // let tos = "0x409c4D8cd5d2924b9bc5509230d16a61289c8153"
    // let ton = "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5"
    // let uniswapFacotry = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

    // let lyda = "0xE1B0630D7649CdF503eABc2b6423227Be9605247"

    // let lydaRich = "0x70115ba3b49D60776AaA2976ADffB5CfABf31689"

    //titan-goerli
    // let quoter = "0x32cdAd6cd559EcFE87Be49167F2F68A1Df08c9E9"
    // let uniswapRouter = "0x0DD8EA3A5A8900CE36A7302E600C4B8A3ef23B8d"
    // let tos = "0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC"
    // let ton = "0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa"
    // let uniswapFacotry = "0x2Ae8FeE7B4f4ef27088fa8a550C91A045A3128b5"

    // let weth = "0x4200000000000000000000000000000000000006"

    // let lyda = "0x3bB4445D30AC020a84c1b5A8A2C6248ebC9779D0"

    // let lydaRich = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea"

    //titan
    let quoter = "0xAd6c4B17ae46D70D5FA8649fE9387Bc361bB9FDb"
    let uniswapRouter = "0xE15204fd488C33C26FF56efF14997Da8997E58Bf"
    let tos = "0xD08a2917653d4E460893203471f0000826fb4034"
    let ton = "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2"
    let uniswapFacotry = "0x755Ba335013C07CE35C9A2dd5746617Ac4c6c799"

    let weth = "0x4200000000000000000000000000000000000006"

    let lyda = "0x3bB4445D30AC020a84c1b5A8A2C6248ebC9779D0"

    let lydaRich = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea"
    

    //goerli
    // let tos = "0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9"
    // let ton = "0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00"
    // let lyda = "0x51C5E2D3dc8Ee66Dffdb1747dEB20d6b326E8bF2"


    //standard set
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
    let claimPercent1 = 4000;
    let claimPercent2 = 2000;
    let claimPercent3 = 2000;
    let claimPercent4 = 2000;

    let realclaimPercents1 = 4000;
    let realclaimPercents2 = 6000;
    let realclaimPercents3 = 8000;
    let realclaimPercents4 = 10000;

    let totalclaimCounts = 4;
    
    let firstClaimPercent = 4000; //첫번째 클레임 비율 40%
    let firstClaimTime: any;     //첫번째 클레임 타임
    let secondClaimTime: any;    //두번째 클레임 타임
    let roundInterval = 600;      //1분

    let fee = 3000;

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

    //original logic
    // let contractHaveTON = ethers.utils.parseUnits("10000", 18);

    //change logic
    let contractHaveTON = ethers.utils.parseUnits("9998", 18);

    let refundTONAmount = ethers.utils.parseUnits("1000", 18);

    let publicSaleParams: any;

    let fundClaimTime1: any, fundClaimTime2: any, fundClaimTime3: any
    let fundClaimPercent1 = 40;
    let fundClaimPercent2 = 70;
    let fundClaimPercent3 = 100;

    let sendether = "0xBDBC41E0348B300000"

    let transferTON = ethers.utils.parseUnits("3500", 18);


    //goerli
    // let testAccount = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea"

    //titan-goerli
    // let testAccount = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea"
    // let testAccount2 = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea"

    //titan
    let testAccount = "0x340C44089bc45F86060922d2d89eFee9e0CDF5c7"
    let testAccount2 = "0xceB2196aDdf345F68d1F536DdAA49FE54BcBDDAD"

    //mainnet
    // let testAccount = "0x156DD25d342a6B63874333985140aA3103bf1Ff0"
    // let testAccount2 = "0x70115ba3b49D60776AaA2976ADffB5CfABf31689"
    let richTON: Signer;
    let richTOS: Signer;
    let richLYDA: Signer;

    // const infuraUrl = 'https://rpc.titan-goerli.tokamak.network';
    // const provider = new ethers.providers.JsonRpcProvider(infuraUrl);
    // const network = providers.getNetwork();
    // const provider = ethers.getDefaultProvider();
    const provider = ethers.provider;

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

        richTOS = await ethers.getSigner(testAccount2);        //tos주인

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [lydaRich],
        });

        richLYDA = await ethers.getSigner(lydaRich);        //lyda주인

        await network.provider.send("hardhat_setBalance", [
            addr1Address,
            sendether
        ]);

        await network.provider.send("hardhat_setBalance", [
            addr2Address,
            sendether
        ]);

        await network.provider.send("hardhat_setBalance", [
            addr3Address,
            sendether
        ]);

        // await network.provider.send("hardhat_setBalance", [
        //     addr4Address,
        //     sendether
        // ]);

        // await network.provider.send("hardhat_setBalance", [
        //     addr5Address,
        //     sendether
        // ]);

        await setBalance(
            addr4Address,
            ethers.utils.parseEther("3500")
        )

        await setBalance(
            addr5Address,
            ethers.utils.parseEther("3500")
        )
        console.log("addr1Address : ",addr1Address);
        console.log("addr2Address : ",addr2Address);
        console.log("addr3Address : ",addr3Address);
        console.log("addr4Address : ",addr4Address);
        console.log("addr5Address : ",addr5Address);

        // console.log(await provider.getBalance(addr1Address));
        // console.log(await provider.getBalance(addr2Address));
        // console.log(await provider.getBalance(addr3Address));
        // console.log(await provider.getBalance(addr4Address));
        // console.log(await provider.getBalance(addr5Address));

    })

    describe("# setting PublicSaleVaultProxy after deploy", () => {

        it("DAOProxyV2 setImplementation2 DAOv2CommitteeV2", async () => {
            // console.log(await provider.getBalance(addr1Address));
            // console.log(await provider.getBalance(addr2Address));
            // console.log(await provider.getBalance(addr3Address));
            // console.log(await provider.getBalance(addr4Address));
            // console.log(await provider.getBalance(addr5Address));
            await deployed.l2PublicProxy.connect(deployer).setImplementation2(deployed.l2PublicVaultProxy.address, 1, true)
        })

        it("PublicSaleVaultProxy selectorImplementations2 PublicSaleProxy", async () => {
            const _setL2ProjectManager = Web3EthAbi.encodeFunctionSignature(
                "setL2ProjectManager(address)"
            )

            const _setBurnBridge = Web3EthAbi.encodeFunctionSignature(
                "setBurnBridge(address,address)"
            )

            const _initialize = Web3EthAbi.encodeFunctionSignature(
                "initialize(address[7],uint8,uint8,uint256,uint256,uint256,uint256,uint256)"
            )

            const _setAddress = Web3EthAbi.encodeFunctionSignature(
                "setAddress(address[7)"
            )

            const _setMaxMinPercent = Web3EthAbi.encodeFunctionSignature(
                "setMaxMinPercent(uint8,uint8)"
            )

            const _setSTOSstandard = Web3EthAbi.encodeFunctionSignature(
                "setSTOSstandard(uint256,uint256,uint256,uint256)"
            )

            const _setDelayTime = Web3EthAbi.encodeFunctionSignature(
                "setDelayTime(uint256)"
            )

            const _setVaultAdmin = Web3EthAbi.encodeFunctionSignature(
                "setVaultAdmin(address,address)"
            )

            const _vaultInitialize = Web3EthAbi.encodeFunctionSignature(
                "vaultInitialize(address,tuple,tuple,tuple)"
            )
            console.log("test select : ", _vaultInitialize);

            const _vaultInitialize2 = Web3EthAbi.encodeFunctionSignature({
                name: 'vaultInitialize',
                type: 'function',
                inputs: [
                    {
                      name: "_l2token",
                      type: "address"
                    },
                    {
                      name: "params",
                      type: "struct LibProject.InitalParameterPublicSaleVault"
                    },
                    {
                      name: "params2",
                      type: "struct LibProject.InitalParameterPublicSaleClaim"
                    },
                    {
                      name: "params3",
                      type: "struct LibProject.InitalParameterVestingFundVault"
                    }
                  ]
            })

            console.log("vaultInitialize select : ", _vaultInitialize2);

            const _vaultInitialize3 = Web3EthAbi.encodeFunctionSignature(
                "vaultInitialize(address,(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256),(uint256,uint256,uint256,uint256,uint256),(address,uint256,uint256,uint256,uint256,uint256,uint24)"
            )

            console.log("test select3 : ", _vaultInitialize3);

            const _vaultInitialize4 = Web3EthAbi.encodeFunctionSignature({
                name: 'vaultInitialize',
                type: 'function',
                inputs: [
                    {
                      name: "_l2token",
                      type: "address"
                    },
                    {
                        components: [
                          {
                            name: "stosTier1",
                            type: "uint256"
                          },
                          {
                            name: "stosTier2",
                            type: "uint256"
                          },
                          {
                            name: "stosTier3",
                            type: "uint256"
                          },
                          {
                            name: "stosTier4",
                            type: "uint256"
                          },
                          {
                            name: "tier1Percents",
                            type: "uint256"
                          },
                          {
                            name: "tier2Percents",
                            type: "uint256"
                          },
                          {
                            name: "tier3Percents",
                            type: "uint256"
                          },
                          {
                            name: "tier4Percents",
                            type: "uint256"
                          },
                          {
                            name: "total1roundSaleAmount",
                            type: "uint256"
                          },
                          {
                            name: "total2roundSaleAmount",
                            type: "uint256"
                          },
                          {
                            name: "saleTokenPrice",
                            type: "uint256"
                          },
                          {
                            name: "payTokenPrice",
                            type: "uint256"
                          },
                          {
                            name: "hardcapAmount",
                            type: "uint256"
                          },
                          {
                            name: "changeTOSPercent",
                            type: "uint256"
                          },
                          {
                            name: "startWhiteTime",
                            type: "uint256"
                          },
                          {
                            name: "endWhiteTime",
                            type: "uint256"
                          },
                          {
                            name: "start1roundTime",
                            type: "uint256"
                          },
                          {
                            name: "end1roundTime",
                            type: "uint256"
                          },
                          {
                            name: "snapshotTime",
                            type: "uint256"
                          },
                          {
                            name: "start2roundTime",
                            type: "uint256"
                          },
                          {
                            name: "end2roundTime",
                            type: "uint256"
                          }
                        ],
                        name: "params",
                        type: "tuple"
                    },
                    {
                        components: [
                          {
                            name: "claimCounts",
                            type: "uint256"
                          },
                          {
                            name: "firstClaimPercent",
                            type: "uint256"
                          },
                          {
                            name: "firstClaimTime",
                            type: "uint256"
                          },
                          {
                            name: "secondClaimTime",
                            type: "uint256"
                          },
                          {
                            name: "roundInterval",
                            type: "uint256"
                          }
                        ],
                        name: "params2",
                        type: "tuple"
                    },
                    {
                        components: [
                          {
                            name: "receiveAddress",
                            type: "address"
                          },
                          {
                            name: "totalClaimCount",
                            type: "uint256"
                          },
                          {
                            name: "firstClaimPercent",
                            type: "uint256"
                          },
                          {
                            name: "firstClaimTime",
                            type: "uint256"
                          },
                          {
                            name: "secondClaimTime",
                            type: "uint256"
                          },
                          {
                            name: "roundIntervalTime",
                            type: "uint256"
                          },
                          {
                            name: "fee",
                            type: "uint24"
                          }
                        ],
                        name: "params3",
                        type: "tuple"
                      }
                  ]
            })

            console.log("_vaultInitialize4 select : ", _vaultInitialize4);

            const _setTier = Web3EthAbi.encodeFunctionSignature(
                "setTier(address,uint256,uint256,uint256,uint256)"
            )

            const _setTierPercents = Web3EthAbi.encodeFunctionSignature(
                "setTierPercents(address,uint256,uint256,uint256,uint256)"
            )

            const _setAllAmount = Web3EthAbi.encodeFunctionSignature(
                "setAllAmount(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256)"
            )

            const _set1RoundTime = Web3EthAbi.encodeFunctionSignature(
                "set1RoundTime(address,uint256,uint256,uint256,uint256)"
            )

            const _set2RoundTime = Web3EthAbi.encodeFunctionSignature(
                "set2RoundTime(address,uint256,uint256,uint256)"
            )

            const _setClaimTime = Web3EthAbi.encodeFunctionSignature(
                "setClaimTime(address,uint256,uint256,uint256,uint256,uint256)"
            )

            const _isL2ProjectManager = Web3EthAbi.encodeFunctionSignature(
                "isL2ProjectManager()"
            )

            const _isVaultAdmin = Web3EthAbi.encodeFunctionSignature(
                "isVaultAdmin(address,address)"
            )

            const _isL2Token = Web3EthAbi.encodeFunctionSignature(
                "isL2Token(address)"
            )
            
            await deployed.l2PublicProxy.connect(deployer).setSelectorImplementations2(
                [
                    _setL2ProjectManager,_setBurnBridge,_initialize,_setAddress,_setMaxMinPercent,
                    _setSTOSstandard,_setDelayTime,_setVaultAdmin,_vaultInitialize4,
                    _setTier,_setTierPercents,_setAllAmount,_set1RoundTime,_set2RoundTime,_setClaimTime,
                    _isL2ProjectManager,_isVaultAdmin,_isL2Token
                ],
                deployed.l2PublicVaultProxy.address
            )
        })

        it("connect L2PublicSaleProxy", async () => {
            l2PublicVaultProxy = await ethers.getContractAt(l2PublicSaleProxyJson.abi, deployed.l2PublicProxy.address, deployer); 
        })


    })

    describe("# deploy L1BurnVault, MockL2Bridge", () => {
        it("deploy L2StandardBridge", async () => {
            const mockBridge = await ethers.getContractFactory('mockL2StandardBridge')
            l2bridge = await mockBridge.connect(deployer).deploy()
        })

        
        it("deplyo L1BurnVaultLogic", async () => {
            const l1burnvaultlogic = await ethers.getContractFactory('L1BurnVault')
            l1BurnVaultlogicContract = await l1burnvaultlogic.connect(deployer).deploy()
        })
        
        it("deploy L1BurnVaultProxy and upgradeTo", async () => {
            const l1burnvaultproxy = await ethers.getContractFactory('L1BurnVaultProxy')
            l1BurnVaultProxyContract = await l1burnvaultproxy.connect(deployer).deploy()

            await l1BurnVaultProxyContract.connect(deployer).upgradeTo(l1BurnVaultlogicContract.address)

            let impCheck = await l1BurnVaultProxyContract.implementation();
            expect(impCheck).to.be.equal(l1BurnVaultlogicContract.address)
        }) 
    })

    describe("# set LYDA", () => {
        it("setting the LYDA Contract", async () => {
            lydaContract = await ethers.getContractAt(ERC20_ABI.abi, lyda, deployer) 
        })
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
            // await lydaContract.connect(richLYDA).transfer(l2vaultAdminAddress,tx);

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
            expect(addProject[1]).to.be.eq(projectInfo.projectOwner);
            expect(addProject[2]).to.be.eq(projectInfo.l1Token);
            expect(addProject[3]).to.be.eq(projectInfo.l2Token);
            expect(addProject[4]).to.be.eq(projectInfo.projectName);
        })

    });

    describe("# set TOS", () => {
        it("setting the TOS Contract", async () => {
            tosContract = await ethers.getContractAt(TOS_ABI.abi, tos, deployer)
        })

        it("transfer TOS", async () => {
            let transferTOS = ethers.utils.parseUnits("1", 18);
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

    // describe("# set TON", () => {
    //     it("setting the TON Contract", async () => {
    //         tonContract = await ethers.getContractAt(TON_ABI.abi, ton, deployer)
    //     })

    //     it("transfer TON", async () => {
    //         let transferTON = ethers.utils.parseUnits("3500", 18);
    //         await tonContract.connect(richTON).transfer(addr1Address,transferTON)
    //         await tonContract.connect(richTON).transfer(addr2Address,transferTON)
    //         await tonContract.connect(richTON).transfer(addr3Address,transferTON)
    //         await tonContract.connect(richTON).transfer(addr4Address,transferTON)
    //         await tonContract.connect(richTON).transfer(addr5Address,transferTON)
    //     })
    // })

    describe("# setL2VestingFundVault OwnerSetting", () => {
        it('setBaseInfoProxy can not be executed by anyone', async () => {
            await expect(
                deployed.l2VestingFundProxy.connect(addr1).setBaseInfoProxy(
                    ton,
                    tos,
                    l2ProjectManagerAddresss,
                    deployed.l2PublicProxy.address,
                    uniswapFacotry
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it('setBaseInfoProxy can be executed by only Owner ', async () => {
            await deployed.l2VestingFundProxy.connect(deployer).setBaseInfoProxy(
                ton,
                tos,
                l2ProjectManagerAddresss,
                deployed.l2PublicProxy.address,
                uniswapFacotry
            )
            expect(await deployed.l2VestingFundProxy.tonToken()).to.eq(ton)
            expect(await deployed.l2VestingFundProxy.tosToken()).to.eq(tos)
            expect(await deployed.l2VestingFundProxy.l2ProjectManager()).to.eq(l2ProjectManagerAddresss)
            expect(await deployed.l2VestingFundProxy.publicSaleVault()).to.eq(deployed.l2PublicProxy.address)
            expect(await deployed.l2VestingFundProxy.uniswapV3Factory()).to.eq(uniswapFacotry)
        })
    })
    
    describe("# setL2PublicSale L2ProjectManager", () => {
        describe("# set L2ProjectManager", () => {
            it('setL2ProjectManager can not be executed by not owner', async () => {
                await expect(
                    l2PublicVaultProxy.connect(addr1).setL2ProjectManager(l2ProjectManagerAddresss)
                    ).to.be.revertedWith("Accessible: Caller is not an admin")
            })
    
            it('setL2ProjectManager can be executed by only owner ', async () => {
                await l2PublicVaultProxy.connect(deployer).setL2ProjectManager(l2ProjectManagerAddresss)
                expect(await l2PublicVaultProxy.l2ProjectManager()).to.eq(l2ProjectManagerAddresss)
            })
    
            it('cannot be changed to the same value', async () => {
                await expect(
                    l2PublicVaultProxy.connect(deployer).setL2ProjectManager(l2ProjectManagerAddresss)
                    ).to.be.revertedWith("same")
            })
        })

        describe("# set PublicSale basic value", () => {
            it("set initialize can not executed by not owner", async () => {
                await expect(
                    l2PublicVaultProxy.connect(addr1).initialize(
                        [
                            quoter,
                            deployed.l2VestingFundProxy.address,
                            deployed.l2LiquidityProxy.address,
                            uniswapRouter,
                            lockTOS.address,
                            tos,
                            weth
                        ],
                        minPer,
                        maxPer,
                        standardTier1,
                        standardTier2,
                        standardTier3,
                        standardTier4,
                        delayTime
                    )).to.be.revertedWith("Accessible: Caller is not an admin")
            })

            it('set initialize can be executed by only Owner ', async () => {
                await l2PublicVaultProxy.connect(deployer).initialize(
                    [
                        quoter,
                        deployed.l2VestingFundProxy.address,
                        deployed.l2LiquidityProxy.address,
                        uniswapRouter,
                        lockTOS.address,
                        tos,
                        weth
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
                expect(await deployed.l2PublicProxy.vestingFund()).to.eq(deployed.l2VestingFundProxy.address)
                expect(await deployed.l2PublicProxy.liquidityVault()).to.eq(deployed.l2LiquidityProxy.address)
                expect(await deployed.l2PublicProxy.uniswapRouter()).to.eq(uniswapRouter)
                expect(await deployed.l2PublicProxy.lockTOS()).to.eq(lockTOS.address)
                expect(await deployed.l2PublicProxy.tos()).to.eq(tos)
                expect(await deployed.l2PublicProxy.ton()).to.eq(weth)
                expect(await deployed.l2PublicProxy.minPer()).to.eq(minPer)
                expect(await deployed.l2PublicProxy.maxPer()).to.eq(maxPer)
                expect(await deployed.l2PublicProxy.stanTier1()).to.eq(standardTier1)
                expect(await deployed.l2PublicProxy.stanTier2()).to.eq(standardTier2)
                expect(await deployed.l2PublicProxy.stanTier3()).to.eq(standardTier3)
                expect(await deployed.l2PublicProxy.stanTier4()).to.eq(standardTier4)
                expect(await deployed.l2PublicProxy.delayTime()).to.eq(delayTime)
            })
        })

        describe("# PublicSale setVaultAdmin", () => {
            it('setVaultAdmin can not be executed by not l2ProjectManager', async () => {
                await expect(
                    l2PublicVaultProxy.connect(addr1).setVaultAdmin(
                        erc20Atoken.address,
                        l2vaultAdminAddress
                        )
                    ).to.be.revertedWith("caller is not l2ProjectManager")
            })
    
            it('setVaultAdmin can be executed by only l2ProjectManager ', async () => {
                await l2PublicVaultProxy.connect(l2ProjectManager).setVaultAdmin(
                    erc20Atoken.address,
                    l2vaultAdminAddress
                )
                expect(await deployed.l2PublicProxy.l2ProjectManager()).to.eq(l2ProjectManagerAddresss)
            })
    
            it('cannot be changed to the same value', async () => {
                await expect(
                    l2PublicVaultProxy.connect(l2ProjectManager).setVaultAdmin(
                        erc20Atoken.address,
                        l2vaultAdminAddress
                    )
                ).to.be.revertedWith("same")
            })
        })

        describe("# VestingFund setVaultAdmin", () => {
            it("isVaultAdmin Value check", async () => {
                let tx = await deployed.l2VestingFund.isVaultAdmin(erc20Atoken.address,l2vaultAdminAddress);
                expect(tx).to.be.equal(true);
            })

            it("vaultAdminOfToken check", async () => {
                let tx = await deployed.l2VestingFund.vaultAdminOfToken(erc20Atoken.address)
                expect(tx).to.be.equal(l2vaultAdminAddress)
            })
        })
    })

    describe("# setL2PublicSale the Bridge and l1burnVault", () => {
        it("setBurnBridge can not be executed by not owner", async () => {
            await expect(
                l2PublicVaultProxy.connect(addr1).setBurnBridge(
                    l2bridge.address,
                    l1BurnVaultProxyContract.address
                )).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it("setL2ProjectManager can be executed by only owner", async () => {
            await l2PublicVaultProxy.connect(deployer).setBurnBridge(
                l2bridge.address,
                l1BurnVaultProxyContract.address
            )
            expect(await deployed.l2PublicProxy.l2Bridge()).to.eq(l2bridge.address)
            expect(await deployed.l2PublicProxy.l1burnVault()).to.eq(l1BurnVaultProxyContract.address)
        })

        it("cannot be changed to the same value", async () => {
            await expect(
                l2PublicVaultProxy.connect(deployer).setBurnBridge(
                    l2bridge.address,
                    l1BurnVaultProxyContract.address
                )
            ).to.be.revertedWith("same addr")
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
            expect(await l2PublicVaultProxy.isL2Token(l2vaultAdminAddress)).to.be.equal(false);
            expect(await l2PublicVaultProxy.isL2Token(erc20Atoken.address)).to.be.equal(true);
        })

        it("check the isVaultAdmin", async () => {
            expect(await l2PublicVaultProxy.isVaultAdmin(erc20Atoken.address,l2ProjectManagerAddresss)).to.be.equal(false)
            expect(await l2PublicVaultProxy.isVaultAdmin(ton,l2vaultAdminAddress)).to.be.equal(false)
            expect(await l2PublicVaultProxy.isVaultAdmin(erc20Atoken.address,l2vaultAdminAddress)).to.be.equal(true)
        })
        
        it("vaultInitialize can not be executed by not vaultAdmin", async () => {
            blockTime = Number(await time.latest())
            whitelistStartTime = setSnapshot + 400;
            whitelistEndTime = whitelistStartTime + (86400*7);
            round1StartTime = whitelistEndTime + 1;
            round1EndTime = round1StartTime + (86400*7);
            round2StartTime = round1EndTime + 1;
            round2EndTime = round2StartTime + (86400*7);
            firstClaimTime = round2EndTime + (86400 * 20);
            secondClaimTime = firstClaimTime + (60 * 5);
            fundClaimTime1 = secondClaimTime + 3000
            fundClaimTime2 = fundClaimTime1 + 100

            publicSaleParams = getPublicSaleParams (
                [settingTier1,settingTier2,settingTier3,settingTier4],
                [settingTierPercent1,settingTierPercent2,settingTierPercent3,settingTierPercent4],
                [round1SaleAmount,round2SaleAmount],
                [saleTokenPrice,tonTokenPrice],
                hardcapAmount,
                changeTOS,
                [whitelistStartTime,whitelistEndTime,round1StartTime,round1EndTime,setSnapshot,round2StartTime,round2EndTime],
                totalclaimCounts,
                firstClaimPercent,
                firstClaimTime,
                secondClaimTime,
                roundInterval,
                l2vaultAdminAddress,
                3,
                firstClaimPercent,
                fundClaimTime1,
                fundClaimTime2,
                roundInterval,
                fee
            )

            await expect(
                l2PublicVaultProxy.connect(addr1).vaultInitialize(
                    erc20Atoken.address,
                    publicSaleParams.vaultParams,
                    publicSaleParams.claimParams,
                    publicSaleParams.vestingParams
                )
            ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        })

        it("vaultInitialize can not be executed by input not L2TokenAddr", async () => {
            await expect(
                l2PublicVaultProxy.connect(addr1).vaultInitialize(
                    addr1Address,
                    publicSaleParams.vaultParams,
                    publicSaleParams.claimParams,
                    publicSaleParams.vestingParams
                )
            ).to.be.revertedWith("caller is not a vaultAdmin Of l2Token")
        })

        it("vaultInitialize can not be executed by not input token", async () => {
            await expect(
                l2PublicVaultProxy.connect(l2vaultAdmin).vaultInitialize(
                    erc20Atoken.address,
                    publicSaleParams.vaultParams,
                    publicSaleParams.claimParams,
                    publicSaleParams.vestingParams
                )
            ).to.be.revertedWith("TRANSFER_FROM_FAILED")
        })

        it("vaultInitialize need set snapshot consider delayTime", async () => {
            let tx = await erc20Atoken.balanceOf(l2vaultAdminAddress)
            await erc20Atoken.connect(l2vaultAdmin).transfer(deployed.l2PublicProxy.address,tx);

            await expect(
                l2PublicVaultProxy.connect(l2vaultAdmin).vaultInitialize(
                    erc20Atoken.address,
                    publicSaleParams.vaultParams,
                    publicSaleParams.claimParams,
                    publicSaleParams.vestingParams
                )
            ).to.be.revertedWith("snapshot need later")
        })

        it("vaultInitialize can be executed by only L2VaultAdmin & l2Token", async () => {
            blockTime = Number(await time.latest())
            whitelistStartTime = blockTime + 86400;
            whitelistEndTime = whitelistStartTime + (86400*7);
            round1StartTime = whitelistEndTime + 10;
            round1EndTime = round1StartTime + (86400*7);
            round2StartTime = round1EndTime + 10;
            round2EndTime = round2StartTime + (86400*7);
            firstClaimTime = round2EndTime + (86400 * 20);
            secondClaimTime = firstClaimTime + (60 * 5);
            fundClaimTime1 = secondClaimTime + 3000
            fundClaimTime2 = fundClaimTime1 + 100

            publicSaleParams = getPublicSaleParams (
                [settingTier1,settingTier2,settingTier3,settingTier4],
                [settingTierPercent1,settingTierPercent2,settingTierPercent3,settingTierPercent4],
                [round1SaleAmount,round2SaleAmount],
                [saleTokenPrice,tonTokenPrice],
                hardcapAmount,
                changeTOS,
                [whitelistStartTime,whitelistEndTime,round1StartTime,round1EndTime,setSnapshot,round2StartTime,round2EndTime],
                totalclaimCounts,
                firstClaimPercent,
                firstClaimTime,
                secondClaimTime,
                roundInterval,
                l2vaultAdminAddress,
                3,
                firstClaimPercent,
                fundClaimTime1,
                fundClaimTime2,
                roundInterval,
                fee
            )

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

            await l2PublicVaultProxy.connect(l2ProjectManager).vaultInitialize(
                erc20Atoken.address,
                publicSaleParams.vaultParams,
                publicSaleParams.claimParams,
                publicSaleParams.vestingParams
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
            expect(claimInfo.firstClaimPercent).to.be.equal(firstClaimPercent)
            expect(claimInfo.firstClaimTime).to.be.equal(firstClaimTime)
            expect(claimInfo.secondClaimTime).to.be.equal(secondClaimTime)
            expect(claimInfo.claimInterval).to.be.equal(roundInterval)

            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,1)).to.be.equal(settingTier1)
            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,2)).to.be.equal(settingTier2)
            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,3)).to.be.equal(settingTier3)
            expect(await deployed.l2PublicProxy.tiers(erc20Atoken.address,4)).to.be.equal(settingTier4)

            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,1)).to.be.equal(settingTierPercent1)
            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,2)).to.be.equal(settingTierPercent2)
            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,3)).to.be.equal(settingTierPercent3)
            expect(await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,4)).to.be.equal(settingTierPercent4)
        })
    })

    describe("# set VestingFundVault", () => {
        describe("# set initialize about l2Token", () => {            
            it("can initialize only vaultAdmin about l2Token", async () => {
                expect(await deployed.l2VestingFund.receivedAddress(erc20Atoken.address)).to.be.equal(l2vaultAdminAddress)
                expect(await deployed.l2VestingFund.fees(erc20Atoken.address)).to.be.equal(fee)
                expect(await deployed.l2VestingFund.settingChecks(erc20Atoken.address)).to.be.equal(true)
                let tx = await deployed.l2VestingFund.vaultInfo(erc20Atoken.address)
                expect(tx.totalClaimCount).to.be.equal(3)
                expect(tx.firstClaimPercents).to.be.equal(firstClaimPercent)
                expect(tx.firstClaimTime).to.be.equal(fundClaimTime1)
                expect(tx.secondClaimTime).to.be.equal(fundClaimTime2)
                expect(tx.roundInterval).to.be.equal(roundInterval)

            })
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
                let user1Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr1Address
                );
                let user2Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr2Address
                );
                let user3Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr3Address
                );
                let user4Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr4Address
                );
                let user5Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr5Address
                );

                let addr1Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr1Address,
                    user1Tier
                );
                let addr2Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr2Address,
                    user2Tier
                );
                let addr3Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr3Address,
                    user3Tier
                );
                let addr4Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr4Address,
                    user4Tier
                );
                let addr5Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr5Address,
                    user5Tier
                );

                let tier1Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,1)
                let tier2Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,2)
                let tier3Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,3)
                let tier4Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,4)

                let tier1stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,1)).add(1);
                let tier2stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,2)).add(1);
                let tier3stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,3)).add(1);
                let tier4stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,4)).add(1);

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

            it("calcul1RoundAmount for user before addWhitelist", async () => {
                let user1Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr1Address
                );
                let user2Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr2Address
                );
                let user3Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr3Address
                );
                let user4Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr4Address
                );
                let user5Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr5Address
                );

                let Tier1Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr1Address,
                    user1Tier
                );
                let Tier2Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr2Address,
                    user2Tier
                );
                let Tier3Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr3Address,
                    user3Tier
                );
                let Tier4Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr4Address,
                    user4Tier
                );
                
                //account1 = Tier1
                //account2 = Tier2 -> Tier1Amount + Tier2Amount
                //account3 = Tier3 -> Tier1Amount + Tier2Amount + Tier3Amount
                //account4 = Tier4 -> Tier1Amount + Tier2Amount + Tier3Amount + Tier4Amount
                //account5 = Tier4 -> Tier1Amount + Tier2Amount + Tier3Amount + Tier4Amount

                let totalaccount1 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr1Address
                ) 
                let totalaccount2 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr2Address
                ) 
                let totalaccount3 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr3Address
                ) 
                let totalaccount4 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr4Address
                ) 
                let totalaccount5 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr5Address
                )
                
                let addAmount1 = Tier1Amount
                let addAmount2 = Tier1Amount.add(Tier2Amount)
                let addAmount3 = Tier1Amount.add(Tier2Amount).add(Tier3Amount)
                let addAmount4 = Tier1Amount.add(Tier2Amount).add(Tier3Amount).add(Tier4Amount)
                let addAmount5 = Tier1Amount.add(Tier2Amount).add(Tier3Amount).add(Tier4Amount)

                expect(totalaccount1).to.be.equal(addAmount1)
                expect(totalaccount2).to.be.equal(addAmount2)
                expect(totalaccount3).to.be.equal(addAmount3)
                expect(totalaccount4).to.be.equal(addAmount4)
                expect(totalaccount5).to.be.equal(addAmount5)
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
                let user1Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr1Address
                );
                let user2Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr2Address
                );
                let user3Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr3Address
                );
                let user4Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr4Address
                );
                let user5Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr5Address
                );

                let addr1Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr1Address,
                    user1Tier
                );
                let addr2Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr2Address,
                    user2Tier
                );
                let addr3Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr3Address,
                    user3Tier
                );
                let addr4Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr4Address,
                    user4Tier
                );
                let addr5Tier = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr5Address,
                    user5Tier
                );

                let tier1Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,1)
                let tier2Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,2)
                let tier3Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,3)
                let tier4Percents = await deployed.l2PublicProxy.tiersPercents(erc20Atoken.address,4)

                let tier1stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,1));
                let tier2stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,2));
                let tier3stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,3));
                let tier4stAccount = (await deployed.l2PublicProxy.tiersCalculAccount(erc20Atoken.address,4));

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

            it("calcul1RoundAmount for user after addWhitelist", async () => {
                let user1Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr1Address
                );
                let user2Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr2Address
                );
                let user3Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr3Address
                );
                let user4Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr4Address
                );
                let user5Tier = await deployed.l2PublicProxyLogic.calculTier(
                    erc20Atoken.address,
                    addr5Address
                );

                let Tier1Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr1Address,
                    user1Tier
                );
                let Tier2Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr2Address,
                    user2Tier
                );
                let Tier3Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr3Address,
                    user3Tier
                );
                let Tier4Amount = await deployed.l2PublicProxyLogic.calculTierAmount(
                    erc20Atoken.address,
                    addr4Address,
                    user4Tier
                );
                
                //account1 = Tier1
                //account2 = Tier2 -> Tier1Amount + Tier2Amount
                //account3 = Tier3 -> Tier1Amount + Tier2Amount + Tier3Amount
                //account4 = Tier4 -> Tier1Amount + Tier2Amount + Tier3Amount + Tier4Amount
                //account5 = Tier4 -> Tier1Amount + Tier2Amount + Tier3Amount + Tier4Amount

                let totalaccount1 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr1Address
                ) 
                let totalaccount2 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr2Address
                ) 
                let totalaccount3 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr3Address
                ) 
                let totalaccount4 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr4Address
                ) 
                let totalaccount5 = await deployed.l2PublicProxyLogic.calcul1RoundAmount(
                    erc20Atoken.address,
                    addr5Address
                )
                
                let addAmount1 = Tier1Amount
                let addAmount2 = Tier1Amount.add(Tier2Amount)
                let addAmount3 = Tier1Amount.add(Tier2Amount).add(Tier3Amount)
                let addAmount4 = Tier1Amount.add(Tier2Amount).add(Tier3Amount).add(Tier4Amount)
                let addAmount5 = Tier1Amount.add(Tier2Amount).add(Tier3Amount).add(Tier4Amount)

                expect(totalaccount1).to.be.equal(addAmount1)
                expect(totalaccount2).to.be.equal(addAmount2)
                expect(totalaccount3).to.be.equal(addAmount3)
                expect(totalaccount4).to.be.equal(addAmount4)
                expect(totalaccount5).to.be.equal(addAmount5)
            })
        })

        describe("# round1 Sale", () => {
            it("can not attend before round1 startTime", async () => {
                round1addr1Amount = ethers.utils.parseUnits("300", 18);
                // await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round1addr1Amount)
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address, {value: round1addr1Amount})
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
                //original logic amount
                round1addr1Amount = ethers.utils.parseUnits("300", 18);
                round1addr2Amount = ethers.utils.parseUnits("600", 18);
                round1addr3Amount = ethers.utils.parseUnits("1100", 18);
                round1addr4Amount = ethers.utils.parseUnits("1500", 18);
                round1addr5Amount = ethers.utils.parseUnits("1500", 18);

                //change logic amount
                round1addr1Amount = ethers.utils.parseUnits("60", 18);
                round1addr2Amount = ethers.utils.parseUnits("210", 18);
                round1addr3Amount = ethers.utils.parseUnits("576", 18);
                round1addr4Amount = ethers.utils.parseUnits("2076", 18);
                round1addr5Amount = ethers.utils.parseUnits("2076", 18);

                // await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round1addr1Amount)
                // await tonContract.connect(addr2).approve(deployed.l2PublicProxy.address, round1addr2Amount)
                // await tonContract.connect(addr3).approve(deployed.l2PublicProxy.address, round1addr3Amount)
                // await tonContract.connect(addr4).approve(deployed.l2PublicProxy.address, round1addr4Amount)
                // await tonContract.connect(addr5).approve(deployed.l2PublicProxy.address, round1addr5Amount)

                await deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address,{ value: round1addr1Amount })
                await deployed.l2PublicProxyLogic.connect(addr2).round1Sale(erc20Atoken.address,{ value: round1addr2Amount })
                await deployed.l2PublicProxyLogic.connect(addr3).round1Sale(erc20Atoken.address,{ value: round1addr3Amount })
                await deployed.l2PublicProxyLogic.connect(addr4).round1Sale(erc20Atoken.address,{ value: round1addr4Amount })
                await deployed.l2PublicProxyLogic.connect(addr5).round1Sale(erc20Atoken.address,{ value: round1addr5Amount })
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
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address,{ value : round1addr1Amount })
                await expect(tx).to.be.revertedWith("don't over buy")
            })
        })

        describe("# round2 Sale", () => {
            it("can not attend before round2 startTime", async () => {
                round2Amount = ethers.utils.parseUnits("1000", 18);
                // await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round2Amount)
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round2Sale(erc20Atoken.address,{value: round2Amount})
                await expect(tx).to.be.revertedWith("not depositTime")
            })

            it("duration the time", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [round2StartTime+1]);
                await ethers.provider.send('evm_mine');

                // await time.increaseTo(round2StartTime+86400);
            })

            it("can not round1Sale attend after round1Sale EndTime", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round1Sale(erc20Atoken.address,{ value :round1addr1Amount })
                await expect(tx).to.be.revertedWith("end round1SaleTime")
            })

            it("can round2Sale after round2Sale StartTime", async () => {
                // await tonContract.connect(addr1).approve(deployed.l2PublicProxy.address, round2Amount)
                // await tonContract.connect(addr2).approve(deployed.l2PublicProxy.address, round2Amount)
                // await tonContract.connect(addr3).approve(deployed.l2PublicProxy.address, round2Amount)
                // await tonContract.connect(addr4).approve(deployed.l2PublicProxy.address, round2Amount)
                // await tonContract.connect(addr5).approve(deployed.l2PublicProxy.address, round2Amount)

                await deployed.l2PublicProxyLogic.connect(addr1).round2Sale(erc20Atoken.address,{ value: round2Amount })
                await deployed.l2PublicProxyLogic.connect(addr2).round2Sale(erc20Atoken.address,{ value: round2Amount })
                await deployed.l2PublicProxyLogic.connect(addr3).round2Sale(erc20Atoken.address,{ value: round2Amount })
                await deployed.l2PublicProxyLogic.connect(addr4).round2Sale(erc20Atoken.address,{ value: round2Amount })
                await deployed.l2PublicProxyLogic.connect(addr5).round2Sale(erc20Atoken.address,{ value: round2Amount })
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
                let addr1round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr1Address,0)
                let addr2round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr2Address,0)
                let addr3round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr3Address,0)
                let addr4round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr4Address,0)
                let addr5round2Amount = await deployed.l2PublicProxyLogic.calculOpenSaleAmount(erc20Atoken.address,addr5Address,0)

                let calcultokenAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,round2Amount);

                expect(addr1round2Amount).to.be.equal(addr2round2Amount)
                expect(addr2round2Amount).to.be.equal(addr3round2Amount)
                expect(addr3round2Amount).to.be.equal(addr4round2Amount)
                expect(addr4round2Amount).to.be.equal(addr5round2Amount)
                expect(addr5round2Amount).to.be.equal(addr1round2Amount)
            })

            it("openSaleUserAmount check", async () => {
                let addr1round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr1Address)
                let addr2round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr2Address)
                let addr3round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr3Address)
                let addr4round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr4Address)
                let addr5round2Amount = await deployed.l2PublicProxyLogic.openSaleUserAmount(erc20Atoken.address,addr5Address)

                let calcultokenAmount = await deployed.l2PublicProxyLogic.calculSaleToken(erc20Atoken.address,round2Amount);

                expect(addr1round2Amount._refundAmount).to.be.equal(0)
                expect(addr2round2Amount._refundAmount).to.be.equal(0)
                expect(addr3round2Amount._refundAmount).to.be.equal(0)
                expect(addr4round2Amount._refundAmount).to.be.equal(0)
                expect(addr5round2Amount._refundAmount).to.be.equal(0)

                expect(addr1round2Amount._realPayAmount).to.be.equal(round2Amount)
                expect(addr2round2Amount._realPayAmount).to.be.equal(round2Amount)
                expect(addr3round2Amount._realPayAmount).to.be.equal(round2Amount)
                expect(addr4round2Amount._realPayAmount).to.be.equal(round2Amount)
                expect(addr5round2Amount._realPayAmount).to.be.equal(round2Amount)

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
                let tx = deployed.l2PublicProxyLogic.connect(addr1).round2Sale(erc20Atoken.address,{ value: round2Amount })
                await expect(tx).to.be.revertedWith("end depositTime")
            })
        })

        describe("# claim", () => {
            it("currentRound test", async () => {
                expect(await deployed.l2PublicProxyLogic.currentRound(erc20Atoken.address)).to.be.equal(0)
            })
            it("calculClaimAmount test", async () => {
                let tx = await deployed.l2PublicProxyLogic.calculClaimAmount(
                    erc20Atoken.address,
                    addr1Address,
                    0
                )
                console.log("calculAmount :", tx);

            })
            it("claim fail before claimTime1", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("not claimTime")
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [firstClaimTime+1]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after firstClaimTime", async () => {
                expect(await erc20Atoken.balanceOf(addr1Address)).to.be.equal(0)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,1)
                console.log()
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
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
                await ethers.provider.send('evm_setNextBlockTimestamp', [secondClaimTime+1]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after secondClaimTime", async () => {
                expect(await erc20Atoken.balanceOf(addr2Address)).to.be.equal(0)
                let beforeAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,2)
                let getAddr2Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr2Address,0)
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr2).claim(erc20Atoken.address);

                let afterAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                expect(afterAddr1Amount.sub(beforeAddr1Amount)).to.be.equal(getAddr1Amount._reward)
                expect(await erc20Atoken.balanceOf(addr2Address)).to.be.equal(getAddr2Amount._reward)
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [secondClaimTime+601]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after claimTime3", async () => {
                expect(await erc20Atoken.balanceOf(addr3Address)).to.be.equal(0)
                let beforeAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let beforeAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,3)
                let getAddr2Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr2Address,3)
                let getAddr3Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr3Address,0)
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr2).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr3).claim(erc20Atoken.address);

                let afterAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let afterAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                expect(afterAddr1Amount.sub(beforeAddr1Amount)).to.be.equal(getAddr1Amount._reward)
                expect(afterAddr2Amount.sub(beforeAddr2Amount)).to.be.equal(getAddr2Amount._reward)
                expect(await erc20Atoken.balanceOf(addr3Address)).to.be.equal(getAddr3Amount._reward)
            })

            it("duration the time to period end", async () => {
                await ethers.provider.send('evm_setNextBlockTimestamp', [secondClaimTime+1201]);
                await ethers.provider.send('evm_mine');
            })

            it("claim success after claimTime4", async () => {
                expect(await erc20Atoken.balanceOf(addr4Address)).to.be.equal(0)
                let beforeAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let beforeAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let beforeAddr3Amount = await erc20Atoken.balanceOf(addr3Address)
                let beforeAddr4Amount = await erc20Atoken.balanceOf(addr4Address)
                let getAddr1Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr1Address,4)
                let getAddr2Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr2Address,4)
                let getAddr3Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr3Address,4)
                let getAddr4Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr4Address,0)
                let getAddr5Amount = await deployed.l2PublicProxyLogic.calculClaimAmount(erc20Atoken.address,addr5Address,0)
                
                
                await deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr2).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr3).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr4).claim(erc20Atoken.address);
                await deployed.l2PublicProxyLogic.connect(addr5).claim(erc20Atoken.address);

                let afterAddr1Amount = await erc20Atoken.balanceOf(addr1Address)
                let afterAddr2Amount = await erc20Atoken.balanceOf(addr2Address)
                let afterAddr3Amount = await erc20Atoken.balanceOf(addr3Address)
                expect(afterAddr1Amount.sub(beforeAddr1Amount)).to.be.equal(getAddr1Amount._reward)
                expect(afterAddr2Amount.sub(beforeAddr2Amount)).to.be.equal(getAddr2Amount._reward)
                expect(afterAddr3Amount.sub(beforeAddr3Amount)).to.be.equal(getAddr3Amount._reward)
                expect(await erc20Atoken.balanceOf(addr4Address)).to.be.equal(getAddr4Amount._reward)
                expect(await erc20Atoken.balanceOf(addr5Address)).to.be.equal(getAddr5Amount._reward)
            })

            it("if already get Allreward, claim fail", async () => {
                let tx = deployed.l2PublicProxyLogic.connect(addr1).claim(erc20Atoken.address)
                await expect(tx).to.be.revertedWith("no purchase amount")
                let tx2 = deployed.l2PublicProxyLogic.connect(addr5).claim(erc20Atoken.address)
                await expect(tx2).to.be.revertedWith("no purchase amount")
            })

            it("PublicSale have TON for saleToken", async () => {
                // expect(await tonContract.balanceOf(deployed.l2PublicProxy.address)).to.be.equal(contractHaveTON);
                console.log(await provider.getBalance(deployed.l2PublicProxy.address));
                expect(await provider.getBalance(deployed.l2PublicProxy.address)).to.be.equal(contractHaveTON);
            })

            it("check the saleToken amount", async () => {
                let amount1 = await erc20Atoken.balanceOf(addr1Address)
                let amount2 = await erc20Atoken.balanceOf(addr2Address)
                let amount3 = await erc20Atoken.balanceOf(addr3Address)
                let amount4 = await erc20Atoken.balanceOf(addr4Address)
                let amount5 = await erc20Atoken.balanceOf(addr5Address)
                console.log("amount1 : ", amount1)
                console.log("amount2 : ", amount2)
                console.log("amount3 : ", amount3)
                console.log("amount4 : ", amount4)
                console.log("amount5 : ", amount5)
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
                let amount1 = ethers.utils.parseUnits("1", 27);
                expect(await tosContract.balanceOf(deployed.l2LiquidityProxy.address)).to.be.equal(0)
                let tx = deployed.l2PublicProxyLogic.connect(l2ProjectManager).exchangeWTONtoTOS(erc20Atoken.address,amount1)
                await expect(tx).to.be.revertedWith("amountIn over")
            })

            it("anybody can execute exchangeWTONtoTOS", async () => {
                // let changeTick = await deployed.l2PublicProxyLogic.changeTick();
                // console.log("changeTick :", changeTick)
                let amount1 = ethers.utils.parseUnits("1", 15);
                expect(await tosContract.balanceOf(deployed.l2LiquidityProxy.address)).to.be.equal(0)
                await deployed.l2PublicProxyLogic.connect(l2ProjectManager).exchangeWTONtoTOS(erc20Atoken.address,amount1)
                // console.log(await tosContract.balanceOf(deployed.l2LiquidityProxy.address))
                expect(await tosContract.balanceOf(deployed.l2LiquidityProxy.address)).to.be.gt(0)
            })
        })
    })
});

