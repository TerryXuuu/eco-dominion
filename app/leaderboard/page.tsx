import { LeaderboardTable } from '../components/record-tables';
import { cachedLeaderboard } from '@/lib/leaderboard-cache';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function LeaderboardPage() {
  const [{ body }, lang] = await Promise.all([cachedLeaderboard(), getLang()]);
  const text = copy(lang).board;
  return (
    <>
      <main className="shell stack">
        <h1>{text.title}</h1>
        <p className="note">{text.note}</p>
        {body.entries.length === 0 && <p className="note">{text.empty}</p>}
        {body.entries.length > 0 && (
          <LeaderboardTable
            lang={lang}
            rows={body.entries.map((row) => ({
              rank: row.rank,
              player: row.displayName ?? text.hidden,
              rating: row.rating,
              games: row.games,
            }))}
          />
        )}
      </main>
    </>
  );
}
