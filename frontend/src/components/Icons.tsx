import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// ─── Alpha Agent Identity Icons ────────────────────────────────────────────────

/** Nexus — Yield Hunter · aggressive spark/bolt */
export function NexusIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
    </svg>
  );
}

/** Citadel — Blue-Chip Scout · classical columns */
export function CitadelIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="2" y1="20" x2="22" y2="20" />
      <rect x="3" y="10" width="4" height="10" rx="0.5" />
      <rect x="10" y="6" width="4" height="14" rx="0.5" />
      <rect x="17" y="10" width="4" height="10" rx="0.5" />
      <polyline points="3 10 12 3 21 10" />
    </svg>
  );
}

/** Quant — Quant Analyst · trending-up chart with arrow */
export function QuantIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

/** Beta / Shield — personal AI agent · hex shield with checkmark */
export function ShieldIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill="currentColor" fillOpacity="0.15"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="9 12 11 14 15 10"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Generic protocol / building (fallback alpha) */
export function ProtocolIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M5 21V7l7-5 7 5v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

// ─── UI Action Icons ───────────────────────────────────────────────────────────

/** Lightning bolt — deal round / primary action */
export function LightningIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
    </svg>
  );
}

/** Stacked coins — capital / deposit */
export function CoinsIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <ellipse cx="9" cy="8" rx="6" ry="2.5" />
      <path d="M3 8v5c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V8" />
      <path d="M3 13v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5v-4" />
      <path d="M15 8.8c2.57.47 4.5 1.5 4.5 2.45v4c0 1.38-2.69 2.5-6 2.5" />
      <path d="M15 4.8c2.57.47 4.5 1.5 4.5 2.45v3" />
    </svg>
  );
}

/** Chain links — on-chain / XLayer / vault */
export function ChainLinkIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/** Neural network nodes — AI learning */
export function BrainIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
      <circle cx="12" cy="17" r="2" />
      <path d="M9 7h6M7 9l5 6M17 9l-5 6" />
      <path d="M5 7C3.5 7 2 8.34 2 10s1.5 3 3 3" />
      <path d="M19 7c1.5 0 3 1.34 3 3s-1.5 3-3 3" />
      <path d="M10 19c0 1.1.9 2 2 2s2-.9 2-2" />
    </svg>
  );
}

/** Speech bubble — live negotiation / chat */
export function ChatBubbleIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Bar chart — deal analysis */
export function ChartBarIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

/** Trophy cup — leaderboard */
export function TrophyIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4" />
      <path d="M7 4H4a1 1 0 0 0-1 1v2a5 5 0 0 0 5 5M17 4h3a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5" />
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
    </svg>
  );
}

// ─── Status / Decision Icons ───────────────────────────────────────────────────

/** Circle with checkmark — accepted / success */
export function CheckCircleIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/** Circle with X — rejected */
export function XCircleIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

/** Rotating arrows — pending / counter-offer */
export function RefreshCwIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/** Warning triangle — error */
export function WarningIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** Large filled check — deposit / tx success state */
export function CheckSuccessIcon({ className = '', size = 56 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="7 12 10 15 17 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Scoring Rubric Icons ──────────────────────────────────────────────────────

/** Protocol credibility — classical building */
export function BuildingIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M5 21V7l7-5 7 5v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

/** TVL depth — gem / diamond */
export function GemIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 22 22 7 12 2" />
      <line x1="2" y1="7" x2="22" y2="7" />
      <polyline points="7.5 7 12 2 16.5 7" />
    </svg>
  );
}

/** Macro / market conditions — globe */
export function GlobeIcon({ className = '', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/** Balanced risk profile — scale */
export function ScaleIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 6l9-3 9 3" />
      <path d="M3 6c0 3.87 2.69 7 6 7s6-3.13 6-7" />
      <path d="M9 13c0 3.87 2.69 7 6 7s6-3.13 6-7" />
    </svg>
  );
}

// ─── Rank Badge ────────────────────────────────────────────────────────────────

export function RankBadge({ rank }: { rank: number }) {
  const configs = [
    { bg: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400', label: '1st' },
    { bg: 'bg-gray-300/15 border-gray-400/30 text-gray-300',       label: '2nd' },
    { bg: 'bg-orange-600/20 border-orange-600/30 text-orange-400', label: '3rd' },
  ];
  const c = configs[rank] ?? null;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
      c ? c.bg : 'bg-gray-800 border-gray-700 text-gray-500'
    }`}>
      {c ? c.label : `#${rank + 1}`}
    </div>
  );
}
