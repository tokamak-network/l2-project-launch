
const {ethers} = require("ethers")
const { Wallet, BigNumber}  = require("ethers")
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
require('dotenv').config()

const {
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
const L2StandardERC20Json = require('./abi/L2StandardERC20.json');

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
    projectName: 'Test7',
    tokenName: 'Test7',
    tokenSymbol: 'T7T',
    l1Token: ethers.constants.AddressZero,
    l2Token: ethers.constants.AddressZero,
    l2Type: 0,
    addressManager: ethers.constants.AddressZero
}

let projectId = ethers.BigNumber.from("7");

const L1Token = "0xb74db9f6b3f4bc6282657f09d8640ac0532c9cd4"
const L2Token = "0xafbd7734324934b07642d50f156b5bae9832b184"
const L2TOS = "0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC"

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
    const L2ProjectManager = new ethers.Contract(L2Contracts.abis["L2ProjectManagerProxy"].address, L2Contracts.abis["L2ProjectManager"].abi, l2Signer)
    console.log('ourAddr', ourAddr)
    projectInfo.projectId = projectId
    projectInfo.tokenOwner = ourAddr;
    projectInfo.projectOwner = ourAddr;
    projectInfo.l1Token = L1Token;
    projectInfo.l2Token = L2Token;
    let vaultCount = BigNumber.from("5")

    let initialLiquidityAmount = projectInfo.initialTotalSupply.div(vaultCount)
    let daoAmount = initialLiquidityAmount
    let teamAmount = initialLiquidityAmount
    let marketingAmount = initialLiquidityAmount
    let airdropStosAmount = initialLiquidityAmount

    let sTime = Math.floor(Date.now() / 1000) + (60*60*24*7*8)
    let firstClaimTime = sTime

    let totalClaimCount = BigNumber.from("4")
    let firstClaimAmount = teamAmount.div(totalClaimCount)
    let roundIntervalTime = 60*60*24*7;
    let secondClaimTime =  firstClaimTime + roundIntervalTime

    let publicSaleParams =  getPublicSaleParams (
        [0,0,0,0], //tier
        [0,0,0,0], // percentage
        [0,0], //amount
        [0,0], // price saleTokenPrice, payTokenPrice
        0, //hardcapAmount
        0, //changeTOSPercent
        [0,0,0,0,0,0,0], //times
        0, //claimCounts
        0, //firstClaimPercent
        0, //firstClaimTime
        0, //secondClaimTime: number,
        0, //roundInterval: number,
        ethers.constants.AddressZero,  // receiveAddress,
        0, // vestingClaimCounts: number,
        0, // vestingfirstClaimPercent: number,
        0, // vestingClaimTime1: number,
        0, // vestingClaimTime2: number,
        0, // vestingRoundInterval: number,
        0, // fee: number
        );
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
    let rewardParams = getLpRewardParams(ourAddr, ethers.constants.AddressZero, 0, 0, 0, 0, 0, 0);
    let tosAirdropParams =  getTosAirdropParams(
        ethers.constants.AddressZero,
        airdropStosAmount,
        totalClaimCount.toNumber(),
        firstClaimAmount,
        firstClaimTime,
        secondClaimTime,
        roundIntervalTime
        );
    let tonAirdropParams =  getTonAirdropParams(ourAddr, 0, 0, 0, 0, 0, 0);
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
        rewardParams: rewardParams,
        tosAirdropParams: tosAirdropParams,
        tonAirdropParams: tonAirdropParams
    }
    // console.log('tokamakVaults' ,tokamakVaults )
    let customScheduleVaults = [teamParams, marketingParams]
    let customNonScheduleVaults = [daoParams]

    // console.log('initialVaultParams' , initialVaultParams)
    // console.log('customScheduleVaults' , customScheduleVaults)
    // console.log('customNonScheduleVaults' , customNonScheduleVaults)

    console.log('l1Token', projectInfo.l1Token)
    console.log('l2Token', projectInfo.l2Token)
    console.log('projectInfo', projectInfo.projectId)
    console.log('initialTotalSupply', projectInfo.initialTotalSupply)
    const gos = await L2ProjectManager.estimateGas.distributesL2TokenOwner(
        projectInfo.l1Token,
        projectInfo.l2Token,
        projectInfo.projectId,
        projectInfo.initialTotalSupply,
        tokamakVaults,
        customScheduleVaults,
        customNonScheduleVaults
        )
    console.log('gos', gos)

    // const receipt = await (await L2ProjectManager.distributesL2TokenOwner(
    //     projectInfo.l1Token,
    //     projectInfo.l2Token,
    //     projectInfo.projectId,
    //     projectInfo.initialTotalSupply,
    //     tokamakVaults,
    //     customScheduleVaults,
    //     customNonScheduleVaults
    //     )).wait();

    // //--------------------------
    // const topic = L2ProjectManager.interface.getEventTopic('DistributedL2Token');
    // const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
    // const deployedEvent = L2ProjectManager.interface.parseLog(log);

    // console.log(deployedEvent.args)

    // const tokenContract = new ethers.Contract(projectInfo.l2Token, L2StandardERC20Json.abi, l2Signer)
    // let totalSupply = await tokenContract.totalSupply()
    // let balanceOf = await tokenContract.balanceOf(L2ProjectManager.address);
    // console.log("l2Token totalSupply", totalSupply)
    // console.log("l2Token L2ProjectManager balanceOf", balanceOf)


    // let balanceOfInitialVaultProxy = await tokenContract.balanceOf(L2Contracts.abis["L2InitialLiquidityVaultProxy"].address);
    // let balanceOfL2ScheduleVaultProxy = await tokenContract.balanceOf(L2Contracts.abis["L2ScheduleVaultProxy"].address);
    // let balanceOfL2CustomVaultBaseProxy = await tokenContract.balanceOf(L2Contracts.abis["L2CustomVaultBaseProxy"].address);

    // console.log("l2Token L2ProjectManager balanceOf", balanceOfInitialVaultProxy)
    // console.log("l2Token L2ProjectManager balanceOf", balanceOfL2ScheduleVaultProxy)
    // console.log("l2Token L2ProjectManager balanceOf", balanceOfL2CustomVaultBaseProxy)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
