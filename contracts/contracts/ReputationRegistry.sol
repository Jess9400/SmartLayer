// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReputationRegistry
 * @notice On-chain reputation system for Alpha agents, keyed by bytes32 agentId.
 *         Multiple agents can share a wallet while maintaining separate reputations.
 */
contract ReputationRegistry {
    address public owner;

    struct DealRecord {
        bytes32 alphaId;
        bool accepted;
        uint256 apyBps;
        uint256 investmentWei;
        uint256 feeEarnedWei;
        uint256 timestamp;
    }

    struct AlphaStats {
        uint256 totalPitched;
        uint256 totalAccepted;
        uint256 totalInvestedWei;
        uint256 totalFeesEarnedWei;
        uint256 sumApyBps;
        uint256 lastDealAt;
    }

    mapping(bytes32 => AlphaStats) public stats;
    mapping(bytes32 => DealRecord[]) private _history;
    mapping(address => bool) public authorized;

    event DealRecorded(bytes32 indexed alphaId, bool accepted, uint256 apyBps, uint256 investmentWei, uint256 feeWei);
    event AuthorizationSet(address indexed addr, bool auth);

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

    function setAuthorized(address addr, bool auth) external onlyOwner {
        authorized[addr] = auth;
        emit AuthorizationSet(addr, auth);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ─── Recording ────────────────────────────────────────────────────────────

    function recordDeal(
        bytes32 alphaId,
        bool accepted,
        uint256 apyBps,
        uint256 investmentWei,
        uint256 feeEarnedWei
    ) external onlyAuthorized {
        AlphaStats storage s = stats[alphaId];
        s.totalPitched++;
        s.lastDealAt = block.timestamp;

        if (accepted) {
            s.totalAccepted++;
            s.totalInvestedWei += investmentWei;
            s.totalFeesEarnedWei += feeEarnedWei;
            s.sumApyBps += apyBps;
        }

        DealRecord[] storage hist = _history[alphaId];
        if (hist.length >= 50) {
            for (uint256 i = 0; i < hist.length - 1; i++) {
                hist[i] = hist[i + 1];
            }
            hist.pop();
        }
        hist.push(DealRecord({
            alphaId: alphaId,
            accepted: accepted,
            apyBps: apyBps,
            investmentWei: investmentWei,
            feeEarnedWei: feeEarnedWei,
            timestamp: block.timestamp
        }));

        emit DealRecorded(alphaId, accepted, apyBps, investmentWei, feeEarnedWei);
    }

    // ─── Score ────────────────────────────────────────────────────────────────

    function getScore(bytes32 alphaId) public view returns (uint256) {
        AlphaStats memory s = stats[alphaId];
        if (s.totalPitched == 0) return 0;

        uint256 winRate = (s.totalAccepted * 100) / s.totalPitched;
        uint256 volume = s.totalPitched > 20 ? 20 : s.totalPitched;
        uint256 volumeScore = (volume * 100) / 20;

        uint256 avgApyBps = s.totalAccepted > 0 ? s.sumApyBps / s.totalAccepted : 0;
        uint256 avgApyPct = avgApyBps / 100;
        uint256 apyScore = avgApyPct > 20 ? 100 : (avgApyPct * 100) / 20;

        uint256 recencyScore = _recentScore(alphaId);

        return (winRate * 50 + volumeScore * 25 + apyScore * 15 + recencyScore * 10) / 100;
    }

    function _recentScore(bytes32 alphaId) internal view returns (uint256) {
        DealRecord[] storage hist = _history[alphaId];
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

    function getStats(bytes32 alphaId) external view returns (AlphaStats memory) {
        return stats[alphaId];
    }

    function getDealHistory(bytes32 alphaId) external view returns (DealRecord[] memory) {
        return _history[alphaId];
    }

    function getAvgApy(bytes32 alphaId) external view returns (uint256) {
        AlphaStats memory s = stats[alphaId];
        if (s.totalAccepted == 0) return 0;
        return s.sumApyBps / s.totalAccepted;
    }
}
