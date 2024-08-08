
const {ethers} = require("ethers")
const { Wallet }  = require("ethers")
const optimismSDK = require("@tokamak-network/tokamak-layer2-sdk")
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
require('dotenv').config()

const MessageDirection = {
  L1_TO_L2: 0,
  L2_TO_L1: 1,
}

const l1Url = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
const l2Url = `https://rpc.thanos-sepolia-test.tokamak.network`

const bridge = {
  l1Bridge: "0x5D2Ed95c0230Bd53E336f12fA9123847768B2B3E",
  l2Bridge: "0x4200000000000000000000000000000000000010"
}

// TON
const tonAddrs = {
  l1Addr: "0xa30fe40285b8f5c0457dbc3b7c8a280373c40044",
  l2Addr: ""
}
const addressManager = "0x41CC1728eE5CD632FE86d7C17bf756182D0f2f26"

const messenger  = {
    l1Messenger: "0x8ca593C92446104B4DA968786735dbd503886ed7",
    l2Messenger: "0x4200000000000000000000000000000000000007",
}

const lockTos  = {
  l1LockTOS: "",
  l2LockTOS: "",
}

// Global variable because we need them almost everywhere
let crossChainMessenger
let l1ERC20, l2ERC20    // OUTb contracts to show ERC-20 transfers
let ourAddr               // The address of the signer we use.
let l1Signer , l2Signer
let wallets;

function promisify(fn) {
  return function promisified(...params) {
    return new Promise((resolve, reject) => fn(...params.concat([(err, ...args) => err ? reject(err) : resolve( args.length < 2 ? args[0] : args )])))
  }
}

const readdirAsync = promisify(fs.readdir)

const readContracts = async (folder)  => {
  let abis = {}
  let names = []
  await readdirAsync(folder).then(filenames => {
    for(i=0; i< filenames.length; i++){
      let e = filenames[i]
      if (e.indexOf(".json") > 0) {
        names.push(e.substring(0, e.indexOf(".json")))
        abis[e.substring(0, e.indexOf(".json"))] = require(folder+"/"+e)
      }
    }
  })
  return  {names, abis}
}

async function deployedContracts(names, abis, provider){
    let deployed = {}
    for (i = 0; i< names.length; i++){
      let name = names[i];
      deployed[name] = new ethers.Contract(abis[name].address, abis[name].abi, provider)
    }
    return deployed;
}

async function getL1Provider(){
  const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)

  return l1RpcProvider;
}

async function getL2Provider(){
  const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
  return l2RpcProvider;
}

async function getSigners(){
    const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
    const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
    const privateKey = process.env.PRIVATE_KEY
    const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
    const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)

    return {l1Wallet, l2Wallet};
}   // getSigners

const erc20ABI = [
    // balanceOf
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
    // approve
    {
      constant: true,
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" }],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      type: "function",
    },
    // faucet
    {
      inputs: [],
      name: "faucet",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]    // erc20ABI

  const BridgeABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "deposits",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

  const GreeterABI = [
    {
      "inputs": [
      ],
      "name": "greet",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      constant: true,
      inputs: [
        { name: "_greeting", type: "string" } ],
      name: "setGreeting",
      outputs: [],
      type: "function",
    },
  ]

module.exports = {
    readContracts,
    deployedContracts,
    getSigners,
    getL1Provider,
    getL2Provider,
    bridge,
    messenger,
    addressManager,
    tonAddrs,
    erc20ABI,
    BridgeABI,
    GreeterABI
}
