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
      titangoerli: '0x4200000000000000000000000000000000000007',
      hardhat: '0x4200000000000000000000000000000000000007',
    },
    l1BridgeAddress: {
      default: 4,
      goerli: '0x7377F3D0F64d7a54Cf367193eb74a052ff8578FD',
      hardhat: '0x7377F3D0F64d7a54Cf367193eb74a052ff8578FD',
      titangoerli: '0x7377F3D0F64d7a54Cf367193eb74a052ff8578FD',
    },
    l2BridgeAddress: {
      default: 5,
      titangoerli: '0x4200000000000000000000000000000000000010',
      hardhat: '0x4200000000000000000000000000000000000010',
    },
    l1AddressManagerAddress: {
      default: 6,
      goerli: '0xEFa07e4263D511fC3a7476772e2392efFb1BDb92',
      hardhat: '0xEFa07e4263D511fC3a7476772e2392efFb1BDb92',
    },
    tonAddress: {
      default: 7,
      goerli: '0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00',
      hardhat: '0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00',
      titan: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2',
      titangoerli: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
    },
    tonAdminAddress: {
      default: 8,
      goerli: '0xc1eba383D94c6021160042491A5dfaF1d82694E6',
      hardhat: '0xc1eba383D94c6021160042491A5dfaF1d82694E6',
      titan: '',
      titangoerli: ' ',
    },
    // tonAddress : {
    //   default: 7,
    //   titan: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2',
    //   titangoerli: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
    //   goerli: '0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00'
    // },
    paymasterAddress: {
      default: 9,
      goerli: '0xF33C5E2ABE4c052783AAed527390A77FAD5841FA',
      hardhat: '0xF33C5E2ABE4c052783AAed527390A77FAD5841FA',
    },
    l2TonAddress: {
      default: 10,
      goerli: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
      hardhat: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
      titangoerli: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
    },
    tosAddress: {
      default: 11,
      goerli: '0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9',
      hardhat: '0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9',
      // hardhat: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
      titan: '0xD08a2917653d4E460893203471f0000826fb4034',
      titangoerli: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
    },
    tosAdminAddress: {
      default: 12,
      goerli: '0xc1eba383D94c6021160042491A5dfaF1d82694E6',
      hardhat: '0xc1eba383D94c6021160042491A5dfaF1d82694E6',
      titangoerli: '0xc1eba383D94c6021160042491A5dfaF1d82694E6',
    },
    uniswapFactory: {
      default: 13,
      goerli: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      hardhat: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      titan: '0x755Ba335013C07CE35C9A2dd5746617Ac4c6c799',
      titangoerli: '0x37B8d7714419ba5B50379b799a0B2a582274F5Eb',
    },
    npm: {
      default: 14,
      goerli: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
      hardhat: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
      titan: '0xfAFc55Bcdc6e7a74C21DD51531D14e5DD9f29613',
      titangoerli: '0x8631308cDa88E98fc9DD109F537F9dEf84539370',
    },
    addressManager: {
      default: 15,
      goerli: '0xEFa07e4263D511fC3a7476772e2392efFb1BDb92',
      hardhat: '0xEFa07e4263D511fC3a7476772e2392efFb1BDb92',
      titangoerli: '0xEFa07e4263D511fC3a7476772e2392efFb1BDb92',
    },
    lockTOSAddress: {
      default: 16,
      goerli: '0x770e0d682277A4a9167971073f1Aa6d6403bb315',
      hardhat: '0x770e0d682277A4a9167971073f1Aa6d6403bb315',
      titangoerli: '0x770e0d682277A4a9167971073f1Aa6d6403bb315',
    },
    quoter:{
      default: 17,
      goerli: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      hardhat: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      titangoerli: '0xfD0c2ACFE71af67BC150cCd13dF3BEd6A3c22875',
    },
    uniswapRouter: {
      default: 18,
      goerli: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
      hardhat: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
      titangoerli: '0xf28cfA043766e4Fe9e390D66e0cd07991290fdD8',
    },
    testUser:
      'privatekey://0xf14a6e4b68641b84ebef1c0f73cde544348429fe135272e111b946b38d329e16', // for test (see scripts folder)
    accountForCreate2Deployer:
      `privatekey://${process.env.Create2DEPLOYER}`,
    myDeployer: `privatekey://${process.env.DEPLOYER}`,
    accountForProxyDeployer:
    `privatekey://${process.env.ProxyDEPLOYER}`,

  },
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.ETH_NODE_URI_GOERLI}`,
        blockNumber: 9448400
      },
      allowUnlimitedContractSize: false,
      // deploy: ['deploy_l1', 'deploy_l2'],
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
      accounts: [`${process.env.PRIVATE_KEY}`],
      gasMultiplier: 1.25,
      gasPrice: 25000000000,
    },
    goerli: {
      url: `${process.env.ETH_NODE_URI_GOERLI}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      // chainId: 5,
      deploy: ['deploy_l1']
    },
    titangoerli: {
      url: `${process.env.ETH_NODE_URI_DARIUS}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      chainId: 5050,
      gasPrice: 1000000000,
      deploy: ['deploy_l2']
    },
    "tokamakGoerli" : {
      url: `https://rpc.titan-goerli.tokamak.network`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      chainId: 5050
      // url: `https://goerli.optimism.tokamak.network`,
    },
  },
  // deterministicDeployment: (network: string) => {
  //   // Skip on hardhat's local network.
  //   if (network === "31337") {
  //     return undefined;
  //   } else {
  //     return {
  //       factory: "0x4e59b44847b379578588920ca78fbf26c0b4956c",
  //       deployer: "0x3fab184622dc19b6109349b94811493bf2a45362",
  //       funding: "10000000000000000",
  //       signedTx: "0x00",
  //     }
  //   }
    /*
    if (network === "31337") {
        return undefined;
    } else if(network === "5") {
      return {
        factory: "0x4e59b44847b379578588920ca78fbf26c0b4956c",
        deployer: "0x3fab184622dc19b6109349b94811493bf2a45362",
        funding: "10000000000000000",
        signedTx: "0x00",
      }
    } else if(network === "5050"){
      return {
        factory: "0x1431517b50f69bf710cc63beef9f83af03fa1be6",
        deployer: "0x21d88d1cee7424f53b2dfe1547229608cc859f50",
        funding: "10000000000000000",
        signedTx: "0x00",
      }
    }
    return {
        factory: "0x2222229fb3318a6375fa78fd299a9a42ac6a8fbf",
        deployer: "0x90899d3cc800c0a9196aec83da43e46582cb7435",
        // Must be deployed manually. Required funding may be more on
        // certain chains (e.g. Ethereum mainnet).
        funding: "10000000000000000",
        signedTx: "0x00",
    };
    */
  // },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    // apiKey: `${process.env.ETHERSCAN_API_KEY}`
    apiKey: {
      goerli: `${process.env.ETHERSCAN_API_KEY}`,
      titangoerli: "verify"
    },
    // apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "titangoerli",
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
