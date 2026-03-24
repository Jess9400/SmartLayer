/**
 * IzumiAdapter — stub for Izumi Finance (concentrated liquidity DEX on XLayer).
 *
 * Izumi uses NFT-based LP positions requiring two tokens. Full implementation
 * needs: token ratio calculation, addLiquidity call, and NFT position tracking.
 * Until implemented, this adapter falls back to ZeroLend transparently.
 */
import { IYieldAdapter, TokenSpec, DepositResult, WithdrawResult } from './IYieldAdapter';
import { ZeroLendAdapter } from './ZeroLendAdapter';
import { TOKENS } from '../utils/constants';

const fallback = new ZeroLendAdapter();

export class IzumiAdapter implements IYieldAdapter {
  readonly protocolId = 'izumi';
  readonly protocolName = 'Izumi Finance';
  readonly supportsLP = true;

  getRequiredToken(): TokenSpec {
    // LP needs WETH + WOKB, but we fall back to ZeroLend's USDC path
    return { address: TOKENS.USDC, symbol: 'USDC', decimals: 6 };
  }

  async deposit(
    privateKey: string,
    amount: bigint,
    token: TokenSpec,
    onBehalfOf: string
  ): Promise<DepositResult | null> {
    console.log('[Izumi] LP deposit not yet implemented — routing to ZeroLend');
    return fallback.deposit(privateKey, amount, token, onBehalfOf);
  }

  async withdraw(
    privateKey: string,
    amount: bigint,
    token: TokenSpec,
    onBehalfOf: string
  ): Promise<WithdrawResult | null> {
    console.log('[Izumi] LP withdraw not yet implemented — routing to ZeroLend');
    return fallback.withdraw(privateKey, amount, token, onBehalfOf);
  }

  async getBalance(address: string, token: TokenSpec): Promise<bigint> {
    return fallback.getBalance(address, token);
  }

  async getAPY(poolHint?: string): Promise<number> {
    // Return Izumi APY from DeFiLlama if available, else fallback
    return fallback.getAPY(poolHint);
  }
}
