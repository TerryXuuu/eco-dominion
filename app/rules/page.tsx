import { SiteHeader } from '../components/site-header';
import { APPROVAL, CORRECTED_ENERGY_EXAMPLE, RULINGS, RULESET_ID } from '@/lib/rulings';
import { playGuide } from '@/lib/play-guide';
import { getLang } from '@/lib/lang';
import { say, shownRuling } from '@/lib/locale-text';
import { ZH_ENERGY } from '@/lib/zh-rulings';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const legal = CORRECTED_ENERGY_EXAMPLE.legal;
  const lang = await getLang();
  const zh = lang === 'zh';
  const guide = playGuide(lang);
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="hero">
          <h1>{say(lang, 'How to play', '规则')}</h1>
          <p className="lede">{say(lang, 'The short version of a match. Numbered notes below are edge-case rulings.', '一局里需要知道的事。下面的编号是边界情况的裁定。')}</p>
        </section>
        {guide.map((section) => (
          <section className="panel guide" key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {section.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        ))}
        <section className="panel" style={{ margin: '1rem 0 3rem' }}>
          <h2>{say(lang, 'Rulings', '裁定')}</h2>
          <p className="note">{say(lang, `Ruleset ${RULESET_ID}, approved by ${APPROVAL.owners} on ${APPROVAL.date}. These notes settle edge cases. They are not the lesson above.`, `规则集 ${RULESET_ID}，由 ${APPROVAL.owners} 于 ${APPROVAL.date} 批准。这些说明用来判定边界情况，不是上面的入门说明。`)}</p>
          <h3>{zh ? ZH_ENERGY.heading : 'Corrected energy example · R22'}</h3>
          <p>{zh ? ZH_ENERGY.illegal : CORRECTED_ENERGY_EXAMPLE.illegal}</p>
          <p>
            {zh
              ? `合法路线：从能量 ${legal.start.energy}、储备能量 ${legal.start.reserve} 开始。雄鹿只消耗能量，留下能量 ${legal.afterDeer.energy}、储备能量 ${legal.afterDeer.reserve}。领域稳固再消耗储备能量 ${legal.start.reserve - legal.afterFortify.reserve} 与能量 ${legal.afterDeer.energy - legal.afterFortify.energy}，结束时能量 ${legal.afterFortify.energy}、储备能量 ${legal.afterFortify.reserve}。`
              : `Legal line: start at energy ${legal.start.energy} and reserve energy ${legal.start.reserve}. Deer spends energy only, leaving energy ${legal.afterDeer.energy} and reserve energy ${legal.afterDeer.reserve}. Fortify then spends reserve energy ${legal.start.reserve - legal.afterFortify.reserve} and energy ${legal.afterDeer.energy - legal.afterFortify.energy}, ending at energy ${legal.afterFortify.energy} and reserve energy ${legal.afterFortify.reserve}.`}
          </p>
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
