import Link from 'next/link';
import type { Projection, Seat } from '@/src/engine.mjs';
import { matchReport, type ReportPlayer, type ReportSide } from '@/lib/match-report';

const ROWS: { label: string; value: (side: ReportSide) => string | number }[] = [
  { label: 'Final score', value: (side) => side.score ?? '—' },
  { label: 'Turns completed', value: (side) => `${side.turns}/8` },
  { label: 'Regions controlled', value: (side) => side.regions },
  { label: 'Those regions', value: (side) => side.regionNames },
  { label: 'Total power', value: (side) => side.power },
  { label: 'Species on the board', value: (side) => side.species },
  { label: 'Reserve', value: (side) => side.reserve },
  { label: 'Energy', value: (side) => side.energy },
  { label: 'Cards left in hand', value: (side) => side.hand },
  { label: 'Stability penalty', value: (side) => side.penalty },
  { label: 'Timeouts', value: (side) => side.timeouts },
];

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
  const report = matchReport(game, seat, players, timeouts);
  if (!report) return null;
  return (
    <section className={`panel stack report ${report.outcome}`} aria-label="Match result">
      <div className="report-head">
        <div>
          <h2 className="report-headline">{report.headline}</h2>
          <p className="lede">{report.message}</p>
          {rating && <p className="note">Casual rating {rating.before} → {rating.after}</p>}
        </div>
        {onClose && <button type="button" className="secondary report-close" onClick={onClose}>Close</button>}
      </div>
      <div className="report-stats">
        <table className="table">
          <caption>Comparison report</caption>
          <thead>
            <tr>
              <th scope="col">Statistic</th>
              <th scope="col">{report.you.name}</th>
              <th scope="col">{report.opponent.name}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value(report.you)}</td>
                <td>{row.value(report.opponent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row report-actions">
        <Link className="button" href={`/matches/${matchId}/replay`}>Watch replay</Link>
        <Link className="button secondary" href="/history">History</Link>
        <Link className="button secondary" href="/play">Play again</Link>
      </div>
    </section>
  );
}
