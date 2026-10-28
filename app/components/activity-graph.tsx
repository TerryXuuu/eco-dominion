import { contributionGrid } from '@/lib/standing';

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ActivityGraph({ matches }: { matches: { finishedAt: string }[] }) {
  const weeks = contributionGrid(matches);
  const total = weeks.reduce((sum, week) => sum + week.days.reduce((inner, day) => inner + (day?.count ?? 0), 0), 0);
  return (
    <div className="activity">
      <p className="note">{total} finished {total === 1 ? 'match' : 'matches'} in the past year.</p>
      <div className="activity-layout">
        <div className="activity-days" aria-hidden="true">
          {DAYS.map((label, index) => <span key={index}>{label}</span>)}
        </div>
        <div>
          <div className="activity-months" aria-hidden="true">
            {weeks.map((week, index) => <span key={index}>{week.label}</span>)}
          </div>
          <div className="activity-grid" role="img" aria-label={`${total} finished matches in the past year`}>
            {weeks.map((week, index) => (
              <div className="activity-col" key={index}>
                {week.days.map((day, dayIndex) => (
                  day
                    ? <i key={day.date} className="activity-cell" data-level={day.level} title={`${day.date}: ${day.count} ${day.count === 1 ? 'match' : 'matches'}`} />
                    : <i key={`${index}-${dayIndex}`} className="activity-cell future" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="activity-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => <i key={level} className="activity-cell" data-level={level} />)}
        <span>More</span>
      </p>
    </div>
  );
}
