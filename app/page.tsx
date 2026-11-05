import Link from 'next/link';
import { SiteHeader } from './components/site-header';
import { LandingStage } from './landing-stage';
import { auth, authConfigured } from '@/lib/auth';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const lang = await getLang();
  const text = copy(lang).landing;
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
