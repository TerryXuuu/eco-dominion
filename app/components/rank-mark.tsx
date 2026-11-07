import { levelProgress, rankOf } from '@/lib/standing';

function Glyph({ tier }: { tier: number }) {
  if (tier === 0) return <ellipse cx="16" cy="18" rx="4.2" ry="6" />;
  if (tier === 1) return <path d="M15 25h2v-8h-2zM16 16c-4 0-6-3-5-6 2 1 4 2 5 4 1-2 3-3 5-4-1 3-1 6-5 6z" />;
  if (tier === 2) return <path d="M8 24h4l-2-8zM14 24h4l-2-11zM20 24h4l-2-7z" />;
  if (tier === 3) return <path d="M6 22c3-7 6-10 10-10s7 3 10 10H6zM15 22h2v4h-2z" />;
  if (tier === 4) return <path d="M16 6l3 6h-6zM8 24c2-6 4-9 8-9s6 3 8 9H8zM15 18h2v6h-2z" />;
  if (tier === 5) return <path d="M7 22h18l-2-6H9zM11 16h10l-1.5-4h-7zM14 12h4l-2-4z" />;
  if (tier === 6) return <path d="M6 24l6-14 4 8 4-8 6 14H6z" />;
  return <path d="M16 5l2.2 4.6 5 .7-3.6 3.5.9 5.1L16 16.4 11.5 18.9l.9-5.1L8.8 10.3l5-.7zM8 24h16v2H8z" />;
}

/** Seal for a ladder tier. Tiers run from 新芽 at 0 to 巨树 at 1000. */
export function RankMark({ score, size = 28 }: { score: number; size?: number }) {
  const rank = rankOf(score);
  return (
    <svg className={`rank-mark tier-${rank.tier}`} width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={rank.name}>
      <circle cx="16" cy="16" r="15" />
      <Glyph tier={rank.tier} />
    </svg>
  );
}

/** Fill toward the next of the thirty levels. At level 30 the bar stays full. */
export function ExperienceBar({ xp, label, note }: { xp: number; label?: string; note?: string }) {
  const progress = levelProgress(xp);
  return (
    <span className="xp-line" title={note}>
      {label ? <span className="xp-label">{label}</span> : null}
      <span className="xp-track" role="progressbar" aria-label={label ?? String(progress.level)} aria-valuenow={progress.into} aria-valuemin={0} aria-valuemax={progress.span}>
        <span style={{ width: `${progress.percent}%` }} />
      </span>
      <span className="xp-num">{progress.into}/{progress.span}</span>
    </span>
  );
}

function BadgeGlyph({ kind }: { kind: string }) {
  if (kind === 'flame') return <path d="M16 6c2 4 6 5 6 10a6 6 0 1 1-12 0c0-3 2-4 3-7 1 2 2 2 3-3z" />;
  if (kind === 'calendar') return <path d="M9 10h14v14H9zM9 14h14M12 8v4M20 8v4" fill="none" stroke="#f7f3ea" strokeWidth="1.8" />;
  if (kind === 'star') return <path d="M16 7l2 5h5l-4 3 1.5 5L16 17l-4.5 3L13 15l-4-3h5z" />;
  if (kind === 'mountain') return <path d="M5 24l7-12 4 6 3-4 8 10H5z" />;
  if (kind === 'flag') return <path d="M11 26V7h2v4h9l-2 4 2 4h-9v7z" />;
  if (kind === 'shield') return <path d="M16 6l8 3v7c0 5-3 8-8 10-5-2-8-5-8-10V9z" />;
  if (kind === 'cup') return <path d="M11 8h10v6a5 5 0 0 1-10 0zM9 9H7v3a3 3 0 0 0 3 3M23 9h2v3a3 3 0 0 1-3 3M16 19v3M12 24h8" fill="none" stroke="#f7f3ea" strokeWidth="1.8" />;
  return <path d="M16 24V14M16 16c-4 0-6-2-5-5 2 1 4 1 5 3 1-2 3-2 5-3 1 3-1 5-5 5z" />;
}

export function AchievementMark({ kind }: { kind: string }) {
  const stroked = kind === 'calendar' || kind === 'cup';
  return (
    <svg className={stroked ? 'badge-mark stroked' : 'badge-mark'} width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" />
      <BadgeGlyph kind={kind} />
    </svg>
  );
}
