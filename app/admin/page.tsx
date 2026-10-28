import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { adminOverview } from '@/lib/admin-service';
import { pageActor } from '@/lib/page-actor';
import { siteCopy } from '../components/site-footer';
import { AdminConsole } from './admin-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminPage() {
  const { email, data } = await pageActor(async (client, userId) => {
    const overview = await adminOverview(client, userId);
    return overview.status === 200 ? overview.body : null;
  });
  if (!data) {
    return (
      <>
        <SiteHeader email={email} />
        <main className="shell stack">
          <h1>Admin console</h1>
          <p className="note">Signed in as {email}. This account is not an admin, so the console stays closed. Log out, then sign in with an admin account.</p>
          <p><Link href="/moderation">Moderation</Link> is the report queue. It hides or restores reported posts and comments. It does not manage ratings, matches, or role grants.</p>
        </main>
      </>
    );
  }
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell wide stack">
        <h1>Admin console</h1>
        <p className="note">
          Accounts, role grants, casual ratings and match records. Moderators still use the moderation queue for reported posts and comments.
          Admin, player, and guest are the account roles. A guest can read and cannot play or post. You cannot remove your own admin role or suspend yourself.
        </p>
        <AdminConsole initial={data} footer={await siteCopy()} />
      </main>
    </>
  );
}
