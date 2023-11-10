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

    //titan
    let titanTON = "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2"

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
    let testAccount3 = "0x24884B9A47049B7663aEdaC7c7C91afd406EA09e"
    let richTON: Signer;
    let richTOS: Signer;

    let titanAccount: Signer;

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

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [testAccount3],
        });

        titanAccount = await ethers.getSigner(testAccount3);        //ton주인


    })

    describe('# l2 account test', () => {
        it("setting the TON Contract", async () => {
            tonContract = await ethers.getContractAt(TON_ABI.abi, titanTON, deployer)
        })

        
        it('l2 account balanceOf', async () => {
            let tx = await tonContract.balanceOf(titanAccount.address);
            console.log(tx);
        })

        it("deploy test", async () => {
            const TON_ = await ethers.getContractFactory('TON');
            const ton = (await TON_.connect(deployer).deploy())
        })
    });

});

