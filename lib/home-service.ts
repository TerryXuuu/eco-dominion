import { CASUAL_SEASON_ID } from './match-rules.ts';
import type { Queryable } from './profile-service.ts';
import { career, levelOf, type Achievement, type CareerMatch } from './standing.ts';

export type HomeDashboard = {
  displayName: string;
  handle: string;
  roles: string[];
  rating: number;
  games: number;
  rank: number | null;
  level: number;
  record: { wins: number; losses: number; draws: number };
  winStreak: number;
  bestWinStreak: number;
  dayStreak: number;
  bestDayStreak: number;
  peakRating: number | null;
  bestScore: number | null;
  bestMargin: number | null;
  opponents: { handle: string; wins: number; losses: number; draws: number; games: number }[];
  recent: { id: string; opponent: string; outcome: string; mode: string; finishedAt: string; score: string }[];
  weeks: { label: string; games: number }[];
  playedOn: string[];
  achievements: Achievement[];
  hasAvatar: boolean;
};

export async function homeDashboard(client: Queryable, userId: string): Promise<HomeDashboard> {
  const profile = await client.query(
    `SELECT p.display_name, u.handle, p.avatar_key,
            COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
     FROM app_user u
     JOIN profile p ON p.user_id = u.id
     LEFT JOIN user_role r ON r.user_id = u.id
     WHERE u.id = $1
     GROUP BY p.display_name, u.handle, p.avatar_key`,
    [userId],
  );
  const row = profile.rows[0];
  const rolesRaw = row?.roles;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.map(String) : String(rolesRaw ?? '').replace(/^\{|\}$/g, '').split(',').filter(Boolean);
  const ratingRow = await client.query(
    `SELECT rating, games FROM rating WHERE season_id = $1 AND user_id = $2`,
    [CASUAL_SEASON_ID, userId],
  );
  const rating = ratingRow.rows[0] ? Number(ratingRow.rows[0].rating) : 1000;
  const games = ratingRow.rows[0] ? Number(ratingRow.rows[0].games) : 0;
  const rankRow = await client.query(
    `SELECT count(*)::int AS ahead FROM rating WHERE season_id = $1 AND (rating > $2 OR (rating = $2 AND games > $3))`,
    [CASUAL_SEASON_ID, rating, games],
  );
  const finished = await client.query(
    `SELECT m.id, m.mode, m.finished_at, r.winner_seat, r.reason, r.score0, r.score1, me.seat,
            u.handle AS opponent, rc.after_value
     FROM match_player me
     JOIN match m ON m.id = me.match_id AND m.status = 'finished'
     JOIN match_result r ON r.match_id = m.id
     JOIN match_player them ON them.match_id = m.id AND them.seat <> me.seat
     JOIN app_user u ON u.id = them.user_id
     LEFT JOIN rating_change rc ON rc.match_id = m.id AND rc.user_id = me.user_id
     WHERE me.user_id = $1
     ORDER BY m.finished_at ASC`,
    [userId],
  );
  const matches: (CareerMatch & { id: string })[] = finished.rows.map((item) => {
    const seat = Number(item.seat);
    const winner = item.winner_seat === null ? null : Number(item.winner_seat);
    const ownScore = item.score0 === null ? null : Number(seat === 0 ? item.score0 : item.score1);
    const theirScore = item.score0 === null ? null : Number(seat === 0 ? item.score1 : item.score0);
    return {
      id: String(item.id),
      finishedAt: new Date(item.finished_at as string).toISOString(),
      mode: String(item.mode),
      outcome: winner === null ? 'draw' : winner === seat ? 'win' : 'loss',
      reason: String(item.reason),
      ownScore,
      theirScore,
      ratingAfter: item.after_value === null ? null : Number(item.after_value),
      opponent: String(item.opponent),
    };
  });
  const summary = career(matches, rating, games);
  const byOpponent = new Map<string, { wins: number; losses: number; draws: number }>();
  for (const match of matches) {
    const bucket = byOpponent.get(match.opponent) ?? { wins: 0, losses: 0, draws: 0 };
    if (match.outcome === 'win') bucket.wins += 1;
    else if (match.outcome === 'loss') bucket.losses += 1;
    else bucket.draws += 1;
    byOpponent.set(match.opponent, bucket);
  }
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (7 - index) * 7);
    const label = `${start.getUTCMonth() + 1}/${start.getUTCDate()}`;
    return { label, games: 0, start: start.getTime(), end: start.getTime() + 7 * 86400000 };
  });
  for (const match of matches) {
    const at = Date.parse(match.finishedAt);
    const week = weeks.find((item) => at >= item.start && at < item.end);
    if (week) week.games += 1;
  }
  return {
    displayName: String(row?.display_name ?? 'Player'),
    handle: String(row?.handle ?? ''),
    roles,
    rating,
    games,
    rank: games > 0 ? Number(rankRow.rows[0].ahead) + 1 : null,
    level: levelOf(rating, games),
    record: summary.record,
    winStreak: summary.winStreak,
    bestWinStreak: summary.bestWinStreak,
    dayStreak: summary.dayStreak,
    bestDayStreak: summary.bestDayStreak,
    peakRating: summary.peakRating,
    bestScore: summary.bestScore,
    bestMargin: summary.bestMargin,
    opponents: [...byOpponent.entries()]
      .map(([handle, stats]) => ({ handle, ...stats, games: stats.wins + stats.losses + stats.draws }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 8),
    recent: matches.slice(-8).reverse().map((match) => ({
      id: match.id,
      opponent: match.opponent,
      outcome: match.outcome,
      mode: match.mode,
      finishedAt: match.finishedAt,
      score: match.ownScore === null || match.theirScore === null ? '—' : `${match.ownScore}–${match.theirScore}`,
    })),
    weeks: weeks.map(({ label, games: count }) => ({ label, games: count })),
    playedOn: matches.map((match) => match.finishedAt),
    achievements: summary.achievements,
    hasAvatar: Boolean(row?.avatar_key),
  };
}
