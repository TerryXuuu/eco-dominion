import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { PUBLIC_READER, participationGate } from '@/lib/access';
import { currentIdentity } from '@/lib/api';
import { feed } from '@/lib/community-service';
import { withTransaction } from '@/lib/db';
import { pageActor } from '@/lib/page-actor';
import { Compose, Feed } from './community-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const following = scope === 'following';
  const identity = await currentIdentity();
  if (!identity) {
    const data = await withTransaction((client) => feed(client, PUBLIC_READER, {}));
    return (
      <>
        <SiteHeader />
        <main className="shell stack">
          <section className="hero compact">
            <h1>Community</h1>
            <p className="lede">Public posts are open to read. Register as a player to publish, like, or comment.</p>
          </section>
          <p className="note">You are browsing as a guest.</p>
          {data.status === 200 && <Feed initial={data.body.posts} nextCursor={data.body.nextCursor} scope="all" readonly />}
        </main>
      </>
    );
  }
  const { suspended, data } = await pageActor(async (client, userId) => {
    const result = await feed(client, userId, { scope: following ? 'following' : undefined });
    const gate = await participationGate(client, userId);
    return { result, canPost: gate.ok };
  });
  const feedResult = data.result;
  const canPost = data.canPost && !suspended;
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <section className="hero compact">
          <h1>Community</h1>
          <p className="lede">Plain-text posts. Who can see a post is chosen when you publish it.</p>
        </section>
        <p className="row">
          <Link href="/community">Everyone</Link>
          <Link href="/community?scope=following">Following</Link>
          <Link href="/people">People</Link>
        </p>
        {suspended && <p className="error" role="status">Your account is suspended; you can read but not make changes.</p>}
        {!canPost && !suspended && <p className="note">Guests can read posts. Playing, posting, likes, and comments are for players.</p>}
        {canPost && <Compose suspended={suspended} />}
        {feedResult.status === 200 && (
          <Feed initial={feedResult.body.posts} nextCursor={feedResult.body.nextCursor} scope={following ? 'following' : 'all'} readonly={!canPost} />
        )}
      </main>
    </>
  );
}
