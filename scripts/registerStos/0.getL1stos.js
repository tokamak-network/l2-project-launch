

const hre = require("hardhat");
const { ethers } = require("hardhat");
// //
// const {ethers} = require("ethers")
const { Wallet }  = require("ethers")
const optimismSDK = require("@tokamak-network/tokamak-layer2-sdk")
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
require('dotenv').config()
const LockTOSv2Logic0Json = require("../abi/LockTOSv2Logic0.json")
const LockTOSAddress = "0x770e0d682277A4a9167971073f1Aa6d6403bb315"

const {
  readContracts,
  deployedContracts,
  getSigners,
  getL1Provider,
  getL2Provider } = require("../common_func");


// Global variable because we need them almost everywhere
let crossChainMessenger
let l1ERC20, l2ERC20    // OUTb contracts to show ERC-20 transfers
let ourAddr               // The address of the signer we use.
let l1Signer , l2Signer
let wallets;


const setup = async() => {
  wallets = await getSigners()
  l1Signer = wallets.l1Wallet;
  l2Signer = wallets.l2Wallet;
  ourAddr = wallets.l1Wallet.address

  crossChainMessenger = new optimismSDK.CrossChainMessenger({
      l1ChainId: 5,    // Goerli value, 1 for mainnet
      l2ChainId: 5050,  // Goerli value, 10 for mainnet
      l1SignerOrProvider: l1Signer,
      l2SignerOrProvider: l2Signer
  })

}    // setup

async function main() {
  let L1Contracts = await readContracts(__dirname+'/../../deployments/goerli');
  let L2Contracts = await readContracts(__dirname+'/../../deployments/titangoerli');
  await setup();
  const deployedL1 = await deployedContracts(L1Contracts.names, L1Contracts.abis, l1Signer);
  const deployedL2 = await deployedContracts(L2Contracts.names, L2Contracts.abis, l2Signer);
//   console.log(L1Contracts.names)
//   console.log(L2Contracts.names)
  const lockTOS = await ethers.getContractAt(LockTOSv2Logic0Json.abi, LockTOSAddress, l1Signer)

  let locksOfs  = await lockTOS.locksOf(ourAddr);
  const l1RpcProvider = await getL1Provider()

  let block = await l1RpcProvider.getBlock('latest')
  console.log('block timestamp', block.timestamp)
  console.log('locksOfs', locksOfs)
  for(let i = 0; i < locksOfs.length; i++){
    let locksInfo = await lockTOS.locksInfo(locksOfs[i]);
    console.log('locksInfo', locksOfs[i], locksInfo)
    if(block.timestamp < locksInfo.end.toNumber() ) {
        let history = await lockTOS.pointHistoryOf(locksOfs[i]);
        console.log('history', history)
    }

  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
