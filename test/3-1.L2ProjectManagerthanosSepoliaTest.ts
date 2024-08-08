import { expect } from './shared/expect'
import { ethers, network } from 'hardhat'

import { BigNumber, Signer, providers } from 'ethers'
import { l2ProjectLaunchFixtures, l1Fixtures } from './shared/fixtures'
import { L2ProjectLaunchFixture, L1Fixture } from './shared/fixtureInterfaces'
import { getPublicSaleParams, getInitialLiquidityParams, getLpRewardParams,
    getTosAirdropParams, getTonAirdropParams, getScheduleParams, getNonScheduleParams } from './shared/vaultParameters'

import ERC20A from './abi/ERC20A.json'
import ERC20B from './abi/ERC20B.json'
import ERC20C from './abi/ERC20C.json'
import ERC20D from './abi/ERC20D.json'
import L2StandardERC20 from './abi/L2StandardERC20.json'
import snapshotGasCost from './shared/snapshotGasCost'

import { time, setBalance } from "@nomicfoundation/hardhat-network-helpers";

import l2PublicSaleJson from "../artifacts/contracts/L2/vaults/L2PublicSaleVault.sol/L2PublicSaleVault.json";
import l2PublicSaleProxyJson from "../artifacts/contracts/L2/vaults/L2PublicSaleProxy.sol/L2PublicSaleProxy.json";
import l2PublicSaleVaultProxyJson from "../artifacts/contracts/L2/vaults/L2PublicSaleVaultProxy.sol/L2PublicSaleVaultProxy.json"
import l2ProjectManagerJson from "../artifacts/contracts/L2/L2ProjectManager.sol/L2ProjectManager.json";
import l1BurnVaultJson from "../artifacts/contracts/L1/L1BurnVault.sol/L1BurnVault.json";

const Web3EthAbi = require('web3-eth-abi');
const TON_ABI = require("../abis/TON.json");
const TOS_ABI = require("../abis/TOS.json");
const ERC20_ABI = require("../abis/TestERC20.json");

const univ3prices = require('@thanpolas/univ3prices')

describe('L2ProjectManager distributesL2Token', () => {
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
    let contractHaveTON = ethers.utils.parseUnits("10000", 18);

    let refundTONAmount = ethers.utils.parseUnits("9996", 17);
    let realPayRound2Amount = ethers.utils.parseUnits("10004", 17);

    let fundClaimTime1: any, fundClaimTime2: any, fundClaimTime3: any
    let fundClaimPercent1 = 40;
    let fundClaimPercent2 = 70;
    let fundClaimPercent3 = 100;

    let sendether = "0xF3F20B8DFA69D00000"

    let transferTON = ethers.utils.parseUnits("3500", 18);

    const provider = ethers.provider;

	let l2PublicSaleProxyDeployment: any;
	let l2PublicSaleProxy: any;
	let l2PublicSaleProxyContract: any;
	let l2PublicSaleVaultProxy: any;
	let l2ProjectManagerContract: any;

	//sepolia test Addr
	let l2PublicSaleVaultProxyAddr = "0x79Fb9a33B643DFFea19F1e797d28aBf453435Aa2";
	let l2ProjectManagerAddr = "0x20f4b34715754A7482a685E889732eD708637896";

	let l1Token = "0x47B89d0cE2F4B344F8165F94FB9bF3ca157372F6"
	let l2Token = "0x7dd3D276f985980328602a4Db59A8d0DA675E810"
	const L2TOS = "0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC"
	const L2TON = "0x4200000000000000000000000000000000000006"

	let projectId = ethers.BigNumber.from("6");
	let initialTotalSupply = ethers.utils.parseEther("100000")

    let vaultCount = BigNumber.from("10")

	let totalClaimCount: any;
	let firstClaimAmount: any;
	let roundIntervalTime: any;

	let initialLiquidityAmount = initialTotalSupply.div(vaultCount)
    let rewardTonTosPoolAmount = initialLiquidityAmount
    let rewardProjectTosPoolAmount = initialLiquidityAmount
    let daoAmount = initialLiquidityAmount
    let teamAmount = initialLiquidityAmount
    let marketingAmount = initialLiquidityAmount
    let airdropStosAmount = initialLiquidityAmount
    let airdropTonAmount = initialLiquidityAmount
    let publisSaleAmount = initialLiquidityAmount.add(initialLiquidityAmount)

	let sTime = Math.floor(Date.now() / 1000) + (60*60*24)

    let publicSaleParams: any;

	let tosPrice = 1e18;
    let tokenPrice = 10e18;

    let token0Price = tosPrice;
    let token1Price = tokenPrice;

	let sqrtPrice: any;
    let initialVaultParams: any;
    let rewardParams: any;
	let rewardTonTosPoolParams: any;
	let rewardProjectTosPoolParams: any;
    let tosAirdropParams: any;
    let tonAirdropParams: any;
    let daoParams: any;
    let teamParams: any;
    let marketingParams: any;
    let tokamakVaults: any;

    let customScheduleVaults: any;
    let customNonScheduleVaults: any;

    before('create fixture loader', async () => {
        [deployer] = await ethers.getSigners();
        // deployer = deployed.deployer;

    })

	describe("# Deploy & Setting L2PublicSaleProxy", () => {
		it("Deployed the L2PublicSaleProxy", async () => {
			l2PublicSaleProxyDeployment = await ethers.getContractFactory("L2PublicSaleProxy");
    		l2PublicSaleProxy = (await l2PublicSaleProxyDeployment.connect(deployer).deploy())
		})

		it("Get the L2PublicSaleVaultProxy", async () => {
			l2PublicSaleVaultProxy = await ethers.getContractAt(
                l2PublicSaleVaultProxyJson.abi,
                l2PublicSaleVaultProxyAddr,
                deployer
            )
		})

		it("L2PublicSaleVaultProxy setImplementation2 L2PublicSaleProxy", async () => {
            await l2PublicSaleVaultProxy.connect(deployer).setImplementation2(l2PublicSaleProxy.address, 1, true)
        })

		it("L2PublicSaleVaultProxy Set the ProxySetting", async () => {
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
            // console.log("test select : ", _vaultInitialize);

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

            // console.log("vaultInitialize select : ", _vaultInitialize2);

            const _vaultInitialize3 = Web3EthAbi.encodeFunctionSignature(
                "vaultInitialize(address,(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256),(uint256,uint256,uint256,uint256,uint256),(address,uint256,uint256,uint256,uint256,uint256,uint24)"
            )

            // console.log("test select3 : ", _vaultInitialize3);

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

            // console.log("_vaultInitialize4 select : ", _vaultInitialize4);

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

            await l2PublicSaleVaultProxy.connect(deployer).setSelectorImplementations2(
                [
                    _setL2ProjectManager,_setBurnBridge,_initialize,_setAddress,_setMaxMinPercent,
                    _setSTOSstandard,_setDelayTime,_setVaultAdmin,_vaultInitialize4,
                    _setTier,_setTierPercents,_setAllAmount,_set1RoundTime,_set2RoundTime,_setClaimTime,
                    _isL2ProjectManager,_isVaultAdmin,_isL2Token
                ],
                l2PublicSaleProxy.address
            )
		})

		it("connect L2PublicSaleProxy", async () => {
            l2PublicSaleProxyContract = await ethers.getContractAt(
				l2PublicSaleProxyJson.abi,
				l2PublicSaleVaultProxy.address,
				deployer
			);
        })


	})

	describe("#distributesL2TokenOwner Test", () => {
		it("set the Params", async () => {
			const block = await provider.getBlock('latest')

			setSnapshot = block.timestamp + (60*60*7);
			whitelistStartTime = setSnapshot + 400;
			whitelistEndTime = whitelistStartTime + (86400*7);
			round1StartTime = whitelistEndTime + 1;
			round1EndTime = round1StartTime + (86400*7);
			round2StartTime = round1EndTime + 1;
			round2EndTime = round2StartTime + (86400*7);

			firstClaimTime = round2EndTime + (86400 * 20);
			totalClaimCount = BigNumber.from("4")
			firstClaimAmount = teamAmount.div(BigNumber.from("4"))
			roundIntervalTime = 60*60*24*7;
			secondClaimTime =  firstClaimTime + roundIntervalTime
			fundClaimTime1 = secondClaimTime + 3000
			fundClaimTime2 = fundClaimTime1 + 100
			changeTOS = 10;
			firstClaimPercent = 4000;
			roundInterval = 600;      //1분
			fee = 3000;

			let tier1 = ethers.utils.parseEther("100")
			let tier2 = ethers.utils.parseEther("200")
			let tier3 = ethers.utils.parseEther("1000")
			let tier4 = ethers.utils.parseEther("4000")

			publicSaleParams =  getPublicSaleParams (
				[tier1,tier2,tier3,tier4], //tier
                [600,1200,2200,6000], // percentage
                [initialLiquidityAmount,initialLiquidityAmount], //amount
                [200,2000], // price saleTokenPrice, payTokenPrice
                100*1e18, //hardcapAmount
                changeTOS, //changeTOSPercent
                [whitelistStartTime,whitelistEndTime,round1StartTime,round1EndTime,setSnapshot, round2StartTime,round2EndTime], //times
                totalClaimCount.toNumber(), //claimCounts
                firstClaimPercent, //firstClaimPercent
                firstClaimTime, //firstClaimTime
                secondClaimTime, //secondClaimTime: number,
                roundIntervalTime, //roundInterval: number,
                deployer.address,  // receiveAddress,
                4, // vestingClaimCounts: number,
                firstClaimPercent, // vestingfirstClaimPercent: number,
                fundClaimTime1, // vestingClaimTime1: number,
                fundClaimTime2, // vestingClaimTime2: number,
                roundInterval, // vestingRoundInterval: number,
                fee, // fee: number
			);

			if(L2TOS > l2Token) {
				token0Price = tokenPrice;
				token1Price = tosPrice;
			}

			sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(token0Price, token1Price);

			initialVaultParams = getInitialLiquidityParams(
				initialLiquidityAmount,
				tosPrice / 1e18,
				token1Price / 1e18,
				sqrtPrice.toString(),
				sTime,
				3000
			);

			// rewardParams = getLpRewardParams(deployer.address, ethers.constants.AddressZero, 0, 0, 0, 0, 0, 0);
			// rewardParams = getLpRewardParams(deployer.address, ethers.constants.AddressZero, ethers.constants.AddressZero, 0, 0, 0, 0, 0, 0, 0);
			rewardTonTosPoolParams = getLpRewardParams(
				ethers.constants.AddressZero,
				L2TON,
				L2TOS,
				3000,
				rewardTonTosPoolAmount,
				totalClaimCount.toNumber(),
				firstClaimAmount, //firstClaimAmount
				firstClaimTime, //firstClaimTime
				secondClaimTime, //secondClaimTime
				roundIntervalTime //roundIntervalTime
			);

			rewardProjectTosPoolParams = getLpRewardParams(
				ethers.constants.AddressZero,
				l2Token,
				L2TOS,
				3000,
				rewardProjectTosPoolAmount,
				totalClaimCount.toNumber(),
				firstClaimAmount, //firstClaimAmount
				firstClaimTime, //firstClaimTime
				secondClaimTime, //secondClaimTime
				roundIntervalTime //roundIntervalTime
			);

			tosAirdropParams =  getTosAirdropParams(
				ethers.constants.AddressZero,
				airdropStosAmount,
				totalClaimCount.toNumber(),
				firstClaimAmount,
				firstClaimTime,
				secondClaimTime,
				roundIntervalTime
			);

			tonAirdropParams = getTonAirdropParams(
				ethers.constants.AddressZero,
				airdropTonAmount,
				totalClaimCount.toNumber(),
				firstClaimAmount,
				firstClaimTime,
				secondClaimTime,
				roundIntervalTime
			);

			daoParams = getNonScheduleParams(
				"DAO",
				deployer.address,
				daoAmount
			);

			teamParams =  getScheduleParams(
				"TEAM",
				deployer.address,
				teamAmount, //totalAllocatedAmount
				totalClaimCount.toNumber(), // totalClaimCount
				firstClaimAmount, //firstClaimAmount
				firstClaimTime, //firstClaimTime
				secondClaimTime, //secondClaimTime
				roundIntervalTime //roundIntervalTime
				);

			marketingParams =  getScheduleParams(
				"MARKETING",
				deployer.address,
				marketingAmount, //totalAllocatedAmount
				totalClaimCount.toNumber(), // totalClaimCount 4
				firstClaimAmount, //firstClaimAmount
				firstClaimTime, //firstClaimTime
				secondClaimTime, //secondClaimTime
				roundIntervalTime //roundIntervalTime
			);

			tokamakVaults = {
				publicSaleParams: publicSaleParams,
				initialVaultParams: initialVaultParams,
				rewardTonTosPoolParams: rewardTonTosPoolParams,
        		rewardProjectTosPoolParams: rewardProjectTosPoolParams,
				tosAirdropParams: tosAirdropParams,
				tonAirdropParams: tonAirdropParams
			}

			customScheduleVaults = [teamParams, marketingParams]
			customNonScheduleVaults = [daoParams]

		})

		it("get L2ProjectManager", async () => {
			l2ProjectManagerContract = await ethers.getContractAt(
				l2ProjectManagerJson.abi,
				l2ProjectManagerAddr,
				deployer
			);
		})

		it("projectOwner check", async () => {
			let getProjectOwner = await l2ProjectManagerContract.projects(l2Token);
			// console.log("getProjectOwner : ", getProjectOwner.projectOwner);
			// console.log("deployer.address :", deployer.address);
			expect(deployer.address).to.be.equal(getProjectOwner.projectOwner);
		})

		it("distributesL2TokenOwner", async () => {
			// console.log("l1Token :", l1Token)
			// console.log("l2Token :", l2Token)
			// console.log("projectId :", projectId)
			// console.log("initialTotalSupply :", initialTotalSupply)
			// console.log("tokamakVaults :", tokamakVaults)
			// console.log("customScheduleVaults :", customScheduleVaults)
			// console.log("customNonScheduleVaults :", customNonScheduleVaults)
			await l2ProjectManagerContract.connect(deployer).distributesL2TokenOwner(
				l1Token,
				l2Token,
				projectId,
				initialTotalSupply,
				tokamakVaults,
				customScheduleVaults,
				customNonScheduleVaults
			)

		})
	})

});

