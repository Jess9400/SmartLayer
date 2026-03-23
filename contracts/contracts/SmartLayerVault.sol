// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ReputationRegistry.sol";

/**
 * @title SmartLayerVault
 * @notice Capital delegation vault for SmartLayer.
 *
 * Users deposit XETH into this vault and assign a Beta agent to manage their funds.
 * When a deal is accepted, only the assigned Beta agent can call execute(), which:
 *   1. Routes 97% of the amount to the deal destination
 *   2. Sends 3% performance fee directly to the Alpha agent
 *   3. Records the deal in ReputationRegistry (immutable on-chain track record)
 *
 * Users retain full withdrawal rights at all times — the Beta agent can only
 * execute outbound transfers, never drain the vault.
 */
contract SmartLayerVault {
    address public owner;
    ReputationRegistry public immutable reputationRegistry;

    uint256 public constant FEE_BPS = 300;      // 3% Alpha performance fee
    uint256 public constant BPS_DENOM = 10_000;

    // user => deposited balance (in wei)
    mapping(address => uint256) public balances;
    // user => assigned Beta agent address
    mapping(address => address) public betaAgent;
    // beta agent => list of users who assigned them
    mapping(address => address[]) private _agentUsers;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event AgentAssigned(address indexed user, address indexed betaAgent);
    event DealExecuted(
        address indexed user,
        address indexed alphaAgent,
        address indexed destination,
        uint256 investmentAmount,
        uint256 feeAmount,
        uint256 apyBps
    );

    error NotOwner();
    error NoAgentAssigned();
    error NotBetaAgent();
    error InsufficientBalance();
    error ZeroAmount();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _reputationRegistry) {
        owner = msg.sender;
        reputationRegistry = ReputationRegistry(_reputationRegistry);
    }

    // ─── User Actions ─────────────────────────────────────────────────────────

    /**
     * @notice Deposit XETH into the vault.
     */
    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Assign a Beta agent to manage your capital.
     *         The agent can execute deals on your behalf but cannot withdraw to themselves.
     */
    function assignAgent(address agent) external {
        betaAgent[msg.sender] = agent;
        _agentUsers[agent].push(msg.sender);
        emit AgentAssigned(msg.sender, agent);
    }

    /**
     * @notice Withdraw your XETH from the vault. Only you can do this.
     */
    function withdraw(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        balances[msg.sender] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}('');
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    // ─── Agent Actions ────────────────────────────────────────────────────────

    /**
     * @notice Execute a deal on behalf of a user. Only callable by their assigned Beta agent.
     *
     * @param user          The user whose balance to use
     * @param alphaAgent    Alpha agent receiving the 3% fee
     * @param destination   Where the 97% investment is sent (protocol / proof-of-execution address)
     * @param amount        Total amount in wei to allocate for this deal
     * @param apyBps        APY offered by Alpha, in basis points (for on-chain record)
     */
    function execute(
        address user,
        address payable alphaAgent,
        address payable destination,
        uint256 amount,
        uint256 apyBps
    ) external {
        if (betaAgent[user] == address(0)) revert NoAgentAssigned();
        if (msg.sender != betaAgent[user]) revert NotBetaAgent();
        if (amount == 0) revert ZeroAmount();
        if (balances[user] < amount) revert InsufficientBalance();

        // Checks-effects-interactions
        balances[user] -= amount;

        uint256 feeAmount = (amount * FEE_BPS) / BPS_DENOM;
        uint256 investmentAmount = amount - feeAmount;

        // Send investment
        (bool ok1, ) = destination.call{value: investmentAmount}('');
        if (!ok1) revert TransferFailed();

        // Send 3% fee to Alpha
        (bool ok2, ) = alphaAgent.call{value: feeAmount}('');
        if (!ok2) revert TransferFailed();

        // Record deal on-chain (immutable reputation record)
        reputationRegistry.recordDeal(alphaAgent, true, apyBps, investmentAmount, feeAmount);

        emit DealExecuted(user, alphaAgent, destination, investmentAmount, feeAmount, apyBps);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function getBetaAgent(address user) external view returns (address) {
        return betaAgent[user];
    }

    function getAgentUsers(address agent) external view returns (address[] memory) {
        return _agentUsers[agent];
    }

    function totalValueLocked() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    receive() external payable {
        // Allow direct deposits via receive (treated as deposit for msg.sender)
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
}
