export type CareerMatch = {
  finishedAt: string;
  mode: string;
  outcome: 'win' | 'loss' | 'draw';
  reason: string;
  ownScore: number | null;
  theirScore: number | null;
  ratingAfter: number | null;
  opponent: string;
};

export type Achievement = {
  id: string;
  name: string;
  detail: string;
  owned: boolean;
  progress: string;
  mark: string;
};

export type RankName = 'Sprout' | 'Sapling' | 'Tree' | 'Forest' | 'Ecosystem';
export type Rank = { tier: number; name: RankName };

/** Ladder tiers. The first tier is a newbie period. A tier you have reached is a floor. */
const GATES: { name: RankName; min: number }[] = [
  { name: 'Sprout', min: 0 },
  { name: 'Sapling', min: 300 },
  { name: 'Tree', min: 600 },
  { name: 'Forest', min: 800 },
  { name: 'Ecosystem', min: 1000 },
];

export const LADDER_WIN = 30;
export const LADDER_LOSS = 20;

const GAINS: Record<string, { win: number; draw: number; loss: number }> = {
  ranked: { win: 40, draw: 25, loss: 15 },
  casual: { win: 25, draw: 15, loss: 10 },
};

/** Experience added by one finished match. Practice and private rooms add none. A loss still adds. */
export function experienceGain(match: { mode: string; outcome: string }) {
  const table = GAINS[match.mode];
  if (!table) return 0;
  if (match.outcome === 'win') return table.win;
  if (match.outcome === 'draw') return table.draw;
  if (match.outcome === 'loss') return table.loss;
  return 0;
}

/** Thirty levels, fifty points each. The bar is the current level, not the rank. */
export const LEVELS = 30;
export const LEVEL_SPAN = 50;

export function levelProgress(xp: number) {
  const safe = Math.max(0, Math.floor(xp));
  const cap = LEVELS * LEVEL_SPAN;
  if (safe >= cap) return { level: LEVELS, into: LEVEL_SPAN, span: LEVEL_SPAN, percent: 100 };
  const level = Math.floor(safe / LEVEL_SPAN) + 1;
  const into = safe - (level - 1) * LEVEL_SPAN;
  return { level, into, span: LEVEL_SPAN, percent: Math.round((into / LEVEL_SPAN) * 100) };
}

export function progressOf(xp: number) {
  const safe = Math.max(0, Math.floor(xp));
  let index = 0;
  for (let i = 0; i < GATES.length; i += 1) if (safe >= GATES[i].min) index = i;
  const gate = GATES[index];
  const next = GATES[index + 1]?.min ?? null;
  const span = next === null ? null : next - gate.min;
  const into = span === null ? safe - gate.min : Math.min(safe - gate.min, span);
  return {
    name: gate.name,
    tier: index,
    xp: safe,
    floor: gate.min,
    into,
    next,
    percent: span === null || span === 0 ? 100 : Math.round((into / span) * 100),
  };
}

/** Win +30. Loss −20, except the newbie tier never deducts, and a score cannot fall through a tier already reached. */
export function applyLadder(score: number, peak: number, outcome: string) {
  const current = Math.max(0, Math.floor(score));
  const best = Math.max(current, Math.floor(peak));
  if (outcome === 'win') {
    const next = current + LADDER_WIN;
    return { score: next, peak: Math.max(best, next), delta: LADDER_WIN };
  }
  if (outcome !== 'loss') return { score: current, peak: best, delta: 0 };
  const gate = progressOf(best);
  if (gate.tier === 0) return { score: current, peak: best, delta: 0 };
  const next = Math.max(gate.floor, current - LADDER_LOSS);
  return { score: next, peak: best, delta: next - current };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function rankOf(xp: number): Rank {
  const progress = progressOf(xp);
  return { tier: progress.tier, name: progress.name };
}

function dayKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function shift(key: string, days: number) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function heat(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export type ActivityDay = { date: string; count: number; level: number };
export type ActivityWeek = { label: string; days: (ActivityDay | null)[] };

/** Fifty-three weeks of finished matches, Sunday through Saturday, ending this week. */
export function contributionGrid(matches: { finishedAt: string }[], now = new Date()): ActivityWeek[] {
  const counts = new Map<string, number>();
  for (const match of matches) {
    const key = dayKey(match.finishedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = dayKey(now);
  const weekday = new Date(`${today}T00:00:00.000Z`).getUTCDay();
  let cursor = shift(today, -weekday - 52 * 7);
  const weeks: ActivityWeek[] = [];
  while (cursor <= today) {
    const days: (ActivityDay | null)[] = [];
    for (let index = 0; index < 7; index += 1) {
      const date = shift(cursor, index);
      if (date > today) {
        days.push(null);
        continue;
      }
      const count = counts.get(date) ?? 0;
      days.push({ date, count, level: heat(count) });
    }
    const opensMonth = days.some((day) => day?.date.endsWith('-01'));
    const sample = days.find((day) => day);
    const label = sample && (weeks.length === 0 || opensMonth) ? MONTHS[Number(sample.date.slice(5, 7)) - 1] : '';
    weeks.push({ label, days });
    cursor = shift(cursor, 7);
  }
  return weeks;
}

function bestRun(days: string[]) {
  let best = 0;
  let run = 0;
  let previous = '';
  for (const day of days) {
    run = previous && day === shift(previous, 1) ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

function currentRun(days: Set<string>, today: string) {
  const yesterday = shift(today, -1);
  const start = days.has(today) ? today : days.has(yesterday) ? yesterday : '';
  if (!start) return 0;
  let run = 0;
  let cursor = start;
  while (days.has(cursor)) {
    run += 1;
    cursor = shift(cursor, -1);
  }
  return run;
}

export function career(matches: CareerMatch[], rating: number, games: number, now = new Date()) {
  const ordered = [...matches].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  const record = { wins: 0, losses: 0, draws: 0 };
  let winStreak = 0;
  let bestWinStreak = 0;
  let bestScore: number | null = null;
  let bestMargin: number | null = null;
  let peakRating: number | null = games > 0 ? rating : null;
  let domination = 0;
  let concessions = 0;
  let timeouts = 0;
  let shutouts = 0;
  let heavy = 0;
  const winsByOpponent = new Map<string, number>();
  const modes = new Set<string>();
  const days = new Set<string>();
  for (const match of ordered) {
    days.add(dayKey(match.finishedAt));
    if (match.outcome === 'win') {
      record.wins += 1;
      winStreak += 1;
      bestWinStreak = Math.max(bestWinStreak, winStreak);
      modes.add(match.mode);
      winsByOpponent.set(match.opponent, (winsByOpponent.get(match.opponent) ?? 0) + 1);
      if (match.reason === 'domination') domination += 1;
      if (match.reason === 'concession') concessions += 1;
      if (match.reason === 'timeout') timeouts += 1;
      if (match.ownScore !== null && match.theirScore === 0 && match.ownScore > 0) shutouts += 1;
    } else if (match.outcome === 'loss') {
      record.losses += 1;
      winStreak = 0;
    } else {
      record.draws += 1;
      winStreak = 0;
    }
    if (match.ownScore !== null) {
      bestScore = bestScore === null ? match.ownScore : Math.max(bestScore, match.ownScore);
      if (match.outcome === 'win' && match.theirScore !== null) {
        const margin = match.ownScore - match.theirScore;
        bestMargin = bestMargin === null ? margin : Math.max(bestMargin, margin);
        if (match.ownScore >= 24) heavy += 1;
      }
    }
    if (match.ratingAfter !== null) peakRating = peakRating === null ? match.ratingAfter : Math.max(peakRating, match.ratingAfter);
  }
  const played = ordered.length;
  const dayList = [...days].sort();
  const today = dayKey(now);
  const dayStreak = currentRun(days, today);
  const bestDayStreak = bestRun(dayList);
  let ladderScore = 0;
  let ladderPeak = 0;
  for (const match of ordered) {
    if (match.mode !== 'ranked') continue;
    const next = applyLadder(ladderScore, ladderPeak, match.outcome);
    ladderScore = next.score;
    ladderPeak = next.peak;
  }
  const points = (goal: number) => `${Math.min(ladderPeak, goal)}/${goal}`;
  const rival = Math.max(0, ...winsByOpponent.values());
  const bothTables = modes.has('casual') && (modes.has('private') || modes.has('practice'));
  const steps = (current: number, goal: number, unit: string) => `${Math.min(current, goal)}/${goal} ${unit}`;
  const achievements: Achievement[] = [
    { id: 'first', name: 'Opening', detail: 'Finish a match', owned: played >= 1, progress: steps(played, 1, 'matches'), mark: 'sprout' },
    { id: 'win', name: 'First win', detail: 'Win a match', owned: record.wins >= 1, progress: steps(record.wins, 1, 'wins'), mark: 'cup' },
    { id: 'five', name: 'Five wins', detail: 'Win five matches', owned: record.wins >= 5, progress: steps(record.wins, 5, 'wins'), mark: 'cup' },
    { id: 'ten', name: 'Ten games', detail: 'Finish ten matches', owned: played >= 10, progress: steps(played, 10, 'matches'), mark: 'sprout' },
    { id: 'resident', name: 'Veteran', detail: 'Finish twenty-five matches', owned: played >= 25, progress: steps(played, 25, 'matches'), mark: 'sprout' },
    { id: 'hot', name: 'Three straight', detail: 'Win three matches in a row', owned: bestWinStreak >= 3, progress: steps(bestWinStreak, 3, 'in a row'), mark: 'flame' },
    { id: 'unbroken', name: 'Five straight', detail: 'Win five matches in a row', owned: bestWinStreak >= 5, progress: steps(bestWinStreak, 5, 'in a row'), mark: 'flame' },
    { id: 'returning', name: 'Three days', detail: 'Play on three days in a row', owned: bestDayStreak >= 3, progress: steps(bestDayStreak, 3, 'days'), mark: 'calendar' },
    { id: 'week', name: 'Seven days', detail: 'Play on seven days in a row', owned: bestDayStreak >= 7, progress: steps(bestDayStreak, 7, 'days'), mark: 'calendar' },
    { id: 'line', name: 'Sapling', detail: 'Reach 300 ladder points', owned: ladderPeak >= 300, progress: points(300), mark: 'star' },
    { id: 'prime', name: 'Prime', detail: 'Reach 600 ladder points', owned: ladderPeak >= 600, progress: points(600), mark: 'star' },
    { id: 'canopy', name: 'Ancient', detail: 'Reach 800 ladder points', owned: ladderPeak >= 800, progress: points(800), mark: 'star' },
    { id: 'apex', name: 'Giant', detail: 'Reach 1000 ladder points', owned: ladderPeak >= 1000, progress: points(1000), mark: 'star' },
    { id: 'harvest', name: 'Harvest', detail: 'Score 12 or more in one match', owned: (bestScore ?? 0) >= 12, progress: bestScore === null ? '0/12' : `${Math.min(bestScore, 12)}/12`, mark: 'mountain' },
    { id: 'heavy', name: 'High score', detail: 'Score 24 or more in a win', owned: heavy >= 1, progress: steps(heavy, 1, 'wins'), mark: 'mountain' },
    { id: 'clear', name: 'Rout', detail: 'Win by 8 or more', owned: (bestMargin ?? 0) >= 8, progress: bestMargin === null ? '0/8' : `${Math.min(Math.max(bestMargin, 0), 8)}/8`, mark: 'flag' },
    { id: 'dominion', name: 'Domination', detail: 'Win by domination', owned: domination >= 1, progress: steps(domination, 1, 'wins'), mark: 'flag' },
    { id: 'left', name: 'Surrender', detail: 'Win because the opponent surrendered', owned: concessions >= 1, progress: steps(concessions, 1, 'wins'), mark: 'shield' },
    { id: 'clock', name: 'Timeout', detail: 'Win because the opponent timed out', owned: timeouts >= 1, progress: steps(timeouts, 1, 'wins'), mark: 'shield' },
    { id: 'shutout', name: 'Shutout', detail: 'Win a scored match while the opponent scores 0', owned: shutouts >= 1, progress: steps(shutouts, 1, 'wins'), mark: 'shield' },
    { id: 'rival', name: 'Rival', detail: 'Beat the same opponent three times', owned: rival >= 3, progress: steps(rival, 3, 'wins'), mark: 'cup' },
    { id: 'both', name: 'Two paths', detail: 'Win a casual match and a private match', owned: bothTables, progress: `${modes.has('casual') ? 1 : 0}/1 casual · ${modes.has('private') || modes.has('practice') ? 1 : 0}/1 private`, mark: 'sprout' },
  ];
  return { record, winStreak, bestWinStreak, dayStreak, bestDayStreak, peakRating, bestScore, bestMargin, achievements };
}
