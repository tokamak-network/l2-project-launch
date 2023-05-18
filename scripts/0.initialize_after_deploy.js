
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

const l1Url = `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`
const l2Url = `https://goerli.optimism.tokamak.network`

const bridge = {
  l1Bridge: "0x7377F3D0F64d7a54Cf367193eb74a052ff8578FD",
  l2Bridge: "0x4200000000000000000000000000000000000010"
}

// TON
const erc20Addrs = {
  l1Addr: "0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00",
  l2Addr: "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2"
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

async function getSigners(){
  const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url)
  const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url)
  const privateKey = process.env.PRIVATE_KEY
  const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider)
  const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider)

  return {l1Wallet, l2Wallet};
}   // getSigners

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

//   // console.log('crossChainMessenger',crossChainMessenger);

//   // l1Bridge = new ethers.Contract(bridge.l1Bridge, BridgeABI, l1Signer)
//   // l1ERC20 = new ethers.Contract(erc20Addrs.l1Addr, IERC20Artifact.abi, l1Signer)
//   // l2ERC20 = new ethers.Contract(erc20Addrs.l2Addr, IERC20Artifact.abi, l2Signer)

}    // setup

async function main() {
  let L1Contracts = await readContracts(__dirname+'/../deployments/goerli');
  let L2Contracts = await readContracts(__dirname+'/../deployments/darius');
  await setup();
  const deployedL1 = await deployedContracts(L1Contracts.names, L1Contracts.abis, l1Signer);
  const deployedL2 = await deployedContracts(L2Contracts.names, L2Contracts.abis, l2Signer);
  console.log(L1Contracts.names)
  console.log(L2Contracts.names)

  console.log("L1ProjectManager", deployedL1.L1ProjectManager.address)

  /// initialize : L1ProjectManager setL1TokenFactories
  let l1ERC20A_TokenFactory = await deployedL1.L1ProjectManager.l1TokenFactory(0);

  if (l1ERC20A_TokenFactory == "0x0000000000000000000000000000000000000000") {
    (await deployedL1.L1ProjectManager.connect(l1Signer).setL1TokenFactories(
      [0,1,2,3],
      [
        deployedL1.L1ERC20A_TokenFactory.address,
        deployedL1.L1ERC20B_TokenFactory.address,
        deployedL1.L1ERC20C_TokenFactory.address,
        deployedL1.L1ERC20D_TokenFactory.address,
      ]
    )).wait()
  }

  l1ERC20A_TokenFactory = await deployedL1.L1ProjectManager.l1TokenFactory(0);
  console.log("l1ERC20A_TokenFactory", l1ERC20A_TokenFactory)
  l1ERC20B_TokenFactory = await deployedL1.L1ProjectManager.l1TokenFactory(1);
  console.log("l1ERC20B_TokenFactory", l1ERC20B_TokenFactory)
  l1ERC20C_TokenFactory = await deployedL1.L1ProjectManager.l1TokenFactory(2);
  console.log("l1ERC20C_TokenFactory", l1ERC20C_TokenFactory)
  l1ERC20D_TokenFactory = await deployedL1.L1ProjectManager.l1TokenFactory(3);
  console.log("l1ERC20D_TokenFactory", l1ERC20D_TokenFactory)

  /// initialize : L1ProjectManager setL2TokenFactory
  let l2TokenFactoryOfL1ProjectManager = await deployedL1.L1ProjectManager.l2TokenFactory(0);
  if (l2TokenFactoryOfL1ProjectManager == "0x0000000000000000000000000000000000000000") {
    await (await deployedL1.L1ProjectManager.setL2TokenFactory(0, deployedL2.L2TokenFactory.address)).wait()
  }
  l2TokenFactoryOfL1ProjectManager = await deployedL1.L1ProjectManager.l2TokenFactory(0);
  console.log("l2TokenFactoryOfL1ProjectManager", l2TokenFactoryOfL1ProjectManager)

  /// initialize : L1ProjectManager setL2ProjectManager
  let l2ProjectManagerOfL1ProjectManager = await deployedL1.L1ProjectManager.l2ProjectManager(0);
  if (l2ProjectManagerOfL1ProjectManager == "0x0000000000000000000000000000000000000000") {
    await (await deployedL1.L1ProjectManager.setL2ProjectManager(0, deployedL2.L2ProjectManager.address)).wait()
  }
  l2ProjectManagerOfL1ProjectManager = await deployedL1.L1ProjectManager.l2ProjectManager(0);
  console.log("l2ProjectManagerOfL1ProjectManager", l2ProjectManagerOfL1ProjectManager)

  /// initialize : L2TokenFactory setL2ProjectManager
  let l2ProjectManagerOfL2TokenFactory = await deployedL2.L2TokenFactory.l2ProjectManager();
  if (l2ProjectManagerOfL2TokenFactory == "0x0000000000000000000000000000000000000000") {
    await (await deployedL2.L2TokenFactory.setL2ProjectManager(deployedL2.L2ProjectManager.address)).wait()
  }
  l2ProjectManagerOfL2TokenFactory = await deployedL2.L2TokenFactory.l2ProjectManager();
  console.log("l2ProjectManagerOfL2TokenFactory", l2ProjectManagerOfL2TokenFactory)


  /// initialize : L2ProjectManager setL1ProjectManager
  let l1ProjectManagerOfL2ProjectManager = await deployedL2.L2ProjectManager.l1ProjectManager();
  if (l1ProjectManagerOfL2ProjectManager == "0x0000000000000000000000000000000000000000") {
    await (await deployedL2.L2ProjectManager.setL1ProjectManager(deployedL1.L1ProjectManager.address)).wait()
  }
  l1ProjectManagerOfL2ProjectManager = await deployedL2.L2ProjectManager.l1ProjectManager();
  console.log("l1ProjectManagerOfL2ProjectManager", l1ProjectManagerOfL2ProjectManager)


  /// initialize : L2ProjectManager setL2TokenFactory
  let l2TokenFactoryOfL2ProjectManager = await deployedL2.L2ProjectManager.l2TokenFactory();
  if (l2TokenFactoryOfL2ProjectManager == "0x0000000000000000000000000000000000000000") {
    await (await deployedL2.L2ProjectManager.setL2TokenFactory(deployedL2.L2TokenFactory.address)).wait()
  }
  l2TokenFactoryOfL2ProjectManager = await deployedL2.L2ProjectManager.l2TokenFactory();
  console.log("l2TokenFactoryOfL2ProjectManager", l2TokenFactoryOfL2ProjectManager)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
