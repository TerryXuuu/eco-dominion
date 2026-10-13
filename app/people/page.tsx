import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { relationships } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function Group({ title, people }: { title: string; people: { handle: string; displayName: string }[] }) {
  return (
    <section className="panel stack">
      <h2>{title}</h2>
      {people.length === 0 && <p className="note">None.</p>}
      <ul className="list">
        {people.map((person) => (
          <li key={person.handle}><Link href={`/players/${person.handle}`}>{person.displayName}</Link> · @{person.handle}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function PeoplePage() {
  const { email, data } = await pageActor((client, userId) => relationships(client, userId));
  if (data.status !== 200) return null;
  const lists = data.body;
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <h1>People</h1>
        <Group title="Friend requests" people={lists.incoming} />
        <Group title="Friends" people={lists.friends} />
        <Group title="Following" people={lists.following} />
        <Group title="Followers" people={lists.followers} />
        <Group title="Sent requests" people={lists.outgoing} />
        <Group title="Blocked" people={lists.blocked} />
      </main>
    </>
  );
}
