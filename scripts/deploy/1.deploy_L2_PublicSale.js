const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'

async function DeployPublicSale() {
    const [deployer] = await ethers.getSigners();
    //==== L2PublicSaleVaultProxy =================================

    const l2PublicSaleProxy = await ethers.getContractFactory('L2PublicSaleVaultProxy')
    const l2PublicProxy = await l2PublicSaleProxy.deploy();
    await l2PublicProxy.deployed();
    console.log('deploying "L2PublicSaleVaultProxy" at' , l2PublicProxy.address)

    // //==== LibPublicSaleVault =================================
    // const libL2PublicSale = await ethers.getContractFactory('LibPublicSaleVault')
    // const libL2Public = (await libL2PublicSale.deploy())
    // await libL2Public.deployed();
    // console.log('deploying "LibPublicSaleVault" at' , libL2Public.address)

    // //==== LibPublicSaleVault =================================
    // const l2PublicSaleLogic = await ethers.getContractFactory('L2PublicSaleVault', {
    //   signer: deployer, libraries: { LibPublicSaleVault: libL2Public.address }
    // })
    // const l2PublicLogic = await l2PublicSaleLogic.deploy();
    // await l2PublicLogic.deployed();
    // console.log('deploying "L2PublicSaleVault" at' , l2PublicLogic.address)

    // await (await l2PublicProxy.upgradeTo(l2PublicLogic.address)).wait()

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
