import { notFound } from 'next/navigation';
import { SiteHeader } from '../../components/site-header';
import { PUBLIC_READER, participationGate } from '@/lib/access';
import { currentIdentity } from '@/lib/api';
import { getPost } from '@/lib/community-service';
import { withTransaction } from '@/lib/db';
import { pageActor } from '@/lib/page-actor';
import { Thread } from './thread-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await currentIdentity();
  if (!identity) {
    const data = await withTransaction((client) => getPost(client, PUBLIC_READER, id));
    if (data.status !== 200) notFound();
    return (
      <>
        <SiteHeader />
        <main className="shell stack">
          <h1>Post</h1>
          <Thread post={data.body.post} comments={data.body.comments} suspended={false} readonly />
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
      <SiteHeader />
      <main className="shell stack">
        <h1>Post</h1>
        <Thread post={thread.post} comments={thread.comments} suspended={suspended} readonly={data.readonly} />
      </main>
    </>
  );
}
