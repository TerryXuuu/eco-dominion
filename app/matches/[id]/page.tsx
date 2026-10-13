import { notFound } from 'next/navigation';
import { SiteHeader } from '../../components/site-header';
import { MatchClient } from './match-client';
import { viewMatch, type MatchView } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { email, data } = await pageActor((client, userId) => viewMatch(client, userId, id, Date.now()));
  if (data.status !== 200) notFound();
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell match">
        <MatchClient initial={data.body as MatchView} />
      </main>
    </>
  );
}
