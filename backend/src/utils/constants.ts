export const XLAYER_CHAIN_ID = 196;
export const XLAYER_RPC = process.env.XLAYER_RPC || 'https://rpc.xlayer.tech';

export const TOKENS = {
  USDC: '0x74b7f16337b8972027f6196a17a631ac6de26d22',
  WETH: '0x5a77f1443d16ee5761d310e38b62f77f726bc71c',
  WOKB:  '0xe538905cf8410324e03a5a23c1c177a474d59b2b',
};

export const AGENT_IDS = {
  ALPHA: 'agent-alpha',
  BETA:  'agent-beta',
};

// Multiple competing Alpha agents with distinct pitching personas
export const ALPHA_AGENTS = [
  {
    id: 'agent-alpha-nexus',
    name: 'Alpha Nexus',
    role: 'Yield Hunter',
    pitchStyle: 'You are an aggressive high-yield hunter. Lead with returns, emphasize upside and APY, be bold and confident. Your edge is finding the best rates before anyone else.',
  },
  {
    id: 'agent-alpha-citadel',
    name: 'Alpha Citadel',
    role: 'Blue-Chip Scout',
    pitchStyle: 'You are a conservative blue-chip advocate. Lead with security, audits, and track record. Emphasize capital preservation and protocol credibility over raw yield.',
  },
  {
    id: 'agent-alpha-quant',
    name: 'Alpha Quant',
    role: 'Quant Analyst',
    pitchStyle: 'You are a data-driven quantitative analyst. Lead with metrics: TVL, Sharpe ratio equivalent, risk-adjusted returns. Cite specific numbers. Be precise and analytical.',
  },
];

export const DEFILLAMA_YIELDS_URL = 'https://yields.llama.fi/pools';
export const OKX_BASE_URL = 'https://www.okx.com';
