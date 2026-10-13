import { SiteHeader } from '../components/site-header';
import { PlayLobby } from './play-lobby';
import { activeMatchFor } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PlayPage() {
  const { email, data: activeMatchId } = await pageActor((client, userId) => activeMatchFor(client, userId));
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <section className="hero compact">
          <h1>Play</h1>
          <p className="lede">Casual matches are rated with a separate casual rating. Private rooms are unrated. Ranked play stays off until balance testing.</p>
        </section>
        <PlayLobby activeMatchId={activeMatchId} />
      </main>
    </>
  );
}
