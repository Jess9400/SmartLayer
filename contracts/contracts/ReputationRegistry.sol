// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReputationRegistry
 * @notice On-chain reputation system for Alpha agents.
 *         Every deal pitched is recorded here — accepted or rejected, with APY and amounts.
 *         Reputation score (0–100) is computed from verifiable on-chain history.
 *         Authorized callers: SmartLayerVault (on execution) + operator (backend, for rejected deals).
 */
contract ReputationRegistry {
    address public owner;

    struct DealRecord {
        address alphaAgent;
        bool accepted;
        uint256 apyBps;           // APY in basis points (e.g. 1500 = 15.00%)
        uint256 investmentWei;    // amount invested (0 if rejected)
        uint256 feeEarnedWei;     // 3% fee earned (0 if rejected)
        uint256 timestamp;
    }

    struct AlphaStats {
        uint256 totalPitched;
        uint256 totalAccepted;
        uint256 totalInvestedWei;
        uint256 totalFeesEarnedWei;
        uint256 sumApyBps;        // sum of all accepted deal APYs for avg computation
        uint256 lastDealAt;
    }

    // alpha => stats
    mapping(address => AlphaStats) public stats;
    // alpha => deal history (capped at last 50 for gas)
    mapping(address => DealRecord[]) private _history;

    // authorized to record deals (Vault + backend operator)
    mapping(address => bool) public authorized;

    event DealRecorded(address indexed alpha, bool accepted, uint256 apyBps, uint256 investmentWei, uint256 feeWei);
    event AuthorizationSet(address indexed addr, bool authorized);

    error NotOwner();
    error NotAuthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthorized() {
        if (!authorized[msg.sender] && msg.sender != owner) revert NotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        authorized[msg.sender] = true;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setAuthorized(address addr, bool auth) external onlyOwner {
        authorized[addr] = auth;
        emit AuthorizationSet(addr, auth);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ─── Recording ────────────────────────────────────────────────────────────

    /**
     * @notice Record a deal outcome. Called by SmartLayerVault (on execute) or backend operator.
     * @param alpha         Alpha agent address
     * @param accepted      Whether Beta accepted the pitch
     * @param apyBps        Offered APY in basis points
     * @param investmentWei Amount invested (0 if rejected)
     * @param feeEarnedWei  3% fee sent to Alpha (0 if rejected)
     */
    function recordDeal(
        address alpha,
        bool accepted,
        uint256 apyBps,
        uint256 investmentWei,
        uint256 feeEarnedWei
    ) external onlyAuthorized {
        AlphaStats storage s = stats[alpha];
        s.totalPitched++;
        s.lastDealAt = block.timestamp;

        if (accepted) {
            s.totalAccepted++;
            s.totalInvestedWei += investmentWei;
            s.totalFeesEarnedWei += feeEarnedWei;
            s.sumApyBps += apyBps;
        }

        // Keep last 50 deals
        DealRecord[] storage hist = _history[alpha];
        if (hist.length >= 50) {
            // Shift out the oldest
            for (uint256 i = 0; i < hist.length - 1; i++) {
                hist[i] = hist[i + 1];
            }
            hist.pop();
        }
        hist.push(DealRecord({
            alphaAgent: alpha,
            accepted: accepted,
            apyBps: apyBps,
            investmentWei: investmentWei,
            feeEarnedWei: feeEarnedWei,
            timestamp: block.timestamp
        }));

        emit DealRecorded(alpha, accepted, apyBps, investmentWei, feeEarnedWei);
    }

    // ─── Reputation Score ─────────────────────────────────────────────────────

    /**
     * @notice Compute Alpha's reputation score (0–100).
     *
     * Formula:
     *   winRate     = totalAccepted / totalPitched           → 0–100  (weight 50)
     *   volumeScore = min(totalPitched, 20) / 20             → 0–100  (weight 25)
     *   apyScore    = min(avgApyBps / 100, 20) / 20          → 0–100  (weight 15)
     *   recencyScore = recentAccepted (last 10) / 10         → 0–100  (weight 10)
     */
    function getScore(address alpha) public view returns (uint256) {
        AlphaStats memory s = stats[alpha];
        if (s.totalPitched == 0) return 0;

        uint256 winRate = (s.totalAccepted * 100) / s.totalPitched;
        uint256 volume = s.totalPitched > 20 ? 20 : s.totalPitched;
        uint256 volumeScore = (volume * 100) / 20;

        uint256 avgApyBps = s.totalAccepted > 0 ? s.sumApyBps / s.totalAccepted : 0;
        uint256 avgApyPct = avgApyBps / 100;
        uint256 apyScore = avgApyPct > 20 ? 100 : (avgApyPct * 100) / 20;

        uint256 recencyScore = _recentAcceptanceScore(alpha);

        return (winRate * 50 + volumeScore * 25 + apyScore * 15 + recencyScore * 10) / 100;
    }

    function _recentAcceptanceScore(address alpha) internal view returns (uint256) {
        DealRecord[] storage hist = _history[alpha];
        if (hist.length == 0) return 0;
        uint256 start = hist.length > 10 ? hist.length - 10 : 0;
        uint256 recentAccepted = 0;
        uint256 recentTotal = hist.length - start;
        for (uint256 i = start; i < hist.length; i++) {
            if (hist[i].accepted) recentAccepted++;
        }
        return recentTotal > 0 ? (recentAccepted * 100) / recentTotal : 0;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getStats(address alpha) external view returns (AlphaStats memory) {
        return stats[alpha];
    }

    function getDealHistory(address alpha) external view returns (DealRecord[] memory) {
        return _history[alpha];
    }

    function getAvgApy(address alpha) external view returns (uint256 apyBps) {
        AlphaStats memory s = stats[alpha];
        if (s.totalAccepted == 0) return 0;
        return s.sumApyBps / s.totalAccepted;
    }
}
