import { SiteHeader } from '../components/site-header';
import { FriendsBoard } from './friends-client';
import { relationships } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function FriendsPage() {
  const [{ data }, lang] = await Promise.all([
    pageActor((client, userId) => relationships(client, userId)),
    getLang(),
  ]);
  const text = copy(lang).friends;
  const lists = data.status === 200 ? data.body : { friends: [], incoming: [] };
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <h1>{text.title}</h1>
        <FriendsBoard lang={lang} friends={lists.friends} incoming={lists.incoming} />
      </main>
    </>
  );
}
