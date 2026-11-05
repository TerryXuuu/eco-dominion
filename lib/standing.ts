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

export type Rank = { tier: number; name: string; blurb: string };

const RANKS: Rank[] = [
  { tier: 7, name: 'Dominion', blurb: 'The table knows your name.' },
  { tier: 6, name: 'Apex', blurb: 'Few seats sit higher.' },
  { tier: 5, name: 'Keystone', blurb: 'The grove holds because of you.' },
  { tier: 4, name: 'Elder', blurb: 'A long season at the table.' },
  { tier: 3, name: 'Canopy', blurb: 'You shade the regions.' },
  { tier: 2, name: 'Grove', blurb: 'A stand of your own.' },
  { tier: 1, name: 'Sapling', blurb: 'Roots in the casual board.' },
  { tier: 0, name: 'Seed', blurb: 'The first season.' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function levelOf(rating: number, games: number) {
  if (!games) return 1;
  return Math.max(1, Math.min(40, Math.floor((rating - 800) / 50)));
}

export function rankOf(level: number): Rank {
  const safe = Math.max(1, Math.min(40, level));
  return RANKS.find((rank) => safe >= rankFloor(rank.tier)) ?? RANKS[RANKS.length - 1];
}

function rankFloor(tier: number) {
  return [1, 5, 10, 15, 20, 25, 30, 35][tier] ?? 1;
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
  const rival = Math.max(0, ...winsByOpponent.values());
  const bothTables = modes.has('casual') && (modes.has('private') || modes.has('practice'));
  const steps = (current: number, goal: number, unit: string) => `${Math.min(current, goal)}/${goal} ${unit}`;
  const achievements: Achievement[] = [
    { id: 'first', name: 'First table', detail: 'Finish a match', owned: played >= 1, progress: steps(played, 1, 'matches'), mark: 'sprout' },
    { id: 'win', name: 'First holding', detail: 'Win a match', owned: record.wins >= 1, progress: steps(record.wins, 1, 'wins'), mark: 'cup' },
    { id: 'five', name: 'Five holdings', detail: 'Win five matches', owned: record.wins >= 5, progress: steps(record.wins, 5, 'wins'), mark: 'cup' },
    { id: 'ten', name: 'Regular', detail: 'Finish ten matches', owned: played >= 10, progress: steps(played, 10, 'matches'), mark: 'sprout' },
    { id: 'resident', name: 'Resident', detail: 'Finish twenty-five matches', owned: played >= 25, progress: steps(played, 25, 'matches'), mark: 'sprout' },
    { id: 'hot', name: 'Hot hand', detail: 'Win three matches in a row', owned: bestWinStreak >= 3, progress: steps(bestWinStreak, 3, 'in a row'), mark: 'flame' },
    { id: 'unbroken', name: 'Unbroken', detail: 'Win five matches in a row', owned: bestWinStreak >= 5, progress: steps(bestWinStreak, 5, 'in a row'), mark: 'flame' },
    { id: 'returning', name: 'Returning', detail: 'Play on three days in a row', owned: bestDayStreak >= 3, progress: steps(bestDayStreak, 3, 'days'), mark: 'calendar' },
    { id: 'week', name: 'Week at the table', detail: 'Play on seven days in a row', owned: bestDayStreak >= 7, progress: steps(bestDayStreak, 7, 'days'), mark: 'calendar' },
    { id: 'line', name: 'Above the line', detail: 'Reach a ladder rating of 1100', owned: (peakRating ?? 0) >= 1100 && games > 0, progress: games > 0 ? `${Math.min(peakRating ?? 0, 1100)}/1100` : 'Unrated', mark: 'star' },
    { id: 'canopy', name: 'High canopy', detail: 'Reach a casual rating of 1300', owned: (peakRating ?? 0) >= 1300 && games > 0, progress: games > 0 ? `${Math.min(peakRating ?? 0, 1300)}/1300` : 'Unrated', mark: 'star' },
    { id: 'apex', name: 'Apex rating', detail: 'Reach a ladder rating of 1500', owned: (peakRating ?? 0) >= 1500 && games > 0, progress: games > 0 ? `${Math.min(peakRating ?? 0, 1500)}/1500` : 'Unrated', mark: 'star' },
    { id: 'harvest', name: 'Full table', detail: 'Score 12 or more in one match', owned: (bestScore ?? 0) >= 12, progress: bestScore === null ? '0/12' : `${Math.min(bestScore, 12)}/12`, mark: 'mountain' },
    { id: 'heavy', name: 'Heavy canopy', detail: 'Score 24 or more in a win', owned: heavy >= 1, progress: steps(heavy, 1, 'wins'), mark: 'mountain' },
    { id: 'clear', name: 'Clear holding', detail: 'Win by 8 or more', owned: (bestMargin ?? 0) >= 8, progress: bestMargin === null ? '0/8' : `${Math.min(Math.max(bestMargin, 0), 8)}/8`, mark: 'flag' },
    { id: 'dominion', name: 'Three regions', detail: 'Win by domination', owned: domination >= 1, progress: steps(domination, 1, 'wins'), mark: 'flag' },
    { id: 'left', name: 'They left the grove', detail: 'Win because the opponent surrendered', owned: concessions >= 1, progress: steps(concessions, 1, 'wins'), mark: 'shield' },
    { id: 'clock', name: 'On the clock', detail: 'Win because the opponent timed out', owned: timeouts >= 1, progress: steps(timeouts, 1, 'wins'), mark: 'shield' },
    { id: 'shutout', name: 'Quiet regions', detail: 'Win a scored match while the opponent scores 0', owned: shutouts >= 1, progress: steps(shutouts, 1, 'wins'), mark: 'shield' },
    { id: 'rival', name: 'Rival', detail: 'Beat the same opponent three times', owned: rival >= 3, progress: steps(rival, 3, 'wins'), mark: 'cup' },
    { id: 'both', name: 'Both tables', detail: 'Win a casual match and a private match', owned: bothTables, progress: `${modes.has('casual') ? 1 : 0}/1 casual · ${modes.has('private') || modes.has('practice') ? 1 : 0}/1 private`, mark: 'sprout' },
  ];
  return { record, winStreak, bestWinStreak, dayStreak, bestDayStreak, peakRating, bestScore, bestMargin, achievements };
}
