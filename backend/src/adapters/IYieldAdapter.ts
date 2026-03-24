export interface TokenSpec {
  address: string;
  symbol: string;
  decimals: number;
}

export interface DepositResult {
  txHash: string;
  tokenAddress: string;
  tokenSymbol: string;
  amountDeposited: bigint;
}

export interface WithdrawResult {
  txHash: string;
  amountReceived: bigint;
}

export interface IYieldAdapter {
  readonly protocolId: string;
  readonly protocolName: string;
  readonly supportsLP: boolean; // true = needs 2-token LP deposit

  // What token this protocol needs as input (router will swap XETH → this)
  getRequiredToken(): TokenSpec;

  // Deposit into the protocol; returns null on non-fatal failure
  deposit(
    privateKey: string,
    amount: bigint,
    token: TokenSpec,
    onBehalfOf: string
  ): Promise<DepositResult | null>;

  // Withdraw from the protocol; pass MaxUint256 for full withdrawal
  withdraw(
    privateKey: string,
    amount: bigint,
    token: TokenSpec,
    onBehalfOf: string
  ): Promise<WithdrawResult | null>;

  // Read on-chain deposited balance (aToken / LP token balance)
  getBalance(address: string, token: TokenSpec): Promise<bigint>;

  // Current APY for this protocol/pool (live from DeFiLlama or chain)
  getAPY(poolHint?: string): Promise<number>;
}
