import { SiteHeader } from '../components/site-header';
import { APPROVAL, CORRECTED_ENERGY_EXAMPLE, RULINGS, RULESET_ID } from '@/lib/rulings';

export const dynamic = 'force-dynamic';

export default function RulesPage() {
  const legal = CORRECTED_ENERGY_EXAMPLE.legal;
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="hero">
          <p className="note">Approved by {APPROVAL.owners} on {APPROVAL.date} · ranked play disabled</p>
          <h1>Digital rulings</h1>
          <p className="lede">Ruleset {RULESET_ID}. All 26 resolutions are approved for local and casual play. Ranked release waits for balance testing and a separate owner decision.</p>
        </section>
        <section className="panel example">
          <h2>Corrected energy example · R22</h2>
          <p>{CORRECTED_ENERGY_EXAMPLE.illegal}</p>
          <p>
            Legal line: start at energy {legal.start.energy} and reserve {legal.start.reserve}. Deer spends energy only, leaving energy {legal.afterDeer.energy} and reserve {legal.afterDeer.reserve}. Fortify then spends reserve {legal.start.reserve - legal.afterFortify.reserve} and energy {legal.afterDeer.energy - legal.afterFortify.energy}, ending at energy {legal.afterFortify.energy} and reserve {legal.afterFortify.reserve}.
          </p>
        </section>
        <section className="panel" style={{ margin: '1rem 0 3rem' }}>
          <h2>Final turn · R01</h2>
          <p>Domination is checked at every settlement, including the last one. If neither player dominates, the match scores only after both personal-turn counters have reached 8.</p>
          {RULINGS.map((ruling) => (
            <div className="ruling" key={ruling.id}>
              <strong>{ruling.id}</strong>
              <span>{ruling.summary}</span>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
