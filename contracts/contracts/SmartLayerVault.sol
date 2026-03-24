// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ReputationRegistry.sol";
import "./AgentRegistry.sol";

/**
 * @title SmartLayerVault
 * @notice Capital delegation vault. Users deposit XETH and assign a Beta agent.
 *         execute() enforces the 97/3 split and records reputation atomically.
 */
contract SmartLayerVault {
    address public owner;
    ReputationRegistry public immutable reputationRegistry;
    AgentRegistry public immutable agentRegistry;

    uint256 public constant FEE_BPS = 300;
    uint256 public constant BPS_DENOM = 10_000;

    mapping(address => uint256) public balances;
    mapping(address => address) public betaAgent;
    mapping(address => address[]) private _agentUsers;

    // Reentrancy guard (add before next deployment)
    bool private _entered;
    error Reentrant();
    modifier nonReentrant() {
        if (_entered) revert Reentrant();
        _entered = true;
        _;
        _entered = false;
    }

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event AgentAssigned(address indexed user, address indexed agent);
    event DealExecuted(
        address indexed user,
        bytes32 indexed alphaId,
        address feeRecipient,
        address destination,
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
    error AlphaNotFound();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _reputationRegistry, address _agentRegistry) {
        owner = msg.sender;
        reputationRegistry = ReputationRegistry(_reputationRegistry);
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    // ─── User Actions ─────────────────────────────────────────────────────────

    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function assignAgent(address agent) external {
        betaAgent[msg.sender] = agent;
        _agentUsers[agent].push(msg.sender);
        emit AgentAssigned(msg.sender, agent);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        balances[msg.sender] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}('');
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    // ─── Agent Actions ────────────────────────────────────────────────────────

    /**
     * @notice Execute a deal. Only callable by the user's assigned Beta agent.
     * @param user        User whose balance to deduct
     * @param alphaId     bytes32 ID of the Alpha agent (from AgentRegistry)
     * @param destination Where the 97% investment is sent
     * @param amount      Total amount in wei
     * @param apyBps      Offered APY in basis points
     */
    function execute(
        address user,
        bytes32 alphaId,
        address payable destination,
        uint256 amount,
        uint256 apyBps
    ) external nonReentrant {
        if (betaAgent[user] == address(0)) revert NoAgentAssigned();
        if (msg.sender != betaAgent[user]) revert NotBetaAgent();
        if (amount == 0) revert ZeroAmount();
        if (balances[user] < amount) revert InsufficientBalance();

        address feeRecipient = agentRegistry.getFeeAddress(alphaId);
        if (feeRecipient == address(0)) revert AlphaNotFound();

        // Checks-effects-interactions
        balances[user] -= amount;

        uint256 feeAmount = (amount * FEE_BPS) / BPS_DENOM;
        uint256 investmentAmount = amount - feeAmount;

        (bool ok1, ) = destination.call{value: investmentAmount}('');
        if (!ok1) revert TransferFailed();

        (bool ok2, ) = payable(feeRecipient).call{value: feeAmount}('');
        if (!ok2) revert TransferFailed();

        reputationRegistry.recordDeal(alphaId, true, apyBps, investmentAmount, feeAmount);

        emit DealExecuted(user, alphaId, feeRecipient, destination, investmentAmount, feeAmount, apyBps);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function getBetaAgent(address user) external view returns (address) {
        return betaAgent[user];
    }

    function totalValueLocked() external view returns (uint256) {
        return address(this).balance;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
}
