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
          <p className="note">{say(lang, `Approved by ${APPROVAL.owners} on ${APPROVAL.date} · ranked play disabled`, `由 ${APPROVAL.owners} 于 ${APPROVAL.date} 批准 · 排位关闭`)}</p>
          <h1>{say(lang, 'Digital rulings', '数字裁定')}</h1>
          <p className="lede">{say(lang, `Ruleset ${RULESET_ID}. All 26 resolutions are approved for local and casual play. Ranked release waits for balance testing and a separate owner decision.`, `规则集 ${RULESET_ID}。26 条裁定已批准用于本地与休闲对局。排位发布仍等待平衡测试，以及另一次所有者决定。`)}</p>
        </section>
        <section className="panel example">
          <h2>{zh ? ZH_ENERGY.heading : 'Corrected energy example · R22'}</h2>
          <p>{zh ? ZH_ENERGY.illegal : CORRECTED_ENERGY_EXAMPLE.illegal}</p>
          <p>
            {zh
              ? `合法路线：从能量 ${legal.start.energy}、储备 ${legal.start.reserve} 开始。雄鹿只消耗能量，留下能量 ${legal.afterDeer.energy}、储备 ${legal.afterDeer.reserve}。领域稳固再消耗储备 ${legal.start.reserve - legal.afterFortify.reserve} 与能量 ${legal.afterDeer.energy - legal.afterFortify.energy}，结束时能量 ${legal.afterFortify.energy}、储备 ${legal.afterFortify.reserve}。`
              : `Legal line: start at energy ${legal.start.energy} and reserve ${legal.start.reserve}. Deer spends energy only, leaving energy ${legal.afterDeer.energy} and reserve ${legal.afterDeer.reserve}. Fortify then spends reserve ${legal.start.reserve - legal.afterFortify.reserve} and energy ${legal.afterDeer.energy - legal.afterFortify.energy}, ending at energy ${legal.afterFortify.energy} and reserve ${legal.afterFortify.reserve}.`}
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
