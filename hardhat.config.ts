// import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import "@nomicfoundation/hardhat-chai-matchers";

import "hardhat-gas-reporter";
import dotenv from "dotenv" ;
import { HardhatUserConfig } from "hardhat/types";
import "hardhat-deploy";

dotenv.config();

const config: HardhatUserConfig = {
  namedAccounts: {
    deployer: 0,
    addr1: 1,
    l1MessengerAddress: {
      default: 2,
      goerli: '0x2878373BA3Be0Ef2a93Ba5b3F7210D76cb222e63',
      hardhat: '0x2878373BA3Be0Ef2a93Ba5b3F7210D76cb222e63',
    },
    l2MessengerAddress: {
      default: 3,
      darius: '0x4200000000000000000000000000000000000007',
      hardhat: '0x4200000000000000000000000000000000000007',
    },
    l1BridgeAddress: {
      default: 4,
      goerli: '0x7377F3D0F64d7a54Cf367193eb74a052ff8578FD',
      hardhat: '0x7377F3D0F64d7a54Cf367193eb74a052ff8578FD',
    },
    l2BridgeAddress: {
      default: 5,
      darius: '0x4200000000000000000000000000000000000010',
      hardhat: '0x4200000000000000000000000000000000000010',
    },
    l1AddressManagerAddress: {
      default: 6,
      goerli: '0xEFa07e4263D511fC3a7476772e2392efFb1BDb92',
      hardhat: '0xEFa07e4263D511fC3a7476772e2392efFb1BDb92',
    },
    testUser:
      'privatekey://0xf14a6e4b68641b84ebef1c0f73cde544348429fe135272e111b946b38d329e16', // for test (see scripts folder)
  },
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.ETH_NODE_URI_GOERLI}`,
        blockNumber: 9019577
      },
      allowUnlimitedContractSize: false,
      deploy: ['deploy_l1', 'deploy_l2'],
      companionNetworks: {
        l2: 'hardhat',
      },
    },
    local: {
      url: `${process.env.NODE_LOCAL}`,
      accounts: [`${process.env.DEPLOYER}`],
      deploy: ['deploy_l2']
    },
    mainnet: {
      url: `${process.env.ETH_NODE_URI_MAINNET}`,
    },
    goerli: {
      url: `${process.env.ETH_NODE_URI_GOERLI}`,
      accounts: [`${process.env.DEPLOYER}`],
      // chainId: 5,
      deploy: ['deploy_l1']
    },
    darius: {
      url: `${process.env.ETH_NODE_URI_DARIUS}`,
      accounts: [`${process.env.DEPLOYER}`],
      chainId: 5050,
      deploy: ['deploy_l2']
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      goerli: `${process.env.ETHERSCAN_API_KEY}`,
      darius: "abc"
    } ,
    customChains: [
      {
        network: "darius",
        chainId: 5050,
        urls: {
          apiURL: "https://goerli.explorer.tokamak.network/api",
          browserURL: "https://goerli.explorer.tokamak.network"
        }
      }
    ]
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21,
    coinmarketcap: `${process.env.COINMARKETCAP_API_KEY}`
  },
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 625,
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.8.12/metadata.html
        bytecodeHash: 'none',
      },
    },
  },
};

export default config;
