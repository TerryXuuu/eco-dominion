import { PeopleTable } from '../components/record-tables';
import { relationships } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { getLang } from '@/lib/lang';
import { say } from '@/lib/locale-text';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PeoplePage() {
  const [{ data }, lang] = await Promise.all([pageActor((client, userId) => relationships(client, userId)), getLang()]);
  if (data.status !== 200) return null;
  const lists = data.body;
  const empty = say(lang, 'None.', '没有。');
  const nameLabel = say(lang, 'Name', '名字');
  return (
    <>
      <main className="shell stack">
        <h1>{say(lang, 'People', '玩家')}</h1>
        <PeopleTable title={say(lang, 'Friend requests', '好友请求')} rows={lists.incoming} empty={empty} nameLabel={nameLabel} lang={lang} />
        <PeopleTable title={say(lang, 'Friends', '好友')} rows={lists.friends} empty={empty} nameLabel={nameLabel} lang={lang} />
        <PeopleTable title={say(lang, 'Following', '关注')} rows={lists.following} empty={empty} nameLabel={nameLabel} lang={lang} />
        <PeopleTable title={say(lang, 'Followers', '粉丝')} rows={lists.followers} empty={empty} nameLabel={nameLabel} lang={lang} />
        <PeopleTable title={say(lang, 'Sent requests', '已发送的请求')} rows={lists.outgoing} empty={empty} nameLabel={nameLabel} lang={lang} />
        <PeopleTable title={say(lang, 'Blocked', '已屏蔽')} rows={lists.blocked} empty={empty} nameLabel={nameLabel} lang={lang} />
      </main>
    </>
  );
}
