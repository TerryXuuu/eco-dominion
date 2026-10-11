import { redirect } from 'next/navigation';
import { SiteHeader } from '../components/site-header';
import { ProfileForm } from './profile-form';
import { signOut } from './actions';
import { auth, authConfigured, toIdentity } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { getOwnProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ProfilePage() {
  if (!authConfigured) redirect('/login');
  const { data } = await auth.getSession();
  if (!data?.user?.email) redirect('/login');
  const result = await withTransaction((client) => getOwnProfile(client, toIdentity(data.user)));
  if (result.status !== 200) redirect('/login');
  return (
    <>
      <SiteHeader email={data.user.email} />
      <main className="shell">
        <ProfileForm profile={result.body} />
        <form className="shell" action={signOut} style={{ marginBottom: '3rem' }}>
          <button className="secondary" type="submit">Log out</button>
        </form>
      </main>
    </>
  );
}
