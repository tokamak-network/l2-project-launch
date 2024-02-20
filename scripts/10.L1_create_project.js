const {ethers} = require("ethers")
const { Wallet }  = require("ethers")
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
    //console.log('L1ProjectManager', L1ProjectManager)
    projectInfo.tokenOwner = ourAddr
    projectInfo.projectOwner = ourAddr
    projectInfo.addressManager = addressManager
    console.log('projectInfo', projectInfo)
    const topic = L1ProjectManager.interface.getEventTopic('CreatedProject');

    const gos = await L1ProjectManager.estimateGas.createProject(
        projectInfo.tokenOwner,
        projectInfo.projectOwner,
        projectInfo.addressManager,
        projectInfo.initialTotalSupply,
        0,
        projectInfo.projectName,
        projectInfo.tokenName,
        projectInfo.tokenSymbol,
    )
    console.log('gos', gos)

    // create project on L1
    const receipt = await (await L1ProjectManager.createProject(
        projectInfo.tokenOwner,
        projectInfo.projectOwner,
        projectInfo.addressManager,
        projectInfo.initialTotalSupply,
        projectInfo.tokenType,
        projectInfo.projectName,
        projectInfo.tokenName,
        projectInfo.tokenSymbol,
    )).wait();

    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
    const deployedEvent = L1ProjectManager.interface.parseLog(log);
    projectInfo.projectId = deployedEvent.args.projectId;
    projectInfo.l1Token = deployedEvent.args.l1Token;

    console.log(projectInfo)

    const tokenContract = new ethers.Contract(projectInfo.l1Token, ERC20AJson.abi, l1Signer)
    let totalSupply = await tokenContract.totalSupply()
    let balanceOf = await tokenContract.balanceOf(L1ProjectManager.address);
    console.log("totalSupply", totalSupply)
    console.log("balanceOf", balanceOf)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
