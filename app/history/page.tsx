import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { HistoryTable } from '../components/record-tables';
import { history } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REASON: Record<string, string> = { score: 'final score', domination: 'domination', concession: 'surrender', timeout: 'timeouts' };

export default async function HistoryPage() {
  const { data } = await pageActor((client, userId) => history(client, userId));
  const matches = (data.body as Awaited<ReturnType<typeof history>>['body']).matches.map((match) => ({
    ...match,
    opponent: match.opponentName,
    when: new Date(match.finishedAt).toISOString().slice(0, 16).replace('T', ' '),
    result: match.outcome === 'win' ? 'Win' : match.outcome === 'loss' ? 'Loss' : 'Draw',
    detail: `${match.mode === 'casual' ? 'Casual' : 'Private'} · ${REASON[match.reason] ?? match.reason}`,
    score: match.scores ? `${match.scores[match.seat]}–${match.scores[1 - match.seat]}` : '—',
    ratingLabel: match.rating ? `${match.rating.before} → ${match.rating.after}` : 'Unrated',
  }));
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <h1>Match history</h1>
        {matches.length === 0 && <p className="note">No finished matches yet. <Link href="/play">Play one</Link>.</p>}
        {matches.length > 0 && <HistoryTable rows={matches} />}
      </main>
    </>
  );
}
