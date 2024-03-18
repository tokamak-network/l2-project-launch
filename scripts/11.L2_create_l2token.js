
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
const L2StandardERC20Json = require('./abi/L2StandardERC20.json');

// Global variable because we need them almost everywhere
let crossChainMessenger
let l1ERC20, l2ERC20    // OUTb contracts to show ERC-20 transfers
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
    l1Token: ethers.constants.AddressZer1o,
    l2Token: ethers.constants.AddressZero,
    l2Type: 0,
    addressManager: ethers.constants.AddressZero
}

let projectId = ethers.BigNumber.from("9");

const setup = async() => {
  wallets = await getSigners()
  l1Signer = wallets.l1Wallet;
  l2Signer = wallets.l2Wallet;
  ourAddr = wallets.l1Wallet.address


}    // setup

// set L2 Token
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
    console.log(projects)

    if (projects.l2Token == '0x0000000000000000000000000000000000000000' ) {

        // const gos = await deployedL2.L2TokenFactory.estimateGas.createL2Token(
        //     projectInfo.projectOwner,
        //     projectInfo.l1Token,
        //     projectInfo.tokenName,
        //     projectInfo.tokenSymbol,
        //     projectInfo.projectName
        // )
        // console.log('gos', gos)

        /// L2 : create L2 token
        const topic = deployedL2.L2TokenFactory.interface.getEventTopic('StandardL2TokenCreated');
        const receipt = await (await deployedL2.L2TokenFactory.createL2Token(
            projectInfo.projectOwner,
            projectInfo.l1Token,
            projectInfo.tokenName,
            projectInfo.tokenSymbol,
            projectInfo.projectName
        )).wait();

        console.log('receipt', receipt.transactionHash)

        const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
        const deployedEvent = deployedL2.L2TokenFactory.interface.parseLog(log);

        projectInfo.l2Token = deployedEvent.args.l2Token;
        console.log("StandardL2TokenCreated  L2Token", projectInfo.l2Token)

        let contract = new ethers.Contract(projectInfo.l2Token, L2StandardERC20Json.abi, l2Signer);
        let l1Token =  await contract.l1Token()
        console.log("l1Token in L2Token", l1Token)

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
