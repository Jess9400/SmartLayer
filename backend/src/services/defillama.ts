import axios from 'axios';
import { YieldOpportunity } from '../types';
import { DEFILLAMA_YIELDS_URL } from '../utils/constants';

interface LlamaPool {
  project: string;
  symbol: string;
  chain: string;
  apy: number;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  audits?: string;
}

export async function getYieldOpportunities(chain: string = 'X Layer'): Promise<YieldOpportunity[]> {
  try {
    const { data } = await axios.get(DEFILLAMA_YIELDS_URL, { timeout: 10000 });

    const pools: YieldOpportunity[] = data.data
      .filter((pool: LlamaPool) => {
        const chainMatch =
          pool.chain?.toLowerCase() === chain.toLowerCase() ||
          pool.chain?.toLowerCase() === 'xlayer' ||
          pool.chain?.toLowerCase() === 'x-layer';
        return chainMatch && pool.tvlUsd > 50000 && pool.apy > 0;
      })
      .slice(0, 10)
      .map((pool: LlamaPool) => ({
        protocol: pool.project,
        pool: pool.symbol,
        chain: pool.chain,
        apy: Math.round(pool.apy * 100) / 100,
        tvl: Math.round(pool.tvlUsd),
        apyBase: pool.apyBase || 0,
        apyReward: pool.apyReward || 0,
        audited: !!(pool.audits && pool.audits !== '0'),
        riskLevel: getRiskLevel(pool.apy, pool.tvlUsd),
      }));

    // If no XLayer pools found, return mock data for demo
    if (pools.length === 0) {
      return getMockOpportunities();
    }

    return pools;
  } catch (err) {
    console.error('DeFiLlama API error, using mock data:', err);
    return getMockOpportunities();
  }
}

function getRiskLevel(apy: number, tvl: number): 'low' | 'medium' | 'high' {
  if (apy > 50 || tvl < 100000) return 'high';
  if (apy > 20 || tvl < 500000) return 'medium';
  return 'low';
}

export function getMockOpportunities(): YieldOpportunity[] {
  return [
    {
      protocol: 'Curve',
      pool: 'USDC-USDT',
      chain: 'X Layer',
      apy: 8.2,
      tvl: 2400000,
      apyBase: 6.1,
      apyReward: 2.1,
      audited: true,
      riskLevel: 'low',
      contractAddress: '0x74b7f16337b8972027f6196a17a631ac6de26d22',
    },
    {
      protocol: 'Izumi Finance',
      pool: 'WETH-USDC',
      chain: 'X Layer',
      apy: 14.7,
      tvl: 890000,
      apyBase: 9.2,
      apyReward: 5.5,
      audited: true,
      riskLevel: 'medium',
      contractAddress: '0x5a77f1443d16ee5761d310e38b62f77f726bc71c',
    },
    {
      protocol: 'Lynex',
      pool: 'WOKB-USDC',
      chain: 'X Layer',
      apy: 22.1,
      tvl: 430000,
      apyBase: 12.0,
      apyReward: 10.1,
      audited: false,
      riskLevel: 'medium',
      contractAddress: '0xe538905cf8410324e03a5a23c1c177a474d59b2b',
    },
  ];
}

export async function getAvgStableYield(): Promise<number> {
  return 5.2; // Market average stablecoin yield
}
