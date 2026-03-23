// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentRegistry
 * @notice Registers Alpha agents by ID (not just address) so multiple agents
 *         can share a wallet in demo mode while maintaining distinct identities.
 *         Beta agents subscribe to Alpha IDs to control deal flow.
 */
contract AgentRegistry {
    address public owner;

    struct AlphaInfo {
        bytes32 agentId;
        string name;
        string pitchStyle;
        address feeAddress;   // where the 3% fee is sent
        bool active;
        uint256 registeredAt;
    }

    bytes32[] public alphaIds;
    mapping(bytes32 => AlphaInfo) public alphaAgents;

    // subscriber => agentId => subscribed
    mapping(address => mapping(bytes32 => bool)) public isSubscribed;
    // subscriber => list of subscribed alpha IDs
    mapping(address => bytes32[]) private _subscriptions;

    event AlphaRegistered(bytes32 indexed agentId, string name, address feeAddress);
    event AlphaDeactivated(bytes32 indexed agentId);
    event Subscribed(address indexed subscriber, bytes32 indexed agentId);
    event Unsubscribed(address indexed subscriber, bytes32 indexed agentId);

    error NotOwner();
    error AlphaNotFound();
    error AlreadyRegistered();
    error AlreadySubscribed();
    error NotSubscribed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function registerAlpha(
        bytes32 agentId,
        string calldata name,
        string calldata pitchStyle,
        address feeAddress
    ) external onlyOwner {
        if (alphaAgents[agentId].active) revert AlreadyRegistered();
        alphaAgents[agentId] = AlphaInfo(agentId, name, pitchStyle, feeAddress, true, block.timestamp);
        alphaIds.push(agentId);
        emit AlphaRegistered(agentId, name, feeAddress);
    }

    function deactivateAlpha(bytes32 agentId) external onlyOwner {
        alphaAgents[agentId].active = false;
        emit AlphaDeactivated(agentId);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ─── Subscriptions ────────────────────────────────────────────────────────

    function subscribe(bytes32 agentId) external {
        if (!alphaAgents[agentId].active) revert AlphaNotFound();
        if (isSubscribed[msg.sender][agentId]) revert AlreadySubscribed();
        isSubscribed[msg.sender][agentId] = true;
        _subscriptions[msg.sender].push(agentId);
        emit Subscribed(msg.sender, agentId);
    }

    function unsubscribe(bytes32 agentId) external {
        if (!isSubscribed[msg.sender][agentId]) revert NotSubscribed();
        isSubscribed[msg.sender][agentId] = false;
        bytes32[] storage subs = _subscriptions[msg.sender];
        for (uint256 i = 0; i < subs.length; i++) {
            if (subs[i] == agentId) {
                subs[i] = subs[subs.length - 1];
                subs.pop();
                break;
            }
        }
        emit Unsubscribed(msg.sender, agentId);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getSubscriptions(address subscriber) external view returns (bytes32[] memory) {
        return _subscriptions[subscriber];
    }

    function getFeeAddress(bytes32 agentId) external view returns (address) {
        return alphaAgents[agentId].feeAddress;
    }

    function getAllAlphas() external view returns (bytes32[] memory ids, AlphaInfo[] memory infos) {
        ids = alphaIds;
        infos = new AlphaInfo[](alphaIds.length);
        for (uint256 i = 0; i < alphaIds.length; i++) {
            infos[i] = alphaAgents[alphaIds[i]];
        }
    }

    function getAlphaCount() external view returns (uint256) {
        return alphaIds.length;
    }
}
