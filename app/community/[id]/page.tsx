import { notFound } from 'next/navigation';
import { PUBLIC_READER, participationGate } from '@/lib/access';
import { currentIdentity } from '@/lib/api';
import { getPost } from '@/lib/community-service';
import { withClient } from '@/lib/db';
import { pageActor } from '@/lib/page-actor';
import { Thread } from './thread-client';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const heading = lang === 'zh' ? '帖子' : 'Post';
  const identity = await currentIdentity();
  if (!identity) {
    const data = await withClient((client) => getPost(client, PUBLIC_READER, id));
    if (data.status !== 200) notFound();
    return (
      <>
        <main className="shell stack">
          <h1>{heading}</h1>
          <Thread lang={lang} post={data.body.post} comments={data.body.comments} suspended={false} readonly />
        </main>
      </>
    );
  }
  const { suspended, data } = await pageActor(async (client, userId) => {
    const result = await getPost(client, userId, id);
    const gate = await participationGate(client, userId);
    return { result, readonly: !gate.ok };
  });
  if (data.result.status !== 200) notFound();
  const thread = data.result.body;
  return (
    <>
      <main className="shell stack">
        <h1>{heading}</h1>
        <Thread lang={lang} post={thread.post} comments={thread.comments} suspended={suspended} readonly={data.readonly} />
      </main>
    </>
  );
}
