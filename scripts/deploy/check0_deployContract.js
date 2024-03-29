const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'

async function main() {

  //==== LibProject =================================
  const libAddress =  "0x9713c208F4F31609c9A014eB1f8CDf7090C5BcA1"

  const L1toL2MessageTest = await ethers.getContractFactory("L1toL2MessageTest", {
      libraries: { LibProject: libAddress }
  });
  const l1toL2MessageTest = await L1toL2MessageTest.deploy();

  await l1toL2MessageTest.deployed();

  // console.log(tx)

  console.log('L1toL2MessageTest' , l1toL2MessageTest.address)
  // L1toL2MessageTest 0xCB75860cFBe1c4668A1D90d8d6c80c1f2c9C93A4
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
