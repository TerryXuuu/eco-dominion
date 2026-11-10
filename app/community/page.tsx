import Link from 'next/link';
import { PUBLIC_READER, participationGate } from '@/lib/access';
import { currentIdentity } from '@/lib/api';
import { feed } from '@/lib/community-service';
import { withClient } from '@/lib/db';
import { pageActor } from '@/lib/page-actor';
import { Compose, Feed } from './community-client';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function CommunitySearch({ q, following, placeholder, label }: { q: string; following?: boolean; placeholder: string; label: string }) {
  return (
    <form className="search" action="/community" method="get">
      {following && <input type="hidden" name="scope" value="following" />}
      <input name="q" defaultValue={q} placeholder={placeholder} aria-label={label} />
      <button type="submit">{label}</button>
    </form>
  );
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ scope?: string; q?: string }> }) {
  const { scope, q = '' } = await searchParams;
  const following = scope === 'following';
  const lang = await getLang();
  const text = copy(lang).community;
  const identity = await currentIdentity();
  if (!identity) {
    const data = await withClient((client) => feed(client, PUBLIC_READER, { q }));
    return (
      <>
        <main className="shell stack">
          <section className="hero compact">
            <h1>{text.title}</h1>
            <p className="lede">{text.guestLede}</p>
          </section>
          <CommunitySearch q={q} placeholder={text.search} label={text.searchLabel} />
          <p className="note">{text.guest}</p>
          {data.status === 200 && <Feed lang={lang} initial={data.body.posts} nextCursor={data.body.nextCursor} scope="all" search={q} readonly />}
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
      <main className="shell stack">
        <section className="hero compact">
          <h1>{text.title}</h1>
          <p className="lede">{text.memberLede}</p>
        </section>
        <CommunitySearch q={q} following={following} placeholder={text.search} label={text.searchLabel} />
        <p className="row">
          <Link href={q ? `/community?q=${encodeURIComponent(q)}` : '/community'}>{text.everyone}</Link>
          <Link href={q ? `/community?scope=following&q=${encodeURIComponent(q)}` : '/community?scope=following'}>{text.following}</Link>
          <Link href="/people">{text.people}</Link>
        </p>
        {suspended && <p className="error" role="status">{text.suspended}</p>}
        {!canPost && !suspended && <p className="note">{text.guestsRead}</p>}
        {canPost && <Compose lang={lang} suspended={suspended} />}
        {feedResult.status === 200 && (
          <Feed lang={lang} initial={feedResult.body.posts} nextCursor={feedResult.body.nextCursor} scope={following ? 'following' : 'all'} search={q} readonly={!canPost} />
        )}
      </main>
    </>
  );
}
