// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentRegistry
 * @notice Registers Alpha agents (protocol deal scouts) and manages Beta agent subscriptions.
 *         Alpha agents are deployed by protocols/funds to pitch deals.
 *         Beta agents (user-owned) subscribe to choose which Alphas can pitch to them.
 */
contract AgentRegistry {
    address public owner;

    struct AlphaInfo {
        string name;
        string pitchStyle;
        bool active;
        uint256 registeredAt;
    }

    // All registered Alpha agent addresses
    address[] public alphaAddresses;
    mapping(address => AlphaInfo) public alphaAgents;

    // beta => alpha => subscribed
    mapping(address => mapping(address => bool)) public isSubscribed;
    // beta => list of subscribed alpha addresses
    mapping(address => address[]) private _subscriptions;

    event AlphaRegistered(address indexed alpha, string name);
    event AlphaDeactivated(address indexed alpha);
    event Subscribed(address indexed subscriber, address indexed alpha);
    event Unsubscribed(address indexed subscriber, address indexed alpha);

    error NotOwner();
    error AlphaNotRegistered();
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

    /**
     * @notice Register a new Alpha agent. Only owner (SmartLayer deployer).
     */
    function registerAlpha(
        address alpha,
        string calldata name,
        string calldata pitchStyle
    ) external onlyOwner {
        if (alphaAgents[alpha].active) revert AlreadyRegistered();
        alphaAgents[alpha] = AlphaInfo(name, pitchStyle, true, block.timestamp);
        alphaAddresses.push(alpha);
        emit AlphaRegistered(alpha, name);
    }

    /**
     * @notice Deactivate an Alpha agent (removes from deal flow).
     */
    function deactivateAlpha(address alpha) external onlyOwner {
        alphaAgents[alpha].active = false;
        emit AlphaDeactivated(alpha);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ─── Subscriptions ────────────────────────────────────────────────────────

    /**
     * @notice Subscribe to an Alpha agent. Called by Beta agent wallet.
     *         Only subscribed Alphas can pitch deals to this Beta agent.
     */
    function subscribe(address alpha) external {
        if (!alphaAgents[alpha].active) revert AlphaNotRegistered();
        if (isSubscribed[msg.sender][alpha]) revert AlreadySubscribed();
        isSubscribed[msg.sender][alpha] = true;
        _subscriptions[msg.sender].push(alpha);
        emit Subscribed(msg.sender, alpha);
    }

    /**
     * @notice Unsubscribe from an Alpha agent.
     */
    function unsubscribe(address alpha) external {
        if (!isSubscribed[msg.sender][alpha]) revert NotSubscribed();
        isSubscribed[msg.sender][alpha] = false;
        address[] storage subs = _subscriptions[msg.sender];
        for (uint256 i = 0; i < subs.length; i++) {
            if (subs[i] == alpha) {
                subs[i] = subs[subs.length - 1];
                subs.pop();
                break;
            }
        }
        emit Unsubscribed(msg.sender, alpha);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getSubscriptions(address beta) external view returns (address[] memory) {
        return _subscriptions[beta];
    }

    function getAlphaCount() external view returns (uint256) {
        return alphaAddresses.length;
    }

    function getAllAlphas() external view returns (address[] memory addrs, AlphaInfo[] memory infos) {
        addrs = alphaAddresses;
        infos = new AlphaInfo[](alphaAddresses.length);
        for (uint256 i = 0; i < alphaAddresses.length; i++) {
            infos[i] = alphaAgents[alphaAddresses[i]];
        }
    }
}
