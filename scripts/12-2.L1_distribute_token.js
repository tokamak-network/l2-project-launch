
const {ethers} = require("ethers")
const { Wallet, BigNumber}  = require("ethers")
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
require('dotenv').config()

const {
    getL1Provider,
  readContracts,
  deployedContracts,
  getSigners,
  bridge,
  messenger,
  addressManager,
  tonAddrs } = require("./common_func");

const {
    getPublicSaleParams, getInitialLiquidityParams, getLpRewardParams,
    getTosAirdropParams, getTonAirdropParams, getScheduleParams, getNonScheduleParams }
    = require("../test/shared/vaultParameters")

const univ3prices = require('@thanpolas/univ3prices')
const ERC20AJson = require("./abi/ERC20A.json")
// Global variable because we need them almost everywhere
let ourAddr               // The address of the signer we use.
let l1Signer , l2Signer
let wallets;

let projectInfo;
projectInfo = {
    projectId :  ethers.constants.Zero,
    tokenOwner: null,
    projectOwner: null,
    initialTotalSupply: ethers.utils.parseEther("100000"),
    tokenType: ethers.constants.Zero, // non-mintable
    projectName: 'Test9',
    tokenName: 'Test9',
    tokenSymbol: 'T9T',
    l1Token: ethers.constants.AddressZero,
    l2Token: ethers.constants.AddressZero,
    l2Type: 0,
    addressManager: ethers.constants.AddressZero
}

let projectId = ethers.BigNumber.from("78");

const L2Token = "0xB3DEA65cE777Df54CAf6D8C9A1Ac38b29510ee39"
const L2TOS = "0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC"
const L2TON = "0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa"

const setup = async() => {
  wallets = await getSigners()
  l1Signer = wallets.l1Wallet;
  l2Signer = wallets.l2Wallet;
  ourAddr = wallets.l1Wallet.address

  // console.log('crossChainMessenger',crossChainMessenger);

  // l1Bridge = new ethers.Contract(bridge.l1Bridge, BridgeABI, l1Signer)
  // l1ERC20 = new ethers.Contract(erc20Addrs.l1Addr, IERC20Artifact.abi, l1Signer)
  // l2ERC20 = new ethers.Contract(erc20Addrs.l2Addr, IERC20Artifact.abi, l2Signer)

}    // setup

async function main() {
    const { addressManager } = await hre.getNamedAccounts();

    let L1Contracts = await readContracts(__dirname+'/../deployments/goerli');
    let L2Contracts = await readContracts(__dirname+'/../deployments/titangoerli');
    await setup();
    const deployedL1 = await deployedContracts(L1Contracts.names, L1Contracts.abis, l1Signer);
    const deployedL2 = await deployedContracts(L2Contracts.names, L2Contracts.abis, l2Signer);
    const L1ProjectManager = new ethers.Contract(L1Contracts.abis["L1ProjectManagerProxy"].address, L1Contracts.abis["L1ProjectManager"].abi, l1Signer)
    console.log('ourAddr', ourAddr)
    projectInfo.projectId = projectId;

    let projects = await L1ProjectManager.projects(projectInfo.projectId)
    projectInfo.tokenOwner = projects.tokenOwner;
    projectInfo.projectOwner = projects.projectOwner;
    projectInfo.addressManager = projects.addressManager;
    projectInfo.l1Token = projects.l1Token;
    projectInfo.l2Token = L2Token;

    console.log('projectInfo', projectInfo)

    // test vaults :
    // initialLiquidityVault, tontosReward, prokectTokenTosReward, DAO,
    // Team, Marketing , airdropStos, airdropTon
    let vaultCount = BigNumber.from("10")

    let initialLiquidityAmount = ethers.BigNumber.from("15000000000000000000000")
    let rewardTonTosPoolAmount = ethers.BigNumber.from("6668000000000000000000")
    let rewardProjectTosPoolAmount = ethers.BigNumber.from("35000000000000000000000")
    let daoAmount = ethers.BigNumber.from("0")
    let teamAmount = ethers.BigNumber.from("0")
    let marketingAmount = ethers.BigNumber.from("0")
    let airdropStosAmount = ethers.BigNumber.from("6666000000000000000000")
    let airdropTonAmount = ethers.BigNumber.from("6666000000000000000000")
    let publisSaleAmount = ethers.BigNumber.from("30000000000000000000000")

    let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
    const block = await l1Signer.provider.getBlock('latest')

    const setSnapshot = 1708531217;
    const whitelistStartTime = 1708538417;
    const whitelistEndTime = 1708545617;
    const round1StartTime = 1708552817;
    const round1EndTime = 1708560017;
    const round2StartTime = 1708567217;
    const round2EndTime = 1708574417;

    const firstClaimTime = 1708578017;
    let totalClaimCount = BigNumber.from("3")
    let firstClaimAmount = teamAmount.div(BigNumber.from("4"))
    let roundIntervalTime = 2629743;
    let secondClaimTime =  1711207760
    const fundClaimTime1 = 1711207760
    const fundClaimTime2 = 1713837503
    let changeTOS = 10;
    let firstClaimPercent = 4000;
    let roundInterval = 600;      //1분
    let fee = 3000;


    // let firstClaimTime = sTime
    // let totalClaimCount = BigNumber.from("4")
    // let firstClaimAmount = teamAmount.div(totalClaimCount)
    // let roundIntervalTime = 60*60*24*7;
    // let secondClaimTime =  firstClaimTime + roundIntervalTime

    let publicSaleParams = {
        vaultParams: {
            stosTier1: '100000000000000000000',
            stosTier2: '200000000000000000000',
            stosTier3: '1000000000000000000000',
            stosTier4: '4000000000000000000000',
            tier1Percents: 2500,
            tier2Percents: 2500,
            tier3Percents: 2500,
            tier4Percents: 2500,
            total1roundSaleAmount: '15000000000000000000000',
            total2roundSaleAmount: '15000000000000000000000',
            saleTokenPrice: '200000000000000000000',
            payTokenPrice: '2000000000000000000000',
            hardcapAmount: '100000000000000000000',
            changeTOSPercent: 10,
            startWhiteTime: 1708538417,
            endWhiteTime: 1708545617,
            start1roundTime: 1708552817,
            end1roundTime: 1708560017,
            snapshotTime: 1708531217,
            start2roundTime: 1708567217,
            end2roundTime: 1708574417
        },
        claimParams: {
            claimCounts: 3,
            firstClaimPercent: 3333,
            firstClaimTime: 1708578017,
            secondClaimTime: 1711207760,
            roundInterval: 2629743
        },
        vestingParams: {
            receiveAddress: '0xAA5a562B2C3CA302aFa35db0b94738A7384d6aA3',
            totalClaimCount: 3,
            firstClaimPercent: 3333,
            firstClaimTime: 1711207760,
            secondClaimTime: 1713837503,
            roundIntervalTime: 2629743,
            fee: 3000
        }
    }
     // console.log(publicSaleParams)
     let publicVaultcheck = await L1ProjectManager.validationPublicSaleVaults(
        publicSaleParams
    )
    console.log(publicVaultcheck.valid)

    if(publicVaultcheck.valid == false) {
        console.log('validationPublicSaleVaults false')
        console.log('publicSaleParams ', publicSaleParams)

        return;
    }
    let tosPrice = 1e18;
    let tokenPrice = 10e18;

    let token0Price = tosPrice;
    let token1Price = tokenPrice;

    if(L2TOS > projectInfo.l2Token) {
        token0Price = tokenPrice;
        token1Price = tosPrice;
    }
    const sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(token0Price, token1Price);

    let initialVaultParams = {
        totalAllocatedAmount: initialLiquidityAmount,
        tosPrice: ethers.BigNumber.from('1000000000000000000') ,
        tokenPrice: ethers.BigNumber.from('1000000000000000000') ,
        initSqrtPrice: '250541448375047931186413801569',
        startTime: 1708578017,
        fee: 3000
    }

    let rewardTonTosPoolParams = {
        poolParams: {
            token0: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
            token1: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
            fee: 3000
        },
        params: {
            claimer: '0x0000000000000000000000000000000000000000',
            totalAllocatedAmount: '6668000000000000000000',
            totalClaimCount: 3,
            firstClaimAmount: '3334000000000000000000',
            firstClaimTime: 1708578017,
            secondClaimTime: 1711207760,
            roundIntervalTime: 2629743
        }
    }
    let rewardProjectTosPoolParams = {
        poolParams: {
            token0: L2Token,
            token1: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
            fee: 3000
        },
        params: {
            claimer: '0x0000000000000000000000000000000000000000',
            totalAllocatedAmount: rewardProjectTosPoolAmount,
            totalClaimCount: 3,
            firstClaimAmount: '11666660000000000000000',
            firstClaimTime: 1708578017,
            secondClaimTime: 1711207760,
            roundIntervalTime: 2629743
        }
    }
    airdropStosAmount = ethers.BigNumber.from('6666000000000000000000')

    let tosAirdropParams =  {
        claimer: '0x0000000000000000000000000000000000000000',
        totalAllocatedAmount: airdropStosAmount,
        totalClaimCount: 3,
        firstClaimAmount: '3333000000000000000000',
        firstClaimTime: 1708578017,
        secondClaimTime: 1711207760,
        roundIntervalTime: 2629743
    }

    airdropTonAmount = ethers.BigNumber.from('6666000000000000000000');
    let tonAirdropParams = {
        claimer: '0x0000000000000000000000000000000000000000',
        totalAllocatedAmount: airdropTonAmount,
        totalClaimCount: 3,
        firstClaimAmount: '3333000000000000000000',
        firstClaimTime: 1708578017,
        secondClaimTime: 1711207760,
        roundIntervalTime: 2629743
    }

    let tokamakVaults = {
        publicSaleParams: publicSaleParams,
        initialVaultParams : initialVaultParams,
        rewardTonTosPoolParams: rewardTonTosPoolParams,
        rewardProjectTosPoolParams: rewardProjectTosPoolParams,
        tosAirdropParams: tosAirdropParams,
        tonAirdropParams: tonAirdropParams
    }
    // console.log('tokamakVaults' ,tokamakVaults )
    let customScheduleVaults = []
    let customNonScheduleVaults = []

    // console.log('initialVaultParams' , initialVaultParams)
    // console.log('customScheduleVaults' , customScheduleVaults)
    // console.log('rewardTonTosPoolParams' , rewardTonTosPoolParams)
    // console.log('rewardProjectTosPoolParams' , rewardProjectTosPoolParams)

    let check_validateTokamakVaults = await L1ProjectManager.validateTokamakVaults(tokamakVaults)
    console.log(check_validateTokamakVaults)

    let validationVaultsParameters = await L1ProjectManager.validationVaultsParameters(
        projectInfo.initialTotalSupply,
        tokamakVaults,
        customScheduleVaults,
        customNonScheduleVaults
    )

    if(validationVaultsParameters.valid == false) {
        console.log('validationVaultsParameters false')

        return;
    }

    const gos = await L1ProjectManager.estimateGas.launchProject(
        projectInfo.projectId,
        projectInfo.l2Token,
        projectInfo.initialTotalSupply,
        tokamakVaults,
        customScheduleVaults,
        customNonScheduleVaults
        )
    console.log('gos', gos)
        //===

    const receipt = await (await L1ProjectManager.launchProject(
        projectInfo.projectId,
        projectInfo.l2Token,
        projectInfo.initialTotalSupply,
        tokamakVaults,
        customScheduleVaults,
        customNonScheduleVaults
        )).wait();

    //--------------------------
    const topic = L1ProjectManager.interface.getEventTopic('LaunchedProject');
    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
    const deployedEvent = L1ProjectManager.interface.parseLog(log);

    console.log(deployedEvent.args)

    const tokenContract = new ethers.Contract(projectInfo.l1Token, ERC20AJson.abi, l1Signer)
    let totalSupply = await tokenContract.totalSupply()
    let balanceOf = await tokenContract.balanceOf(L1ProjectManager.address);
    console.log("l1Token totalSupply", totalSupply)
    console.log("l1Token L1ProjectManager balanceOf", balanceOf)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
