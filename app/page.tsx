import Link from 'next/link';
import { SiteHeader } from './components/site-header';
import { LandingStage } from './landing-stage';
import { AuthUnavailableError, currentIdentity } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [lang, email] = await Promise.all([
    getLang(),
    currentIdentity()
      .then((identity) => identity?.email ?? null)
      .catch((error: unknown) => {
        if (!(error instanceof AuthUnavailableError)) throw error;
        return null;
      }),
  ]);
  const text = copy(lang).landing;
  return (
    <>
      <LandingStage>
        <SiteHeader email={email} />
        <section className="landing-copy">
          <h1>{text.title}</h1>
          <div className="row">
            <Link className="button" href={email ? '/play' : '/register'}>{email ? text.enter : text.create}</Link>
            <Link className="button secondary" href="/rules">{text.rulings}</Link>
          </div>
        </section>
      </LandingStage>
    </>
  );
}
