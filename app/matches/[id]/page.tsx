import { notFound } from 'next/navigation';
import { MatchClient } from './match-client';
import { viewMatch, type MatchView } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await pageActor((client, userId) => viewMatch(client, userId, id, Date.now()));
  if (data.status !== 200) notFound();
  return (
    <main className="table-screen">
      <MatchClient key={id} initial={data.body as MatchView} />
    </main>
  );
}
