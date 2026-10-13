import { SiteHeader } from '../components/site-header';
import { currentIdentity } from '@/lib/api';
import { withTransaction } from '@/lib/db';
import { leaderboard } from '@/lib/match-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function LeaderboardPage() {
  const identity = await currentIdentity().catch(() => null);
  const { body } = await withTransaction((client) => leaderboard(client));
  return (
    <>
      <SiteHeader email={identity?.email} />
      <main className="shell stack">
        <h1>Casual rating</h1>
        <p className="note">Elo from casual-queue matches only (K=32, everyone starts at 1000). Private rooms are unrated, and ranked play is not enabled. Players with non-public profiles are listed without their name.</p>
        {body.entries.length === 0 && <p className="note">No rated matches yet.</p>}
        <table className="table">
          <thead><tr><th>#</th><th>Player</th><th>Rating</th><th>Games</th></tr></thead>
          <tbody>
            {body.entries.map((entry) => (
              <tr key={entry.rank}>
                <td>{entry.rank}</td>
                <td>{entry.displayName ? `${entry.displayName} (@${entry.handle})` : 'Hidden player'}</td>
                <td>{entry.rating}</td>
                <td>{entry.games}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
