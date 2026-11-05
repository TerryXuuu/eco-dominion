import Link from 'next/link';
import type { Projection, Seat } from '@/src/engine.mjs';
import { matchReport, type ReportPlayer, type ReportSide } from '@/lib/match-report';
import { say } from '@/lib/locale-text';
import { useArt } from '../../components/art-context';

export function MatchReport({
  game,
  seat,
  players,
  timeouts,
  rating,
  matchId,
  onClose,
}: {
  game: Projection;
  seat: Seat;
  players: ReportPlayer[];
  timeouts: [number, number];
  rating: { before: number; after: number } | null;
  matchId: string;
  onClose?: () => void;
}) {
  const lang = useArt().lang;
  const report = matchReport(game, seat, players, timeouts);
  if (!report) return null;
  const headline = report.outcome === 'win' ? say(lang, 'Congratulations', '恭喜') : report.outcome === 'loss' ? say(lang, 'Defeat', '落败') : say(lang, 'Draw', '平局');
  const message = {
    score: { win: say(lang, 'You won on the final score.', '你以终局得分获胜。'), loss: say(lang, 'You lost on the final score.', '你以终局得分落败。'), draw: say(lang, 'The final score was level.', '终局得分持平。') },
    domination: { win: say(lang, 'You won by domination.', '你以支配获胜。'), loss: say(lang, 'Your opponent won by domination.', '对手以支配获胜。'), draw: say(lang, 'The match ended level.', '对局以平局结束。') },
    concession: { win: say(lang, 'Your opponent surrendered.', '对手认输。'), loss: say(lang, 'You surrendered this match.', '你认输了。'), draw: say(lang, 'The match ended level.', '对局以平局结束。') },
    timeout: { win: say(lang, 'You won because your opponent timed out.', '对手超时，你获胜。'), loss: say(lang, 'You lost on timeouts.', '你因超时落败。'), draw: say(lang, 'The match ended level.', '对局以平局结束。') },
  }[game.result?.reason ?? '']?.[report.outcome] ?? report.message;
  const rows = [
    [say(lang, 'Final score', '终局得分'), (side: ReportSide) => side.score ?? '—'],
    [say(lang, 'Turns completed', '完成回合'), (side: ReportSide) => `${side.turns}/8`],
    [say(lang, 'Regions controlled', '控制区域'), (side: ReportSide) => side.regions],
    [say(lang, 'Those regions', '区域'), (side: ReportSide) => side.regionNames.replaceAll('Forest', say(lang, 'Forest', '森林')).replaceAll('Water', say(lang, 'Water', '水域')).replaceAll('Wild', say(lang, 'Wild', '旷野')).replaceAll('Highland', say(lang, 'Highland', '高地'))],
    [say(lang, 'Total power', '总力量'), (side: ReportSide) => side.power],
    [say(lang, 'Species on the board', '场上物种'), (side: ReportSide) => side.species],
    [say(lang, 'Reserve energy', '储备能量'), (side: ReportSide) => side.reserve],
    [say(lang, 'Energy', '能量'), (side: ReportSide) => side.energy],
    [say(lang, 'Cards left in hand', '剩余手牌'), (side: ReportSide) => side.hand],
    [say(lang, 'Stability penalty', '稳定惩罚'), (side: ReportSide) => side.penalty],
    [say(lang, 'Timeouts', '超时'), (side: ReportSide) => side.timeouts],
  ] as const;
  return (
    <section className={`panel stack report ${report.outcome}`} aria-label={say(lang, 'Match result', '对局结果')}>
      <div className="report-head">
        <div>
          <h2 className="report-headline">{headline}</h2>
          <p className="lede">{message}</p>
          {rating && <p className="note">{say(lang, 'Casual rating', '休闲积分')} {rating.before} → {rating.after}</p>}
        </div>
        {onClose && <button type="button" className="secondary report-close" onClick={onClose}>{say(lang, 'Close', '关闭')}</button>}
      </div>
      <div className="report-stats">
        <table className="table">
          <caption>{say(lang, 'Comparison report', '对比')}</caption>
          <thead>
            <tr>
              <th scope="col">{say(lang, 'Statistic', '项目')}</th>
              <th scope="col">{report.you.name === 'You' ? say(lang, 'You', '你') : report.you.name}</th>
              <th scope="col">{report.opponent.name === 'Opponent' ? say(lang, 'Opponent', '对手') : report.opponent.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value(report.you)}</td>
                <td>{value(report.opponent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row report-actions">
        <Link className="button" href={`/matches/${matchId}/replay`}>{say(lang, 'Watch replay', '观看回放')}</Link>
        <Link className="button secondary" href="/history">{say(lang, 'History', '战绩')}</Link>
        <Link className="button secondary" href="/play">{say(lang, 'Play again', '再来一局')}</Link>
      </div>
    </section>
  );
}
