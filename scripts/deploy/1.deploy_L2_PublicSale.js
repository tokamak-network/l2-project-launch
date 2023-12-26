const { ethers } = require("hardhat");

const Web3EthAbi = require('web3-eth-abi');

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'

async function DeployPublicSale() {
    const [deployer] = await ethers.getSigners();
    //==== L2PublicSaleVaultProxy =================================

    const l2PublicSaleVaultProxy = await ethers.getContractFactory('L2PublicSaleVaultProxy')
    const l2PublicProxy = await l2PublicSaleVaultProxy.deploy();
    await l2PublicProxy.deployed();
    console.log('deploying "L2PublicSaleVaultProxy" at' , l2PublicProxy.address)

    //==== L2PublicSaleProxy =================================
    const l2PublicSaleProxy = await ethers.getContractFactory('L2PublicSaleProxy')
    const l2PublicProxyLogic = await l2PublicSaleProxy.deploy();
    await l2PublicProxyLogic.deployed();
    console.log('deploying "L2PublicSaleProxy" at' , l2PublicProxyLogic.address)

    
    //==== upgradeTo =================================
    await (await l2PublicProxy.upgradeTo(l2PublicProxyLogic.address)).wait()

    //==== LibPublicSaleVault =================================
    const libL2PublicSale = await ethers.getContractFactory('LibPublicSaleVault')
    const libL2Public = (await libL2PublicSale.deploy())
    await libL2Public.deployed();
    console.log('deploying "LibPublicSaleVault" at' , libL2Public.address)

    //==== LibPublicSaleVault =================================
    const l2PublicSaleLogic = await ethers.getContractFactory('L2PublicSaleVault', {
      signer: deployer, libraries: { LibPublicSaleVault: libL2Public.address }
    })
    const l2PublicLogic = await l2PublicSaleLogic.deploy();
    await l2PublicLogic.deployed();
    console.log('deploying "L2PublicSaleVault" at' , l2PublicLogic.address)

    //==== setImplementation2 ================================= 
    await (await l2PublicProxy.connect(deployer).setImplementation2(l2PublicLogic.address, 1, true)).wait()
    console.log("setImplementation2 is done")

    const _addWhiteList = Web3EthAbi.encodeFunctionSignature(
        "addWhiteList(address)"
    )

    const _round1Sale = Web3EthAbi.encodeFunctionSignature(
        "round1Sale(address,uint256)"
    )

    const _round2Sale = Web3EthAbi.encodeFunctionSignature(
        "round2Sale(address,uint256)"
    )

    const _claim = Web3EthAbi.encodeFunctionSignature(
        "claim(address)"
    )

    const _depositWithdraw = Web3EthAbi.encodeFunctionSignature(
        "depositWithdraw(address)"
    )

    const _exchangeWTONtoTOS = Web3EthAbi.encodeFunctionSignature(
        "exchangeWTONtoTOS(address,uint256)"
    )

    const _parseRevertReason = Web3EthAbi.encodeFunctionSignature(
        "parseRevertReason(bytes)"
    )

    const _hardcapCalcul = Web3EthAbi.encodeFunctionSignature(
        "hardcapCalcul(address)"
    )

    const _calculSaleToken = Web3EthAbi.encodeFunctionSignature(
        "calculSaleToken(address,uint256)"
    )

    const _calculPayToken = Web3EthAbi.encodeFunctionSignature(
        "calculPayToken(address,uint256)"
    )

    const _calculTier = Web3EthAbi.encodeFunctionSignature(
        "calculTier(address,address)"
    )
    const _calculTierAmount = Web3EthAbi.encodeFunctionSignature(
        "calculTierAmount(address,address,uint8)"
    )
    const _calcul1RoundAmount = Web3EthAbi.encodeFunctionSignature(
        "calcul1RoundAmount(address,address)"
    )
    const _calculOpenSaleAmount = Web3EthAbi.encodeFunctionSignature(
        "calculOpenSaleAmount(address,address,uint256)"
    )
    const _currentRound = Web3EthAbi.encodeFunctionSignature(
        "currentRound(address)"
    )
    const _calculClaimAmount = Web3EthAbi.encodeFunctionSignature(
        "calculClaimAmount(address,address,uint256)"
    )
    const _totalSaleUserAmount = Web3EthAbi.encodeFunctionSignature(
        "totalSaleUserAmount(address,address)"
    )
    const _openSaleUserAmount = Web3EthAbi.encodeFunctionSignature(
        "openSaleUserAmount(address,address)"
    )
    const _totalOpenSaleAmount = Web3EthAbi.encodeFunctionSignature(
        "totalOpenSaleAmount(address)"
    )
    const _totalOpenPurchasedAmount = Web3EthAbi.encodeFunctionSignature(
        "totalOpenPurchasedAmount(address)"
    )
    const _totalWhitelists = Web3EthAbi.encodeFunctionSignature(
        "totalWhitelists(address)"
    )
    const _totalExpectOpenSaleAmountView = Web3EthAbi.encodeFunctionSignature(
        "totalExpectOpenSaleAmountView(address)"
    )
    const _totalRound1NonSaleAmount = Web3EthAbi.encodeFunctionSignature(
        "totalRound1NonSaleAmount(address)"
    )

    await (await l2PublicProxy.connect(deployer).setSelectorImplementations2(
        [
            _addWhiteList,_round1Sale,_round2Sale,_claim,_depositWithdraw,_exchangeWTONtoTOS,
            _parseRevertReason,_hardcapCalcul,_calculSaleToken,_calculPayToken,_calculTier,_calculTierAmount,
            _calcul1RoundAmount,_calculOpenSaleAmount,_currentRound,_calculClaimAmount,
            _totalSaleUserAmount,_openSaleUserAmount,_totalOpenSaleAmount,_totalOpenPurchasedAmount,
            _totalWhitelists,_totalExpectOpenSaleAmountView,_totalRound1NonSaleAmount
        ],
        l2PublicLogic.address
    )).wait();
    console.log("setSelectorImplementations2 is done")

    // deploying "L2PublicSaleVaultProxy" at 0xF4B6ab8280f1c53e2059Dc9E5b62482c86128AC9
    // deploying "LibPublicSaleVault" at 0x3B75d3f628C29d357b484EA7d091faEd63419267
    // deploying "L2PublicSaleVault" at 0xd8B707652182ABe1181C6a2ef8355Ac050C83168
}

async function DeployVestingFund() {
    //==== L2VestingFundVault =================================

    const L2VestingFundVaultProxy = await ethers.getContractFactory('L2VestingFundVaultProxy')
    const l2vestingFundProxy = await L2VestingFundVaultProxy.deploy();
    await l2vestingFundProxy.deployed();
    console.log('deploying "L2VestingFundVaultProxy" at' , l2vestingFundProxy.address)

    //==== L2VestingFundVault =================================
    const L2VestingFundVault = await ethers.getContractFactory('L2VestingFundVault')
    const l2vestingFund = await L2VestingFundVault.deploy();
    await l2vestingFund.deployed();
    console.log('deploying "L2VestingFundVault" at' , l2vestingFund.address)


    await (await l2vestingFundProxy.upgradeTo(l2vestingFund.address)).wait()
    
    // deploying "L2VestingFundVaultProxy" at 0x17985dc326661c7F43Dd79d216D4027f453704F7
    // deploying "L2VestingFundVault" at 0xC55E3A821f9F7C2C27A2ca9D7059d22C9DA75700
}

const main = async () => {
  await DeployPublicSale()
  // await DeployVestingFund()
  // await initializeStaking()
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
