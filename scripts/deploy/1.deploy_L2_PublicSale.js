const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'

async function DeployPublicSale() {
    const [deployer] = await ethers.getSigners();
    //==== L2PublicSaleVaultProxy =================================

    const l2PublicSaleProxy = await ethers.getContractFactory('L2PublicSaleVaultProxy')
    const l2PublicProxy = await l2PublicSaleProxy.deploy();
    await l2PublicProxy.deployed();
    console.log('deploying "L2PublicSaleVaultProxy" at' , l2PublicProxy.address)

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

    await (await l2PublicProxy.upgradeTo(l2PublicLogic.address)).wait()
    
    // titan-goerli
    // l2PublicProxy 0xff3fc41f2069731AfEd8881fee3A49C242427F4F
    // l2PublicLogic 0x2F81b06b63d33Af6c3b3B5F4C5efC340b3111A55
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

    // titan-goerli
    // l2vestingFundProxy 0x9f4282cea29432724BbefF6ab4394B338e0fabB6
    // l2vestingFund 0xE3f634F2AeaaEDb094A34B795A5a8E532Bdda853
}

const main = async () => {
  // await DeployPublicSale()
  // await DeployVestingFund()
  // await initializeStaking()
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
