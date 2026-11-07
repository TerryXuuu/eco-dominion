import Link from 'next/link';
import { ActivityGraph } from './activity-graph';
import { AchievementMark, ExperienceBar } from './rank-mark';
import { levelProgress, progressOf } from '@/lib/standing';
import { OpponentTable, RecentTable } from './record-tables';
import type { HomeDashboard } from '@/lib/home-service';
import { achievementCopy, copy, progressCopy, type Lang } from '@/lib/i18n';

export function HomeBoard({
  lang,
  home,
  hideRecord = false,
  hideAchievements = false,
  hideHotspot = false,
  hideActivity = false,
}: {
  lang: Lang;
  home: HomeDashboard;
  hideRecord?: boolean;
  hideAchievements?: boolean;
  hideHotspot?: boolean;
  hideActivity?: boolean;
}) {
  const text = copy(lang);
  const notes = copy(lang).friends;
  const standing = progressOf(home.ladderPeak);
  const level = levelProgress(home.xp);
  const peak = Math.max(1, ...home.weeks.map((week) => week.games));
  const achievements = [...home.achievements].sort((a, b) => Number(b.owned) - Number(a.owned));
  return (
    <>
      {hideRecord && <p className="note">{notes.hiddenRecord}</p>}
      <section className="panel xp-panel">
        <div className="xp-head">
          <h2>{text.home.level} {level.level}</h2>
          <ExperienceBar xp={home.xp} />
          {home.lastGain > 0 && <span className="xp-gain">{text.home.lastGain} +{home.lastGain}</span>}
        </div>
      </section>
      <section className="stat-grid">
        <article className="panel"><h2>{text.home.rating}</h2><p className="stat">{home.ladderScore}</p><p className="note">{text.rank[standing.name]}</p></article>
        <article className="panel"><h2>{text.home.ranking}</h2><p className="stat">{home.rank ? `#${home.rank}` : '—'}</p><p className="note">{home.rank ? text.home.onBoard : text.home.unranked}</p></article>
        {!hideRecord && <article className="panel"><h2>{text.home.record}</h2><p className="stat">{home.record.wins}–{home.record.losses}–{home.record.draws}</p><p className="note">{text.home.wld}</p></article>}
        {!hideRecord && <article className="panel"><h2>{text.home.streak}</h2><p className="stat">{home.winStreak}</p><p className="note">{text.home.bestStreak} {home.bestWinStreak}</p></article>}
        <article className="panel"><h2>{text.home.days}</h2><p className="stat">{home.dayStreak}</p><p className="note">{text.home.bestStreak} {home.bestDayStreak} {text.home.bestDays}</p></article>
        {!hideRecord && <article className="panel"><h2>{text.home.best}</h2><p className="stat">{home.bestScore ?? '—'}</p><p className="note">{text.home.widest} {home.bestMargin ?? '—'}</p></article>}
      </section>
      {(hideHotspot || hideActivity) && (
        <p className="note">{[hideHotspot && notes.hiddenHotspot, hideActivity && notes.hiddenActivity].filter(Boolean).join(' ')}</p>
      )}
      {( !hideHotspot || !hideActivity) && (
        <div className={hideHotspot || hideActivity ? 'graph-row single' : 'graph-row'}>
          {!hideHotspot && (
            <section className="panel stack">
              <h2>{text.home.hotspot}</h2>
              <p className="note">{text.home.hotspotNote}</p>
              <div className="hotspot" aria-label={text.home.hotspot}>
                {home.weeks.map((week) => (
                  <div key={week.label}>
                    <span style={{ height: `${Math.max(8, (week.games / peak) * 100)}%` }} title={`${week.games} ${text.home.matches}`} />
                    <small>{week.label}</small>
                  </div>
                ))}
              </div>
            </section>
          )}
          {!hideActivity && (
            <section className="panel stack">
              <h2>{text.home.activity}</h2>
              <ActivityGraph lang={lang} matches={home.playedOn.map((finishedAt) => ({ finishedAt }))} />
            </section>
          )}
        </div>
      )}
      {hideAchievements ? <p className="note">{notes.hiddenAchievements}</p> : (
        <section className="stack">
          <h2>{text.home.achievements}</h2>
          <p className="note">{text.home.achieveNote}</p>
          <ul className="badge-row">
            {achievements.map((badge) => {
              const label = achievementCopy(lang, badge.id, badge.name, badge.detail);
              return (
                <li key={badge.id} className={badge.owned ? 'badge owned' : 'badge'}>
                  <AchievementMark kind={badge.mark} />
                  <span>
                    <strong>{label.name}</strong>
                    <span>{label.detail}</span>
                    <span className="progress">{progressCopy(lang, badge.progress)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {!hideRecord && (
        <>
          <section className="stack">
            <h2>{text.home.opponents}</h2>
            {home.opponents.length === 0 && <p className="note">{text.home.noOpponents}</p>}
            {home.opponents.length > 0 && <OpponentTable lang={lang} rows={home.opponents} />}
          </section>
          <section className="stack">
            <h2>{text.home.recent}</h2>
            {home.recent.length === 0 && <p className="note">{text.home.noRecent} <Link href="/play">{text.home.play}</Link>.</p>}
            {home.recent.length > 0 && <RecentTable lang={lang} rows={home.recent} />}
          </section>
        </>
      )}
    </>
  );
}
