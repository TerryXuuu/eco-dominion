import { SiteHeader } from '../components/site-header';
import { LeaderboardTable } from '../components/record-tables';
import { withTransaction } from '@/lib/db';
import { leaderboard } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function LeaderboardPage() {
  const { body } = await withTransaction((client) => leaderboard(client));
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <h1>Casual rating</h1>
        <p className="note">Elo from casual-queue matches only (K=32, everyone starts at 1000). Private rooms are unrated, and ranked play is not enabled. Players with non-public profiles are listed without their name. Click a heading to sort, or type in a column to filter.</p>
        {body.entries.length === 0 && <p className="note">No rated matches yet.</p>}
        {body.entries.length > 0 && (
          <LeaderboardTable
            rows={body.entries.map((row) => ({
              rank: row.rank,
              player: row.displayName ?? 'Hidden player',
              rating: row.rating,
              games: row.games,
            }))}
          />
        )}
      </main>
    </>
  );
}
