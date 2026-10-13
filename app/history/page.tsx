import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { history } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REASON: Record<string, string> = { score: 'final score', domination: 'domination', concession: 'concession', timeout: 'timeouts' };

export default async function HistoryPage() {
  const { email, data } = await pageActor((client, userId) => history(client, userId));
  const matches = (data.body as Awaited<ReturnType<typeof history>>['body']).matches;
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <h1>Match history</h1>
        {matches.length === 0 && <p className="note">No finished matches yet. <Link href="/play">Play one</Link>.</p>}
        <ol className="list">
          {matches.map((match) => (
            <li key={match.id} className="panel list-row">
              <strong className={`outcome ${match.outcome}`}>{match.outcome === 'win' ? 'Win' : match.outcome === 'loss' ? 'Loss' : 'Draw'}</strong>
              <span>vs {match.opponent}</span>
              <span>{match.mode === 'casual' ? 'Casual' : 'Private room'} · {REASON[match.reason] ?? match.reason}{match.scores && ` ${match.scores[match.seat]}–${match.scores[1 - match.seat]}`}</span>
              <span>{match.rating ? `Rating ${match.rating.before} → ${match.rating.after}` : 'Unrated'}</span>
              <time dateTime={match.finishedAt}>{new Date(match.finishedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC</time>
              <Link href={`/matches/${match.id}/replay`}>Replay</Link>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
