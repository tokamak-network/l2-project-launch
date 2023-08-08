const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'

async function main() {

    //==== LibProject =================================

    const LibProject = await ethers.getContractFactory("LibProject");
    const libProject = await LibProject.deploy();
    await libProject.deployed();
    console.log('LibProject' , libProject.address)

    //==== L1toL2MessageTest =================================
    const L1toL2MessageTest = await ethers.getContractFactory("L1toL2MessageTest", {
        libraries: { LibProject: libProject.address }
    });
    const l1toL2MessageTest = await L1toL2MessageTest.deploy();
    await l1toL2MessageTest.deployed();
    console.log('L1toL2MessageTest' , l1toL2MessageTest.address)

    // LibProject 0x418687cf6daeBee53D1ffcd10C35E02ef3303E9d
    // L1toL2MessageTest 0xA5394a5AB99Fadb68f616442c2a8A02c31e90df7
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
