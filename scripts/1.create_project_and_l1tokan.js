
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
  let L1Contracts = await readContracts(__dirname+'/../deployments/goerli');
  let L2Contracts = await readContracts(__dirname+'/../deployments/darius');
  await setup();
  const deployedL1 = await deployedContracts(L1Contracts.names, L1Contracts.abis, l1Signer);
  const deployedL2 = await deployedContracts(L2Contracts.names, L2Contracts.abis, l2Signer);

    console.log('ourAddr', ourAddr)

    projectInfo = {
        projectId :  ethers.constants.Zero,
        tokenOwner: ourAddr,
        projectOwner: ourAddr,
        initialTotalSupply: ethers.utils.parseEther("100000"),
        tokenType: 0, // non-mintable
        projectName: 'TokamakBakery',
        tokenName: 'TokamakBakery',
        tokenSymbol: 'TKB',
        l1Token: ethers.constants.AddressZero,
        l2Token: ethers.constants.AddressZero,
        l2Type: 0,
        addressManager: addressManager
    }


    const topic = deployedL1.L1ProjectManager.interface.getEventTopic('CreatedProject');

    // create project on L1
    const receipt = await (await deployedL1.L1ProjectManager.createProject(
        projectInfo.tokenOwner,
        projectInfo.projectOwner,
        projectInfo.initialTotalSupply,
        projectInfo.tokenType,
        projectInfo.projectName,
        projectInfo.tokenName,
        projectInfo.tokenSymbol
    )).wait();

    const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
    const deployedEvent = deployedL1.L1ProjectManager.interface.parseLog(log);
    projectInfo.projectId = deployedEvent.args.projectId;
    projectInfo.l1Token = deployedEvent.args.l1Token;

    console.log(projectInfo)

    const tokenContract = new ethers.Contract(projectInfo.l1Token, ERC20AJson.abi, l1Signer)
    let totalSupply = await tokenContract.totalSupply()
    let balanceOf = await tokenContract.balanceOf(deployedL1.L1ProjectManager.address);
    console.log("totalSupply", totalSupply)
    console.log("balanceOf", balanceOf)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
