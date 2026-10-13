import Link from 'next/link';
import { SiteHeader } from './components/site-header';
import { auth, authConfigured } from '@/lib/auth';
import { RULESET_ID } from '@/lib/rulings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let email: string | null = null;
  if (authConfigured) {
    const { data } = await auth.getSession();
    email = data?.user?.email ?? null;
  }
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell">
        <section className="hero">
          <p className="note">Ruleset {RULESET_ID}</p>
          <h1>A small table for a living dominion.</h1>
          <p className="lede">
            Register, keep a protected profile, and prepare for server-authoritative matches. Digital rulings R01–R26 are approved for casual play; ranked play stays off until balance testing.
          </p>
          <div className="row">
            <Link className="button" href={email ? '/profile' : '/register'}>{email ? 'Open profile' : 'Create account'}</Link>
            <Link className="button secondary" href="/rules">Review the energy example</Link>
          </div>
        </section>
        <section className="grid">
          <article className="panel">
            <h2>Separate seats</h2>
            <p>Each account maps to its own profile. Another player cannot read a private profile or edit yours.</p>
          </article>
          <article className="panel">
            <h2>Neon Auth</h2>
            <p>Passwords and sessions stay with Neon Auth. This app stores the profile, role, and game permissions.</p>
          </article>
          <article className="panel draft">
            <h2>Approved rules</h2>
            <p>The owners approved R01–R26 for casual play. Ranked release needs balance testing and a separate decision.</p>
          </article>
        </section>
      </main>
    </>
  );
}
