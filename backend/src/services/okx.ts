import crypto from 'crypto';
import axios from 'axios';
import { ethers } from 'ethers';
import { OKX_BASE_URL, XLAYER_CHAIN_ID } from '../utils/constants';

const API_KEY = process.env.OKX_API_KEY || '';
const SECRET_KEY = process.env.OKX_SECRET_KEY || '';
const PASSPHRASE = process.env.OKX_PASSPHRASE || '';

function sign(timestamp: string, method: string, requestPath: string, body: string = ''): string {
  const message = timestamp + method + requestPath + body;
  return crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');
}

function getHeaders(method: string, path: string, body: string = '') {
  const timestamp = new Date().toISOString();
  return {
    'OK-ACCESS-KEY': API_KEY,
    'OK-ACCESS-SIGN': sign(timestamp, method, path, body),
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': PASSPHRASE,
    'Content-Type': 'application/json',
  };
}

export async function getWalletBalance(address: string, tokenAddress: string): Promise<string> {
  try {
    const path = `/api/v5/wallet/asset/token-balances-by-address?address=${address}&chainIndex=${XLAYER_CHAIN_ID}&tokenContractAddress=${tokenAddress}`;
    const { data } = await axios.get(OKX_BASE_URL + path, {
      headers: getHeaders('GET', path),
      timeout: 10000,
    });

    if (data.code === '0' && data.data?.[0]?.tokenAssets?.[0]) {
      return data.data[0].tokenAssets[0].balance;
    }
    return '0';
  } catch (err) {
    console.error('OKX balance error:', err);
    return '500'; // Demo fallback
  }
}

export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: string,
  userAddress: string
): Promise<{ toAmount: string; txData: string } | null> {
  try {
    const path = `/api/v5/dex/aggregator/swap?chainId=${XLAYER_CHAIN_ID}&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&userWalletAddress=${userAddress}&slippage=0.05`;
    const { data } = await axios.get(OKX_BASE_URL + path, {
      headers: getHeaders('GET', path),
      timeout: 15000,
    });

    if (data.code === '0' && data.data?.[0]) {
      return {
        toAmount: data.data[0].routerResult?.toTokenAmount || '0',
        txData: JSON.stringify(data.data[0].tx),
      };
    }
    return null;
  } catch (err) {
    console.error('OKX swap quote error:', err);
    return null;
  }
}

export async function executeSwap(
  privateKey: string,
  toToken: string,
  fromToken: string,
  amount: string,
  agentAddress: string
): Promise<string | null> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');
    const wallet = new ethers.Wallet(privateKey, provider);

    const quote = await getSwapQuote(fromToken, toToken, amount, agentAddress);
    if (!quote) return null;

    const txData = JSON.parse(quote.txData);

    const tx = await wallet.sendTransaction({
      to: txData.to,
      data: txData.data,
      value: BigInt(txData.value || '0'),
      gasLimit: BigInt(txData.gas || '300000'),
    });

    const receipt = await tx.wait();
    return receipt?.hash || null;
  } catch (err) {
    console.error('OKX execute swap error:', err);
    return null;
  }
}

export async function getAgentAddress(privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}
