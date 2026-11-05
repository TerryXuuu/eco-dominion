import { SiteHeader } from '../components/site-header';
import { APPROVAL, CORRECTED_ENERGY_EXAMPLE, RULINGS, RULESET_ID } from '@/lib/rulings';
import { getLang } from '@/lib/lang';
import { say, shownRuling } from '@/lib/locale-text';
import { ZH_ENERGY } from '@/lib/zh-rulings';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const legal = CORRECTED_ENERGY_EXAMPLE.legal;
  const lang = await getLang();
  const zh = lang === 'zh';
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="hero">
          <p className="note">{say(lang, `Approved by ${APPROVAL.owners} on ${APPROVAL.date}`, `由 ${APPROVAL.owners} 于 ${APPROVAL.date} 批准`)}</p>
          <h1>{say(lang, 'Digital rulings', '规则')}</h1>
          <p className="lede">{say(lang, `Ruleset ${RULESET_ID}. Ladder matches use the former casual rating. Casual matches, practice and private rooms are unrated.`, `规则集 ${RULESET_ID}。天梯对局使用原来的休闲积分。休闲、练习和私人房间不计分。`)}</p>
        </section>
        <section className="panel example">
          <h2>{zh ? ZH_ENERGY.heading : 'Corrected energy example · R22'}</h2>
          <p>{zh ? ZH_ENERGY.illegal : CORRECTED_ENERGY_EXAMPLE.illegal}</p>
          <p>
            {zh
              ? `合法路线：从能量 ${legal.start.energy}、储备能量 ${legal.start.reserve} 开始。雄鹿只消耗能量，留下能量 ${legal.afterDeer.energy}、储备能量 ${legal.afterDeer.reserve}。领域稳固再消耗储备能量 ${legal.start.reserve - legal.afterFortify.reserve} 与能量 ${legal.afterDeer.energy - legal.afterFortify.energy}，结束时能量 ${legal.afterFortify.energy}、储备能量 ${legal.afterFortify.reserve}。`
              : `Legal line: start at energy ${legal.start.energy} and reserve energy ${legal.start.reserve}. Deer spends energy only, leaving energy ${legal.afterDeer.energy} and reserve energy ${legal.afterDeer.reserve}. Fortify then spends reserve energy ${legal.start.reserve - legal.afterFortify.reserve} and energy ${legal.afterDeer.energy - legal.afterFortify.energy}, ending at energy ${legal.afterFortify.energy} and reserve energy ${legal.afterFortify.reserve}.`}
          </p>
        </section>
        <section className="panel" style={{ margin: '1rem 0 3rem' }}>
          <h2>{zh ? ZH_ENERGY.finalHeading : 'Final turn · R01'}</h2>
          <p>{zh ? ZH_ENERGY.final : 'Domination is checked at every settlement, including the last one. If neither player dominates, the match scores only after both personal-turn counters have reached 8.'}</p>
          {RULINGS.map((ruling) => (
            <div className="ruling" key={ruling.id}>
              <strong>{ruling.id}</strong>
              <span>{shownRuling(lang, ruling.id, ruling.summary)}</span>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
