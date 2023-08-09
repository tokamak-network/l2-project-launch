const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'
const paymaster = '0xF33C5E2ABE4c052783AAed527390A77FAD5841FA'

async function main() {


     //==== L2PaymasterDeposit =================================
    const L2PaymasterDeposit_ = await ethers.getContractFactory("L2PaymasterDeposit");
    const l2PaymasterDeposit = await L2PaymasterDeposit_.deploy(paymaster);
    await l2PaymasterDeposit.deployed();
    console.log('l2PaymasterDeposit' , l2PaymasterDeposit.address)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
