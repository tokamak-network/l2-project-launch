
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
    projectName: 'Test12',
    tokenName: 'Test12',
    tokenSymbol: 'TH12',
    l1Token: ethers.constants.AddressZero,
    l2Token: ethers.constants.AddressZero,
    l2Type: 0,
    addressManager: ethers.constants.AddressZero,
}

let projectId = ethers.BigNumber.from("9");

// const L2Token = "0x2f1854d5c212fc90a85df21c63c3b4d328249e06"
const L2Token = "0xda5854B16E4a9190Bc7515972C4F29708f571Cf0"
const L2TOS = "0xec32659a42904a96d415468d3a213e57b13ee5c0"
const L2TON = "0x4200000000000000000000000000000000000006"

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

    let L1Contracts = await readContracts(__dirname+'/../deployments/sepolia');
    let L2Contracts = await readContracts(__dirname+'/../deployments/thanossepolia');
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

    let initialLiquidityAmount = projectInfo.initialTotalSupply.div(vaultCount)
    let rewardTonTosPoolAmount = initialLiquidityAmount
    let rewardProjectTosPoolAmount = initialLiquidityAmount
    let daoAmount = initialLiquidityAmount
    let teamAmount = initialLiquidityAmount
    let marketingAmount = initialLiquidityAmount
    let airdropStosAmount = initialLiquidityAmount
    let airdropTonAmount = initialLiquidityAmount
    let publisSaleAmount = initialLiquidityAmount.add(initialLiquidityAmount)


    let sTime = Math.floor(Date.now() / 1000) + (60*60*24)
    const block = await l1Signer.provider.getBlock('latest')

    const setSnapshot = block.timestamp + (60*60*7);
    const whitelistStartTime = setSnapshot + 400;
    const whitelistEndTime = whitelistStartTime + (86400*7);
    const round1StartTime = whitelistEndTime + 1;
    const round1EndTime = round1StartTime + (86400*7);
    const round2StartTime = round1EndTime + 1;
    const round2EndTime = round2StartTime + (86400*7);

    const firstClaimTime = round2EndTime + (86400 * 20);
    let totalClaimCount = BigNumber.from("4")
    let firstClaimAmount = teamAmount.div(BigNumber.from("4"))
    let roundIntervalTime = 60*60*24*7;
    let secondClaimTime =  firstClaimTime + roundIntervalTime
    const fundClaimTime1 = secondClaimTime + 3000
    const fundClaimTime2 = fundClaimTime1 + 100
    let changeTOS = 10;
    let firstClaimPercent = 4000;
    let roundInterval = 600;      //1분
    let fee = 3000;

	let tier1 = ethers.utils.parseEther("100")
	let tier2 = ethers.utils.parseEther("200")
	let tier3 = ethers.utils.parseEther("1000")
	let tier4 = ethers.utils.parseEther("4000")

    // let firstClaimTime = sTime
    // let totalClaimCount = BigNumber.from("4")
    // let firstClaimAmount = teamAmount.div(totalClaimCount)
    // let roundIntervalTime = 60*60*24*7;
    // let secondClaimTime =  firstClaimTime + roundIntervalTime

    let publicSaleParams =  getPublicSaleParams (
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
                ourAddr,  // receiveAddress,
                4, // vestingClaimCounts: number,
                firstClaimPercent, // vestingfirstClaimPercent: number,
                fundClaimTime1, // vestingClaimTime1: number,
                fundClaimTime2, // vestingClaimTime2: number,
                roundInterval, // vestingRoundInterval: number,
                fee, // fee: number
        );

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
    let initialVaultParams = getInitialLiquidityParams(
        initialLiquidityAmount,
        tosPrice / 1e18,
        token1Price / 1e18,
        sqrtPrice.toString(),
        sTime,
        3000) ;

    let rewardTonTosPoolParams = getLpRewardParams(
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
    let rewardProjectTosPoolParams = getLpRewardParams(
        ethers.constants.AddressZero,
        projectInfo.l2Token,
        L2TOS,
        3000,
        rewardProjectTosPoolAmount,
        totalClaimCount.toNumber(),
        firstClaimAmount, //firstClaimAmount
        firstClaimTime, //firstClaimTime
        secondClaimTime, //secondClaimTime
        roundIntervalTime //roundIntervalTime
    );

    let tosAirdropParams =  getTosAirdropParams(
        ethers.constants.AddressZero,
        airdropStosAmount,
        totalClaimCount.toNumber(),
        firstClaimAmount,
        firstClaimTime,
        secondClaimTime,
        roundIntervalTime
        );

    let tonAirdropParams =  getTonAirdropParams(
        ethers.constants.AddressZero,
        airdropTonAmount,
        totalClaimCount.toNumber(),
        firstClaimAmount,
        firstClaimTime,
        secondClaimTime,
        roundIntervalTime
        );

    let daoParams =  getNonScheduleParams("DAO", ourAddr, daoAmount);
    let teamParams =  getScheduleParams(
        "TEAM",
        ourAddr,
        teamAmount, //totalAllocatedAmount
        totalClaimCount.toNumber(), // totalClaimCount
        firstClaimAmount, //firstClaimAmount
        firstClaimTime, //firstClaimTime
        secondClaimTime, //secondClaimTime
        roundIntervalTime //roundIntervalTime
        );

    let marketingParams =  getScheduleParams(
        "MARKETING",
        ourAddr,
        marketingAmount, //totalAllocatedAmount
        totalClaimCount.toNumber(), // totalClaimCount 4
        firstClaimAmount, //firstClaimAmount
        firstClaimTime, //firstClaimTime
        secondClaimTime, //secondClaimTime
        roundIntervalTime //roundIntervalTime
        );

    let tokamakVaults = {
        publicSaleParams: publicSaleParams,
        initialVaultParams : initialVaultParams,
        rewardTonTosPoolParams: rewardTonTosPoolParams,
        rewardProjectTosPoolParams: rewardProjectTosPoolParams,
        tosAirdropParams: tosAirdropParams,
        tonAirdropParams: tonAirdropParams
    }
    // console.log('tokamakVaults' ,tokamakVaults )
    let customScheduleVaults = [teamParams, marketingParams]
    let customNonScheduleVaults = [daoParams]

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

    console.log('receipt', receipt)
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
