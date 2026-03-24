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

    // Always ensure ZeroLend is available as an executable option
    const hasZeroLend = pools.some(p => p.protocol.toLowerCase() === 'zerolend');
    if (!hasZeroLend) {
      pools.unshift(getMockOpportunities()[0]); // ZeroLend is index 0
    }

    if (pools.length === 0) {
      return getMockOpportunities();
    }

    // Pad with mock opportunities so there's always variety for 3 competing Alphas
    const mocks = getMockOpportunities();
    const merged = [...pools];
    for (const mock of mocks) {
      if (merged.length >= 3) break;
      if (!merged.some(p => p.protocol.toLowerCase() === mock.protocol.toLowerCase())) {
        merged.push(mock);
      }
    }

    return merged.slice(0, 10);
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
      protocol: 'ZeroLend',
      pool: 'USDC',
      chain: 'X Layer',
      apy: 4.8,
      tvl: 2100000,
      apyBase: 4.8,
      apyReward: 0,
      audited: true,
      riskLevel: 'low',
      contractAddress: '0xfFd79D05D5dc37E221ed7d3971E75ed5930c6580',
    },
    {
      protocol: 'Izumi Finance',
      pool: 'WETH-WOKB',
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
      pool: 'WETH-WOKB',
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
