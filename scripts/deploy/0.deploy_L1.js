const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'
const paymaster = '0xF33C5E2ABE4c052783AAed527390A77FAD5841FA'

async function main() {

    //==== LibProject =================================

    const LibProject = await ethers.getContractFactory("LibProject");
    const libProject = await LibProject.deploy();
    await libProject.deployed();
    console.log('LibProject' , libProject.address)

    //==== L1toL2Message =================================
    const L1toL2Message_ = await ethers.getContractFactory("L1toL2Message", {
        libraries: { LibProject: libProject.address }
    });
    const l1toL2Message = await L1toL2Message_.deploy();
    await l1toL2Message.deployed();
    console.log('l1toL2Message' , l1toL2Message.address)

    // LibProject 0x418687cf6daeBee53D1ffcd10C35E02ef3303E9d
    // L1toL2MessageTest 0xA5394a5AB99Fadb68f616442c2a8A02c31e90df7

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
