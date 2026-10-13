import { notFound } from 'next/navigation';
import { SiteHeader } from '../../components/site-header';
import { getPost } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { Thread } from './thread-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { email, suspended, data } = await pageActor((client, userId) => getPost(client, userId, id));
  if (data.status !== 200) notFound();
  const thread = data.body;
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <h1>Post</h1>
        <Thread post={thread.post} comments={thread.comments} suspended={suspended} />
      </main>
    </>
  );
}
