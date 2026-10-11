import { notFound } from 'next/navigation';
import { SiteHeader } from '../../components/site-header';
import { auth, authConfigured, toIdentity } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { viewProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PlayerPage({ params }: { params: Promise<{ handle: string }> }) {
  if (!authConfigured) notFound();
  const { handle } = await params;
  const { data } = await auth.getSession();
  const viewer = data?.user?.email ? toIdentity(data.user) : null;
  const result = await withTransaction((client) => viewProfile(client, viewer, handle));
  if (result.status !== 200) notFound();
  const profile = result.body;
  return (
    <>
      <SiteHeader email={data?.user?.email} />
      <main className="shell">
        <article className="panel" style={{ margin: '2rem 0 3rem' }}>
          <p className="note">@{profile.handle}</p>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio || 'No biography yet.'}</p>
          {'email' in profile && typeof profile.email === 'string' && <p className="note">{profile.email}</p>}
        </article>
      </main>
    </>
  );
}
