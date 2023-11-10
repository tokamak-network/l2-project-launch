
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
let crossChainMessenger
let l1ERC20, l2ERC20    // OUTb contracts to show ERC-20 transfers
let ourAddr               // The address of the signer we use.
let l1Signer , l2Signer
let wallets;
let projectInfo;

const setup = async() => {
  wallets = await getSigners()
  l1Signer = wallets.l1Wallet;
  l2Signer = wallets.l2Wallet;
  ourAddr = wallets.l1Wallet.address


}    // setup

// set L2 Token
async function main() {
    let L1Contracts = await readContracts(__dirname+'/../deployments/goerli');
    let L2Contracts = await readContracts(__dirname+'/../deployments/darius');
    await setup();
    const deployedL1 = await deployedContracts(L1Contracts.names, L1Contracts.abis, l1Signer);
    const deployedL2 = await deployedContracts(L2Contracts.names, L2Contracts.abis, l2Signer);

    // projectInfo = {
    //     projectId :  ethers.constants.Zero,
    //     tokenOwner: ourAddr,
    //     projectOwner: ourAddr,
    //     initialTotalSupply: ethers.utils.parseEther("100000"),
    //     tokenType: 0, // non-mintable
    //     projectName: 'CandyShop',
    //     tokenName: 'Candy',
    //     tokenSymbol: 'CDY',
    //     l1Token: ethers.constants.AddressZero,
    //     l2Token: ethers.constants.AddressZero,
    //     l2Type: 0,
    //     addressManager: addressManager
    // }
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

    console.log('ourAddr', ourAddr)
    projectInfo.projectId = ethers.BigNumber.from("6");
    // projectInfo.projectId = await deployedL1.L1ProjectManager.projectCount();

    let projects = await deployedL1.L1ProjectManager.projects(projectInfo.projectId)
    let l2Token = await deployedL2.L2ProjectManager.tokenMaps(projectInfo.l1Token)
    console.log(projects)
    projectInfo.l1Token = projects.l1Token;


    if (projects.l2Token == '0x0000000000000000000000000000000000000000' &&
        l2Token == '0x0000000000000000000000000000000000000000') {

        /// L2 : create L2 token
        const topic = deployedL2.L2TokenFactory.interface.getEventTopic('StandardL2TokenCreated');
        const receipt = await (await deployedL2.L2TokenFactory.createL2Token(
            projectInfo.projectOwner,
            projectInfo.l1Token,
            projectInfo.tokenName,
            projectInfo.tokenSymbol,
            projectInfo.projectName
        )).wait();

        const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
        const deployedEvent = deployedL2.L2TokenFactory.interface.parseLog(log);

        l2Token = deployedEvent.args.l2Token;
        console.log("StandardL2TokenCreated  L2Token", l2Token)

        projectInfo.l2Token = l2Token

        /// L1 : set L2 token
        const topic1 = deployedL1.L1ProjectManager.interface.getEventTopic('SetL2Token');
        const receipt1 = await (await deployedL1.L1ProjectManager.setL2Token(
            projectInfo.projectId,
            projectInfo.l2Type,
            projectInfo.addressManager,
            projectInfo.l2Token
        )).wait();
        // console.log(receipt1.logs)
        const log1 = receipt1.logs.find(x => x.topics.indexOf(topic1) >= 0);
        const deployedEvent1 = deployedL1.L1ProjectManager.interface.parseLog(log1);

        console.log("SetL2Token L2Token", deployedEvent1.args.l2Token)
        console.log("addressManager", deployedEvent1.args.addressManager)

    } else {
        console.log('Already set l2Token')
        console.log('L2Token', l2Token)
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
