import { isComputerHandle } from './computer.ts';
import { CASUAL_SEASON_ID } from './match-rules.ts';
import type { Queryable } from './profile-service.ts';
import { career, experienceGain, type Achievement, type CareerMatch } from './standing.ts';

export type HomeDashboard = {
  displayName: string;
  handle: string;
  roles: string[];
  rating: number;
  games: number;
  rank: number | null;
  xp: number;
  ladderScore: number;
  ladderPeak: number;
  lastGain: number;
  record: { wins: number; losses: number; draws: number };
  winStreak: number;
  bestWinStreak: number;
  dayStreak: number;
  bestDayStreak: number;
  peakRating: number | null;
  bestScore: number | null;
  bestMargin: number | null;
  opponents: { handle: string; displayName: string; wins: number; losses: number; draws: number; games: number }[];
  recent: { id: string; opponent: string; outcome: string; mode: string; finishedAt: string; score: string }[];
  weeks: { label: string; games: number }[];
  playedOn: string[];
  achievements: Achievement[];
  hasAvatar: boolean;
};

const DASHBOARD_TTL_MS = 20_000;
const dashboards = new Map<string, { at: number; data: HomeDashboard }>();

export async function homeDashboard(client: Queryable, userId: string): Promise<HomeDashboard> {
  const hit = dashboards.get(userId);
  if (hit && Date.now() - hit.at < DASHBOARD_TTL_MS) return hit.data;
  const profile = await client.query(
    `SELECT p.display_name, u.handle, p.avatar_key, p.peak_xp, p.ladder_score, p.ladder_peak,
            COALESCE((SELECT array_agg(role) FROM user_role r WHERE r.user_id = u.id), '{}') AS roles,
            rt.rating, rt.games,
            (SELECT count(*)::int FROM profile other
              JOIN app_user ou ON ou.id = other.user_id
              WHERE ou.status <> 'deleted' AND other.user_id <> u.id AND other.ladder_score > p.ladder_score) AS ahead,
            COALESCE((
              SELECT json_agg(json_build_object(
                'id', m.id, 'mode', m.mode, 'finished_at', m.finished_at, 'winner_seat', r.winner_seat,
                'reason', r.reason, 'score0', r.score0, 'score1', r.score1, 'seat', me.seat,
                'opponent', opp.handle, 'opponent_name', opp_profile.display_name, 'after_value', rc.after_value
              ) ORDER BY m.finished_at)
              FROM match_player me
              JOIN match m ON m.id = me.match_id AND m.status = 'finished'
              JOIN match_result r ON r.match_id = m.id
              JOIN match_player them ON them.match_id = m.id AND them.seat <> me.seat
              JOIN app_user opp ON opp.id = them.user_id
              JOIN profile opp_profile ON opp_profile.user_id = them.user_id
              LEFT JOIN rating_change rc ON rc.match_id = m.id AND rc.user_id = me.user_id
              WHERE me.user_id = u.id
            ), '[]'::json) AS matches
     FROM app_user u
     JOIN profile p ON p.user_id = u.id
     LEFT JOIN rating rt ON rt.user_id = u.id AND rt.season_id = $2
     WHERE u.id = $1`,
    [userId, CASUAL_SEASON_ID],
  );
  const row = profile.rows[0];
  const rolesRaw = row?.roles;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.map(String) : String(rolesRaw ?? '').replace(/^\{|\}$/g, '').split(',').filter(Boolean);
  const rating = row?.rating == null ? 1000 : Number(row.rating);
  const games = row?.games == null ? 0 : Number(row.games);
  const rawMatches = typeof row?.matches === 'string' ? JSON.parse(row.matches) : row?.matches;
  const finished = Array.isArray(rawMatches) ? rawMatches as Record<string, unknown>[] : [];
  const matches: (CareerMatch & { id: string; opponentName: string })[] = finished.map((item) => {
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
      opponentName: String(item.opponent_name ?? item.opponent),
    };
  });
  const counted = matches.filter((match) => match.mode === 'casual' || match.mode === 'ranked');
  const summary = career(matches, rating, games);
  const ladderPeak = Number(row?.ladder_peak ?? 0);
  for (const item of summary.achievements) {
    if (item.id === 'line') { item.owned = ladderPeak >= 300; item.progress = `${Math.min(ladderPeak, 300)}/300`; }
    if (item.id === 'prime') { item.owned = ladderPeak >= 600; item.progress = `${Math.min(ladderPeak, 600)}/600`; }
    if (item.id === 'canopy') { item.owned = ladderPeak >= 800; item.progress = `${Math.min(ladderPeak, 800)}/800`; }
    if (item.id === 'apex') { item.owned = ladderPeak >= 1000; item.progress = `${Math.min(ladderPeak, 1000)}/1000`; }
  }
  const scored = career(counted, rating, games);
  const byOpponent = new Map<string, { displayName: string; wins: number; losses: number; draws: number }>();
  for (const match of counted) {
    const bucket = byOpponent.get(match.opponent) ?? { displayName: match.opponentName, wins: 0, losses: 0, draws: 0 };
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
  const data = {
    displayName: String(row?.display_name ?? 'Player'),
    handle: String(row?.handle ?? ''),
    roles,
    rating,
    games,
    rank: Number(row?.ladder_score ?? 0) > 0 ? Number(row?.ahead ?? 0) + 1 : null,
    xp: Number(row?.peak_xp ?? 0),
    ladderScore: Number(row?.ladder_score ?? 0),
    ladderPeak: Number(row?.ladder_peak ?? 0),
    lastGain: matches.length ? experienceGain(matches[matches.length - 1]) : 0,
    record: scored.record,
    winStreak: scored.winStreak,
    bestWinStreak: scored.bestWinStreak,
    dayStreak: summary.dayStreak,
    bestDayStreak: summary.bestDayStreak,
    peakRating: summary.peakRating,
    bestScore: summary.bestScore,
    bestMargin: summary.bestMargin,
    opponents: [...byOpponent.entries()]
      .map(([handle, stats]) => ({ handle, displayName: stats.displayName, wins: stats.wins, losses: stats.losses, draws: stats.draws, games: stats.wins + stats.losses + stats.draws }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 8),
    recent: matches.slice(-8).reverse().map((match) => ({
      id: match.id,
      opponent: match.opponentName,
      outcome: match.outcome,
      mode: isComputerHandle(match.opponent) ? 'practice' : match.mode,
      finishedAt: match.finishedAt,
      score: match.ownScore === null || match.theirScore === null ? '—' : `${match.ownScore}–${match.theirScore}`,
    })),
    weeks: weeks.map(({ label, games: count }) => ({ label, games: count })),
    playedOn: matches.map((match) => match.finishedAt),
    achievements: summary.achievements,
    hasAvatar: Boolean(row?.avatar_key),
  };
  dashboards.set(userId, { at: Date.now(), data });
  return data;
}

export type FriendHome = { home: HomeDashboard; hideRecord: boolean; hideAchievements: boolean; hideHotspot: boolean; hideActivity: boolean };

/** A friend's home page. Hidden blocks drop out when that friend turned them off. */
export async function friendDashboard(client: Queryable, viewerId: string, handle: string): Promise<FriendHome | null> {
  const target = await client.query(
    `SELECT u.id, p.hide_record, p.hide_achievements, p.hide_hotspot, p.hide_activity
     FROM app_user u JOIN profile p ON p.user_id = u.id
     WHERE lower(u.handle) = lower($1) AND u.status = 'active'`,
    [handle],
  );
  const row = target.rows[0];
  if (!row || String(row.id) === viewerId) return null;
  const friends = await client.query(
    `SELECT 1 FROM friend_request
     WHERE status = 'accepted' AND ((sender = $1 AND recipient = $2) OR (sender = $2 AND recipient = $1))`,
    [viewerId, row.id],
  );
  if (!friends.rows.length) return null;
  return {
    home: await homeDashboard(client, String(row.id)),
    hideRecord: Boolean(row.hide_record),
    hideAchievements: Boolean(row.hide_achievements),
    hideHotspot: Boolean(row.hide_hotspot),
    hideActivity: Boolean(row.hide_activity),
  };
}
