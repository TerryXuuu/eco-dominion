import { notFound } from 'next/navigation';
import { SiteHeader } from '../../../components/site-header';
import { ReplayClient, type ReplayFrame } from './replay-client';
import { replay } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { email, data } = await pageActor((client, userId) => replay(client, userId, id, '0'));
  if (data.status !== 200) notFound();
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell match">
        <h1>Replay</h1>
        <p className="note">Shown from your seat: you see your own hand at each step, never your opponent&apos;s.</p>
        <ReplayClient initial={data.body as ReplayFrame} />
      </main>
    </>
  );
}
