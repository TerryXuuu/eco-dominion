import Link from 'next/link';
import { ActivityGraph } from '../components/activity-graph';
import { AchievementMark, RankMark } from '../components/rank-mark';
import { OpponentTable, RecentTable } from '../components/record-tables';
import { SiteHeader } from '../components/site-header';
import { homeDashboard } from '@/lib/home-service';
import { pageActor } from '@/lib/page-actor';
import { rankOf } from '@/lib/standing';
import { achievementCopy, copy, progressCopy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function HomeDashboardPage() {
  const { data } = await pageActor((client, userId) => homeDashboard(client, userId));
  const home = data as Awaited<ReturnType<typeof homeDashboard>>;
  const lang = await getLang();
  const text = copy(lang);
  const rank = rankOf(home.level);
  const rankName = text.rank[rank.name as keyof typeof text.rank];
  const peak = Math.max(1, ...home.weeks.map((week) => week.games));
  const achievements = [...home.achievements].sort((a, b) => Number(b.owned) - Number(a.owned));
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <section className="page-head">
          <Link className="portrait" href="/profile" aria-label={text.home.openProfile}>
            {home.hasAvatar ? <img className="avatar" src="/api/profile/avatar" alt="" /> : <RankMark level={home.level} size={28} />}
          </Link>
          <div className="page-id">
            <h1>{home.displayName}</h1>
            <p className="note">@{home.handle} · {rankName} · {text.home.level} {home.level}</p>
          </div>
          <div className="row">
            <Link className="button" href="/profile">{text.home.profile}</Link>
            <Link className="button secondary" href="/play">{text.home.play}</Link>
          </div>
        </section>
        <section className="stat-grid">
          <article className="panel"><h2>{text.home.rating}</h2><p className="stat">{home.rating}</p><p className="note">{home.games} {text.home.ratedGames} {home.peakRating ?? '—'}</p></article>
          <article className="panel"><h2>{text.home.ranking}</h2><p className="stat">{home.rank ? `#${home.rank}` : '—'}</p><p className="note">{home.rank ? text.home.onBoard : text.home.unranked}</p></article>
          <article className="panel"><h2>{text.home.record}</h2><p className="stat">{home.record.wins}–{home.record.losses}–{home.record.draws}</p><p className="note">{text.home.wld}</p></article>
          <article className="panel"><h2>{text.home.streak}</h2><p className="stat">{home.winStreak}</p><p className="note">{text.home.bestStreak} {home.bestWinStreak}</p></article>
          <article className="panel"><h2>{text.home.days}</h2><p className="stat">{home.dayStreak}</p><p className="note">{text.home.bestStreak} {home.bestDayStreak} {text.home.bestDays}</p></article>
          <article className="panel"><h2>{text.home.best}</h2><p className="stat">{home.bestScore ?? '—'}</p><p className="note">{text.home.widest} {home.bestMargin ?? '—'}</p></article>
        </section>
        <div className="graph-row">
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
          <section className="panel stack">
            <h2>{text.home.activity}</h2>
            <ActivityGraph lang={lang} matches={home.playedOn.map((finishedAt) => ({ finishedAt }))} />
          </section>
        </div>
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
      </main>
    </>
  );
}
