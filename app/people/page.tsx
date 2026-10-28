import { SiteHeader } from '../components/site-header';
import { PeopleTable } from '../components/record-tables';
import { relationships } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PeoplePage() {
  const { data } = await pageActor((client, userId) => relationships(client, userId));
  if (data.status !== 200) return null;
  const lists = data.body;
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <h1>People</h1>
        <PeopleTable title="Friend requests" rows={lists.incoming} />
        <PeopleTable title="Friends" rows={lists.friends} />
        <PeopleTable title="Following" rows={lists.following} />
        <PeopleTable title="Followers" rows={lists.followers} />
        <PeopleTable title="Sent requests" rows={lists.outgoing} />
        <PeopleTable title="Blocked" rows={lists.blocked} />
      </main>
    </>
  );
}
