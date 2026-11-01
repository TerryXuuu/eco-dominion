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

function CommunitySearch({ q, following }: { q: string; following?: boolean }) {
  return (
    <form className="search" action="/community" method="get">
      {following && <input type="hidden" name="scope" value="following" />}
      <input name="q" defaultValue={q} placeholder="Search posts, names, or tags" aria-label="Search the community" />
      <button type="submit">Search</button>
    </form>
  );
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ scope?: string; q?: string }> }) {
  const { scope, q = '' } = await searchParams;
  const following = scope === 'following';
  const identity = await currentIdentity();
  if (!identity) {
    const data = await withTransaction((client) => feed(client, PUBLIC_READER, { q }));
    return (
      <>
        <SiteHeader />
        <main className="shell stack">
          <section className="hero compact">
            <h1>Community</h1>
            <p className="lede">Public posts are open to read. Register as a player to publish, like, or comment.</p>
          </section>
          <CommunitySearch q={q} />
          <p className="note">You are browsing as a guest.</p>
          {data.status === 200 && <Feed initial={data.body.posts} nextCursor={data.body.nextCursor} scope="all" search={q} readonly />}
        </main>
      </>
    );
  }
  const { suspended, data } = await pageActor(async (client, userId) => {
    const result = await feed(client, userId, { scope: following ? 'following' : undefined, q });
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
          <p className="lede">Tag a card or a topic, attach up to three images, and choose who can see the post.</p>
        </section>
        <CommunitySearch q={q} following={following} />
        <p className="row">
          <Link href={q ? `/community?q=${encodeURIComponent(q)}` : '/community'}>Everyone</Link>
          <Link href={q ? `/community?scope=following&q=${encodeURIComponent(q)}` : '/community?scope=following'}>Following</Link>
          <Link href="/people">People</Link>
        </p>
        {suspended && <p className="error" role="status">Your account is suspended; you can read but not make changes.</p>}
        {!canPost && !suspended && <p className="note">Guests can read posts. Playing, posting, likes, and comments are for players.</p>}
        {canPost && <Compose suspended={suspended} />}
        {feedResult.status === 200 && (
          <Feed initial={feedResult.body.posts} nextCursor={feedResult.body.nextCursor} scope={following ? 'following' : 'all'} search={q} readonly={!canPost} />
        )}
      </main>
    </>
  );
}
