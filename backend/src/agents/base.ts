import { AgentMemory, AgentState } from '../types';
import { getAgentMemory } from '../memory/store';
import { getWalletBalance, getAgentAddress } from '../services/okx';
import { TOKENS } from '../utils/constants';

export class BaseAgent {
  id: string;
  name: string;
  role: string;
  privateKey: string;
  walletAddress: string = '';

  constructor(id: string, name: string, role: string, privateKey: string) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.privateKey = privateKey;
  }

  async init(): Promise<void> {
    this.walletAddress = await getAgentAddress(this.privateKey);
  }

  async getBalance(): Promise<string> {
    return getWalletBalance(this.walletAddress, TOKENS.WETH);
  }

  getMemory(): AgentMemory {
    return getAgentMemory(this.id);
  }

  async getState(): Promise<AgentState> {
    const [balance, memory] = await Promise.all([
      this.getBalance(),
      Promise.resolve(this.getMemory()),
    ]);
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      walletAddress: this.walletAddress,
      balance,
      memory,
    };
  }
}
