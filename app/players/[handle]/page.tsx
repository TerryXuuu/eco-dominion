import { notFound } from 'next/navigation';
import { PlayerPortrait } from '../../components/player-portrait';
import { SiteHeader } from '../../components/site-header';
import { getRelationship } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { viewProfile } from '@/lib/profile-service';
import { PlayerActions } from './player-actions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PlayerPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { email, suspended, data } = await pageActor(async (client, viewerId, identity) => {
    const profile = await viewProfile(client, identity, handle);
    if (profile.status !== 200) return { profile, relationship: null as Awaited<ReturnType<typeof getRelationship>> | null };
    const relationship = profile.body.handle.toLowerCase() === handle.toLowerCase() && 'email' in profile.body
      ? null
      : await getRelationship(client, viewerId, handle);
    return { profile, relationship };
  });
  if (data.profile.status !== 200) notFound();
  const profile = data.profile.body;
  const relationship = data.relationship && data.relationship.status === 200 ? data.relationship.body : null;
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <article className="panel home-head">
          <PlayerPortrait handle={profile.handle} name={profile.displayName} large />
          <div>
            <h1>{profile.displayName}</h1>
            <p className="note">@{profile.handle}</p>
            <p>{profile.bio || 'No biography yet.'}</p>
          </div>
        </article>
        {relationship && <PlayerActions handle={profile.handle} initial={relationship} suspended={suspended} />}
        {!relationship && <p className="note">This is you.</p>}
      </main>
    </>
  );
}
