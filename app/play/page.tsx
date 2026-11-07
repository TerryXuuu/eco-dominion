import { SiteHeader } from '../components/site-header';
import { PlayLobby } from './play-lobby';
import { activeMatchFor } from '@/lib/match-service';
import { pageActor } from '@/lib/page-actor';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PlayPage() {
  const [{ email, data: activeMatchId }, lang] = await Promise.all([
    pageActor((client, userId) => activeMatchFor(client, userId)),
    getLang(),
  ]);
  const text = copy(lang).play;
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <section className="hero compact">
          <h1>{text.title}</h1>
        </section>
        <PlayLobby lang={lang} activeMatchId={activeMatchId} />
      </main>
    </>
  );
}
