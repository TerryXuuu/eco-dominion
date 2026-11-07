import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { HistoryTable } from '../components/record-tables';
import { history } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function HistoryPage() {
  const [{ data }, lang] = await Promise.all([pageActor((client, userId) => history(client, userId)), getLang()]);
  const text = copy(lang).history;
  const reason: Record<string, string> = { score: text.scoreReason, domination: text.domination, regions: text.regions, concession: text.surrender, timeout: text.timeouts };
  const matches = (data.body as Awaited<ReturnType<typeof history>>['body']).matches.map((match) => ({
    ...match,
    opponent: match.opponentName,
    when: new Date(match.finishedAt).toISOString().slice(0, 16).replace('T', ' '),
    result: match.outcome === 'win' ? text.win : match.outcome === 'loss' ? text.loss : text.draw,
    detail: `${match.opponent === 'robot' || match.opponent === 'grove' ? text.practice : match.mode === 'ranked' ? text.ranked : match.mode === 'casual' ? text.casual : text.private} · ${reason[match.reason] ?? match.reason}`,
    score: match.scores ? `${match.scores[match.seat]}–${match.scores[1 - match.seat]}` : '—',
    ratingLabel: match.ladder ? `${match.ladder.after - match.ladder.before > 0 ? '+' : ''}${match.ladder.after - match.ladder.before}` : text.unrated,
  }));
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <h1>{text.title}</h1>
        {matches.length === 0 && <p className="note">{text.empty} <Link href="/play">{text.play}</Link>.</p>}
        {matches.length > 0 && <HistoryTable lang={lang} rows={matches} />}
      </main>
    </>
  );
}
