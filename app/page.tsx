import Link from 'next/link';
import { SiteHeader } from './components/site-header';
import { LandingStage } from './landing-stage';
import { CATALOG, KIND_LABEL, titleOf } from '@/lib/cards';
import { auth, authConfigured } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let email: string | null = null;
  if (authConfigured) {
    const { data } = await auth.getSession();
    email = data?.user?.email ?? null;
  }
  return (
    <>
      <LandingStage>
        <SiteHeader email={email} />
        <section className="landing-copy">
          <p className="eyebrow">Four realms · eight turns</p>
          <h1>Hold the living dominion.</h1>
          <p className="lede">Forest, water, wild, and domain. The land answers the one who keeps it.</p>
          <div className="row">
            <Link className="button" href={email ? '/play' : '/register'}>{email ? 'Enter the table' : 'Create account'}</Link>
            <Link className="button secondary" href="/rules">Read the rulings</Link>
          </div>
        </section>
      </LandingStage>
      <main className="shell deck">
        <h2>The living deck</h2>
        <p className="note">Every species, tactic, interference, and event has its own portrait.</p>
        <div className="portraits">
          {CATALOG.map((card) => (
            <article className="portrait" key={card.id}>
              <img src={`/cards/${card.id}.jpg`} alt={card.name} />
              <strong>{titleOf(card.id)}</strong>
              <span lang="zh">{card.name}</span>
              <span className="note">{KIND_LABEL[card.kind]}</span>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
