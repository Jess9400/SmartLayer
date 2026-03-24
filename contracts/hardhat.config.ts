import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@okxweb3/hardhat-explorer-verify';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env' });

const DEPLOYER_PRIVATE_KEY = process.env.AGENT_ALPHA_PRIVATE_KEY || '';
const OKX_API_KEY = process.env.OKX_API_KEY || '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'paris',
    },
  },
  networks: {
    xlayerTestnet: {
      url: 'https://testrpc.xlayer.tech',
      chainId: 1952,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
    xlayerMainnet: {
      url: 'https://rpc.xlayer.tech',
      chainId: 196,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: OKX_API_KEY,
    customChains: [
      {
        network: 'xlayerMainnet',
        chainId: 196,
        urls: {
          apiURL: 'https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER',
          browserURL: 'https://www.oklink.com/xlayer',
        },
      },
    ],
  },
  okxweb3explorer: {
    apiKey: OKX_API_KEY,
    customChains: [
      {
        network: 'xlayerMainnet',
        chainId: 196,
        urls: {
          apiURL: 'https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER',
          browserURL: 'https://www.oklink.com/xlayer',
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
