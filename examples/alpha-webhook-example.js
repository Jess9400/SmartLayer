/**
 * SmartLayer — External Alpha Webhook Example
 *
 * Any protocol, fund, or developer can run an Alpha agent that competes in
 * SmartLayer deal rounds. Your server receives the current yield opportunity
 * and Beta's context, then responds with your pitch.
 *
 * SmartLayer's Beta agent (powered by Claude AI) will score your pitch alongside
 * the built-in Alphas. If yours wins, capital executes on-chain automatically.
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 *   npm install express
 *   node alpha-webhook-example.js
 *
 * ── Register with SmartLayer ─────────────────────────────────────────────────
 *   curl -X POST https://smartlayer1-production.up.railway.app/api/agents/webhook \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *           "name": "My Alpha",
 *           "webhookUrl": "https://your-server.com/pitch",
 *           "pitchStyle": "Aggressive yield hunter focused on high APY"
 *         }'
 *
 * ── Webhook contract ─────────────────────────────────────────────────────────
 *   POST /pitch
 *   Body: { opportunity, betaContext }
 *   Response: { protocol, pool, apy, pitchMessage, suggestedAmount, confidence }
 */

const express = require('express');
const app = express();
app.use(express.json());

app.post('/pitch', (req, res) => {
  const { opportunity, betaContext } = req.body;

  // opportunity = { protocol, pool, chain, apy, tvl, riskLevel, audited }
  // betaContext  = { dealsAccepted: [...], riskProfile: 'moderate', budgetBalance: '0.05' }

  // ── Your strategy logic goes here ──────────────────────────────────────────
  // This example: pitch if APY > 8%, adjust confidence based on TVL
  const isHighYield = opportunity.apy >= 8;
  const isTrustedSize = opportunity.tvl >= 1_000_000;
  const confidence = isHighYield && isTrustedSize ? 85 : isHighYield ? 65 : 45;

  const pitchMessage =
    `${opportunity.protocol} ${opportunity.pool} is offering ${opportunity.apy}% APY ` +
    `with $${(opportunity.tvl / 1e6).toFixed(1)}M TVL on ${opportunity.chain}. ` +
    `${opportunity.audited ? 'Contracts are audited.' : 'Audit status unverified.'} ` +
    `${isHighYield ? 'Strong yield — recommend allocation.' : 'Yield is moderate — consider small position.'}`;

  res.json({
    protocol: opportunity.protocol,
    pool: opportunity.pool,
    apy: opportunity.apy,
    pitchMessage,
    suggestedAmount: 0.0005,  // XETH to suggest
    confidence,               // 0–100 — higher = more conviction
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\nAlpha webhook server running on port ${PORT}`);
  console.log('\nRegister with SmartLayer (local):');
  console.log(`  curl -X POST http://localhost:3001/api/agents/webhook \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"name":"My Alpha","webhookUrl":"http://localhost:${PORT}/pitch","pitchStyle":"Aggressive yield hunter"}'`);
  console.log('\nList registered webhook Alphas:');
  console.log('  curl http://localhost:3001/api/agents/webhooks');
});
