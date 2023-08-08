
const {ethers} = require("ethers")
const { Wallet }  = require("ethers")
const optimismSDK = require("@tokamak-network/tokamak-layer2-sdk")
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
    tonAddrs,
    erc20ABI,
    BridgeABI } = require("./common_func");

const L1BridgeJson = require("./abi/L1StandardBridge.json")
const l1MessengerJson = require("./abi/L1CrossDomainMessenger.json")
const IERC20Json = require("./abi/ERC20A.json");
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

    crossChainMessenger = new optimismSDK.CrossChainMessenger({
        l1ChainId: 5,    // Goerli value, 1 for mainnet
        l2ChainId: 5050,  // Goerli value, 10 for mainnet
        l1SignerOrProvider: l1Signer,
        l2SignerOrProvider: l2Signer
    })

    l1Bridge = new ethers.Contract(bridge.l1Bridge, BridgeABI, l1Signer)
    l2Bridge = new ethers.Contract(bridge.l2Bridge, BridgeABI, l2Signer)
}    // setup


// set L2 Token
async function main() {
    let L1Contracts = await readContracts(__dirname+'/../deployments/goerli');
    let L2Contracts = await readContracts(__dirname+'/../deployments/darius');
    await setup();
    const deployedL1 = await deployedContracts(L1Contracts.names, L1Contracts.abis, l1Signer);
    const deployedL2 = await deployedContracts(L2Contracts.names, L2Contracts.abis, l2Signer);
    console.log(L1Contracts.names)
    console.log(L2Contracts.names)
    console.log("L1ProjectManager",deployedL1.L1ProjectManager.address);
    console.log("L2ProjectManager",deployedL2.L2ProjectManager.address);
    console.log("L2TokenFactory",deployedL2.L2TokenFactory.address);

    // return

    projectInfo = {
        projectId :  ethers.constants.Zero,
        tokenOwner: ourAddr,
        projectOwner: ourAddr,
        initialTotalSupply: ethers.utils.parseEther("100000"),
        tokenType: 0, // non-mintable
        projectName: 'CandyShop',
        tokenName: 'Candy',
        tokenSymbol: 'CDY',
        l1Token: ethers.constants.AddressZero,
        l2Token: ethers.constants.AddressZero,
        l2Type: 0,
        addressManager: addressManager
    }
    console.log('ourAddr', ourAddr)

    // change with the project id of you want to know
    projectInfo.projectId = ethers.BigNumber.from("4");

    let projects = await deployedL1.L1ProjectManager.projects(projectInfo.projectId)
    console.log(projects)
    projectInfo.l1Token = projects.l1Token
    projectInfo.l2Token = projects.l2Token
    console.log(projectInfo)

    if(projects.l1Token == '0x0000000000000000000000000000000000000000' || projects.l2Token == '0x0000000000000000000000000000000000000000') {
        console.log('l1Token or l2Token is zero address') ;
        return
    }

    // token
    l1ERC20 = new ethers.Contract(projectInfo.l1Token, IERC20Json.abi, l1Signer)
    l2ERC20 = new ethers.Contract(projectInfo.l2Token, IERC20Json.abi, l2Signer)
    const L1Brige = new ethers.Contract(bridge.l1Bridge, L1BridgeJson.abi, l1Signer)
    const L1Messenger = new ethers.Contract(messenger.l1Messenger, l1MessengerJson.abi, l1Signer)

    // set l2 vaults : deposit과 설정을 나누어서 해야 한다.
    //  한 트랜잭션으로 보냈음에도 despoit은 되고, sendMessage는 실행되지 않았다.
    // first : 100 token from L1 to L2
    // depositL1TokenToL2(uint256 projectId, uint256 amount, uint32 _minGasLimit)
    const topic = L1Brige.interface.getEventTopic('ERC20DepositInitiated');
    const topic1 = L1Messenger.interface.getEventTopic('SentMessage');
    const amount = ethers.utils.parseEther("50");

    let totalSupply = await l1ERC20.totalSupply()
    let balanceOf = await l1ERC20.balanceOf(deployedL1.L1ProjectManager.address);
    console.log("totalSupply", totalSupply)
    console.log("balanceOf", balanceOf)

    let allowance = await l1ERC20.allowance(ourAddr, bridge.l1Bridge);
    console.log("allowance", allowance)

    if (allowance.lt(amount)) {
        await (await l1ERC20.approve(bridge.l1Bridge, totalSupply)).wait()
        allowance = await l1ERC20.allowance(ourAddr, bridge.l1Bridge);
        console.log("allowance", allowance)
    }

    //-------------
    const start = new Date()

    const response = await deployedL1.L1ProjectManager.depositAndSetL2Vaults(
        projectInfo.projectId,
        amount,
        ethers.BigNumber.from("200000"),
        ethers.BigNumber.from("200000")
    )
    console.log(`depositAndSetL2Vaults transaction hash (on L1): ${response.hash}`)
    console.log(`\tMore info: https://goerli.etherscan.io/tx/${response.hash}`)
    await response.wait()

    console.log("Waiting for status to change to RELAYED")
    console.log(`Time so far ${(new Date()-start)/1000} seconds`)

    await crossChainMessenger.waitForMessageStatus(response.hash, optimismSDK.MessageStatus.RELAYED)
    console.log(`depositAndSetL2Vaults took ${(new Date()-start)/1000} seconds\n\n`)
    console.log(`\n`)


    console.log(`deployedL2.L2ProjectManager.addres`, deployedL2.L2ProjectManager.address)
    let balanceOfL2ProjectManager = await l2ERC20.balanceOf(deployedL2.L2ProjectManager.address);
    let tmp = await deployedL2.L2ProjectManager.tmp()

    console.log('L2ProjectManager ',l2ERC20.address,', balanceOf', balanceOfL2ProjectManager)
    console.log(`L2ProjectManager tmp`, tmp)

    // let res = await deployedL2.L2ProjectManager.balanceOf(projectInfo.l2Token);
    // console.log(`res `, res)
    // await res.wait();

    // let tmp = await deployedL2.L2ProjectManager.tmp()
    // console.log(`L2ProjectManager tmp`, tmp)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
