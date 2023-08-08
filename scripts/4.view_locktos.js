
const hre = require("hardhat");
const { ethers } = require("hardhat");
require('dotenv').config()

let accounts, account, provider;
let lockTOSAbi = require("../artifacts/contracts/test/LockTOS.sol/LockTOS.json");

// miannet
let lockTosAddressMainnet = "0x69b4A202Fa4039B42ab23ADB725aA7b1e9EEBD79";
let lockTosAddressMainnetBlockNumber = 13229254;

// goerli
let lockTosAddressGoerli = "0x63689448AbEaaDb57342D9e0E9B5535894C35433";
let lockTosAddressGoerliBlockNumber = 7551343;


let lockTosAddress ;
let lockTosBlockNumber ;
let lockTOS ;
// set L2 Token

function convertPointStructOutputToPoint(pointsArray){
    let pointArray = [];
    pointsArray.forEach(element => {
        pointArray.push({
            bias: element.bias,
            slope: element.slope,
            timestamp: element.timestamp
        })
    });

    return pointArray;
}

async function main() {
    [account] = await ethers.getSigners();

    let accountAddress = await account.getAddress();
    console.log('accounts', accountAddress)

    let net  = await ethers.provider.getNetwork()
    if (net.chainId == 1) {
        lockTosAddress = lockTosAddressMainnet;
        lockTosBlockNumber = lockTosAddressMainnetBlockNumber;
    } else if (net.chainId == 5) {
        lockTosAddress = lockTosAddressGoerli;
        lockTosBlockNumber = lockTosAddressMainnetBlockNumber;
    }

    //
    lockTOS = await ethers.getContractAt(lockTOSAbi.abi, lockTosAddress, account)
    console.log('lockTOS', lockTOS.address)

    let startBlock  = await ethers.provider.getBlock(lockTosBlockNumber);
    console.log('startBlockTime', startBlock.timestamp)

    let epochUnit  = await lockTOS.epochUnit();

    let startTime = Math.floor(startBlock.timestamp / epochUnit) * epochUnit;
    console.log('startTime', startTime)

    let currentBlock  = await ethers.provider.getBlock('latest');
    console.log('currentBlockTime', currentBlock.timestamp)
    let currentTime = Math.floor(currentBlock.timestamp / epochUnit) * epochUnit;
    console.log('currentTime', currentTime)

    let weeks = (currentTime - startTime) / epochUnit;
    console.log('weeks', weeks)
    let i = ethers.constants.Zero;

    let pointHistory = await lockTOS.pointHistory(0);
    console.log('pointHistory',  pointHistory)

     pointHistory = await lockTOS.pointHistory(90);
    console.log('pointHistory',  pointHistory)


     pointHistory = await lockTOS.pointHistory(100);
    console.log('pointHistory',  pointHistory)


    // while (i.lte(weeks)){
    //     let pointHistory = await lockTOS.pointHistory(i);
    //     console.log('pointHistory', i.toNumber(), pointHistory)
    //     i = i.add(ethers.constants.One)
    // }

    /*
    let pointHistroyCount = await lockTOS.lockIdCounter();
    console.log('lockIdCounter', lockIdCounter)


    // await lockTOS.attach(account);
    let lockIdCounter = await lockTOS.lockIdCounter();
    console.log('lockIdCounter', lockIdCounter)

    let i = ethers.constants.One;
    let pointCount = 0;

    while (i.lte(lockIdCounter)){

        let points = await lockTOS.pointHistoryOf(i)
        pointCount += points.length;
        if(i.toNumber() % 20 == 0) console.log('pointCount', i.toNumber() , pointCount);

        // let lockIdPoints = convertPointStructOutputToPoint(
        //     await lockTOS.pointHistoryOf(i)
        // );
        // console.log(lockIdPoints);

        i = i.add(ethers.constants.One)
    }
    console.log('end : pointCount', pointCount);

    // point = 32+32+4 = 68 byte
    console.log(' total bytes : ',(lockIdCounter.toNumber()*4) + (pointCount*68) );
    */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
