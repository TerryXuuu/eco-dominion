import { notFound } from 'next/navigation';
import { PlayerPortrait } from '../../components/player-portrait';
import { HomeBoard } from '../../components/home-board';
import { SiteHeader } from '../../components/site-header';
import { getRelationship } from '@/lib/community-service';
import { friendDashboard } from '@/lib/home-service';
import { pageActor } from '@/lib/page-actor';
import { viewProfile } from '@/lib/profile-service';
import { PlayerActions } from './player-actions';
import { getLang } from '@/lib/lang';
import { say } from '@/lib/locale-text';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PlayerPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { email, suspended, data } = await pageActor(async (client, viewerId, identity) => {
    const profile = await viewProfile(client, identity, handle);
    if (profile.status !== 200) return { profile, relationship: null as Awaited<ReturnType<typeof getRelationship>> | null, board: null };
    const relationship = profile.body.handle.toLowerCase() === handle.toLowerCase() && 'email' in profile.body
      ? null
      : await getRelationship(client, viewerId, handle);
    const board = relationship && relationship.status === 200 && relationship.body.friend === 'friends'
      ? await friendDashboard(client, viewerId, handle)
      : null;
    return { profile, relationship, board };
  });
  if (data.profile.status !== 200) notFound();
  const lang = await getLang();
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
            <p>{profile.bio || say(lang, 'No biography yet.', '还没有简介。')}</p>
          </div>
        </article>
        {relationship && <PlayerActions lang={lang} handle={profile.handle} initial={relationship} suspended={suspended} />}
        {!relationship && <p className="note">{say(lang, 'This is you.', '这是你。')}</p>}
        {data.board && (
          <HomeBoard lang={lang} home={data.board.home} hideRecord={data.board.hideRecord} hideAchievements={data.board.hideAchievements} hideHotspot={data.board.hideHotspot} hideActivity={data.board.hideActivity} />
        )}
      </main>
    </>
  );
}
