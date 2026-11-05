import { SiteHeader } from '../components/site-header';
import { LeaderboardTable } from '../components/record-tables';
import { withTransaction } from '@/lib/db';
import { leaderboard } from '@/lib/match-service';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function LeaderboardPage() {
  const [{ body }, lang] = await Promise.all([withTransaction((client) => leaderboard(client)), getLang()]);
  const text = copy(lang).board;
  return (
    <>
      <SiteHeader />
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
