import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { feed } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { Compose, Feed } from './community-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const following = scope === 'following';
  const { email, suspended, data } = await pageActor((client, userId) => feed(client, userId, { scope: following ? 'following' : undefined }));
  return (
    <>
      <SiteHeader email={email} />
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
        <Compose suspended={suspended} />
        {data.status === 200 && <Feed initial={data.body.posts} nextCursor={data.body.nextCursor} scope={following ? 'following' : 'all'} />}
      </main>
    </>
  );
}
