import { notFound } from 'next/navigation';
import { SiteHeader } from '../../../components/site-header';
import { ReplayClient, type ReplayFrame } from './replay-client';
import { replay } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';
import { getLang } from '@/lib/lang';
import { say } from '@/lib/locale-text';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ email, data }, lang] = await Promise.all([pageActor((client, userId) => replay(client, userId, id, '0')), getLang()]);
  if (data.status !== 200) notFound();
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell match">
        <h1>{say(lang, 'Replay', '回放')}</h1>
        <p className="note">{say(lang, 'Shown from your seat: you see your own hand at each step, never your opponent\'s.', '从你的座位观看：每一步只显示你自己的手牌，不会显示对手的。')}</p>
        <ReplayClient initial={data.body as ReplayFrame} />
      </main>
    </>
  );
}
