const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'

async function DeployPublicSale() {

    //==== L2PublicSaleVaultProxy =================================

    const l2PublicSaleProxy = await ethers.getContractFactory('L2PublicSaleVaultProxy')
    const l2PublicProxy = await l2PublicSaleProxy.deploy();
    await l2PublicProxy.deployed();
    console.log('l2PublicProxy' , l2PublicProxy.address)

    //==== LibPublicSaleVault =================================
    const l2PublicSaleLogic = await ethers.getContractFactory('LibPublicSaleVault')
    const l2PublicLogic = await l2PublicSaleLogic.deploy();
    await l2PublicLogic.deployed();
    console.log('l2PublicLogic' , l2PublicLogic.address)


    await (await l2PublicProxy.upgradeTo(l2PublicLogic.address)).wait()
    
    // titan-goerli
    // l2PublicProxy 0xff3fc41f2069731AfEd8881fee3A49C242427F4F
    // l2PublicLogic 0x2F81b06b63d33Af6c3b3B5F4C5efC340b3111A55
}

async function DeployVestingFund() {

}

const main = async () => {
  await DeployPublicSale()
  await DeployVestingFund()
  // await initializeStaking()
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
