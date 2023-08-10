const { ethers } = require("hardhat");

const ownerAddress = '0xc1eba383D94c6021160042491A5dfaF1d82694E6'
const paymaster = '0xF33C5E2ABE4c052783AAed527390A77FAD5841FA'

async function main() {

  const libProject_address = "0xF69777a785D275273316f4eCb0ebd278943F98e9"

    //==== L1toL2Message =================================
    const L1toL2Message_ = await ethers.getContractFactory("L1toL2Message", {
        libraries: { LibProject: libProject_address }
    });
    const l1toL2Message = await L1toL2Message_.deploy();
    await l1toL2Message.deployed();
    console.log('l1toL2Message' , l1toL2Message.address)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
