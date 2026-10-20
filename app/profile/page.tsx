import { redirect } from 'next/navigation';
import { SiteHeader } from '../components/site-header';
import { ProfileForm } from './profile-form';
import { AuthUnavailableError, currentIdentity } from '@/lib/api';
import { authConfigured } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { getOwnProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ProfilePage() {
  if (!authConfigured) redirect('/login');
  let identity;
  try {
    identity = await currentIdentity();
  } catch (error) {
    if (!(error instanceof AuthUnavailableError)) throw error;
    return (
      <>
        <SiteHeader />
        <main className="shell"><p className="error">Sign-in service unreachable. Open this page again in a moment.</p></main>
      </>
    );
  }
  if (!identity) redirect('/login');
  const result = await withTransaction((client) => getOwnProfile(client, identity));
  if (result.status !== 200) redirect('/login');
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <ProfileForm profile={result.body} />
      </main>
    </>
  );
}
