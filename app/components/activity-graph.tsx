import { contributionGrid } from '@/lib/standing';
import { copy, type Lang } from '@/lib/i18n';

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const DAYS_ZH = ['', '一', '', '三', '', '五', ''];
const MONTHS_ZH: Record<string, string> = {
  Jan: '1月', Feb: '2月', Mar: '3月', Apr: '4月', May: '5月', Jun: '6月',
  Jul: '7月', Aug: '8月', Sep: '9月', Oct: '10月', Nov: '11月', Dec: '12月',
};

export function ActivityGraph({ matches, lang = 'en' }: { matches: { finishedAt: string }[]; lang?: Lang }) {
  const text = copy(lang).home;
  const weeks = contributionGrid(matches);
  const total = weeks.reduce((sum, week) => sum + week.days.reduce((inner, day) => inner + (day?.count ?? 0), 0), 0);
  const summary = lang === 'zh' ? `过去一年完成 ${total} 场` : `${total} finished ${total === 1 ? 'match' : 'matches'} in the past year.`;
  return (
    <div className="activity">
      <p className="note">{summary}</p>
      <div className="activity-layout">
        <div className="activity-days" aria-hidden="true">
          {(lang === 'zh' ? DAYS_ZH : DAYS).map((label, index) => <span key={index}>{label}</span>)}
        </div>
        <div>
          <div className="activity-months" aria-hidden="true">
            {weeks.map((week, index) => <span key={index}>{lang === 'zh' ? (MONTHS_ZH[week.label] ?? week.label) : week.label}</span>)}
          </div>
          <div className="activity-grid" role="img" aria-label={summary}>
            {weeks.map((week, index) => (
              <div className="activity-col" key={index}>
                {week.days.map((day, dayIndex) => (
                  day
                    ? <i key={day.date} className="activity-cell" data-level={day.level} title={lang === 'zh' ? `${day.date}：${day.count} 场` : `${day.date}: ${day.count} ${day.count === 1 ? 'match' : 'matches'}`} />
                    : <i key={`${index}-${dayIndex}`} className="activity-cell future" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="activity-legend">
        <span>{text.less}</span>
        {[0, 1, 2, 3, 4].map((level) => <i key={level} className="activity-cell" data-level={level} />)}
        <span>{text.more}</span>
      </p>
    </div>
  );
}
