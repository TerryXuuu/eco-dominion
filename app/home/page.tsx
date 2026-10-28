import Link from 'next/link';
import { ActivityGraph } from '../components/activity-graph';
import { AchievementMark, RankMark } from '../components/rank-mark';
import { OpponentTable, RecentTable } from '../components/record-tables';
import { SiteHeader } from '../components/site-header';
import { homeDashboard } from '@/lib/home-service';
import { pageActor } from '@/lib/page-actor';
import { rankOf } from '@/lib/standing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function HomeDashboardPage() {
  const { data } = await pageActor((client, userId) => homeDashboard(client, userId));
  const home = data as Awaited<ReturnType<typeof homeDashboard>>;
  const rank = rankOf(home.level);
  const peak = Math.max(1, ...home.weeks.map((week) => week.games));
  const achievements = [...home.achievements].sort((a, b) => Number(b.owned) - Number(a.owned));
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <section className="hero compact home-head">
          <Link className="portrait" href="/profile" aria-label="Open your profile">
            {home.hasAvatar ? <img className="avatar large" src="/api/profile/avatar" alt="" /> : <RankMark level={home.level} size={72} />}
          </Link>
          <div>
            <p className="rank-line"><RankMark level={home.level} size={36} /> <span>{rank.name} · Level {home.level}</span></p>
            <h1>{home.displayName}</h1>
            <p className="lede">@{home.handle}</p>
            <p className="note">{rank.blurb}</p>
            <div className="row">
              <Link className="button" href="/profile">Profile</Link>
              <Link className="button secondary" href="/play">Play</Link>
            </div>
          </div>
        </section>
        <section className="stat-grid">
          <article className="panel"><h2>Casual rating</h2><p className="stat">{home.rating}</p><p className="note">{home.games} rated games · peak {home.peakRating ?? '—'}</p></article>
          <article className="panel"><h2>Ranking</h2><p className="stat">{home.rank ? `#${home.rank}` : '—'}</p><p className="note">{home.rank ? 'On the casual board' : 'Play a casual match to be ranked'}</p></article>
          <article className="panel"><h2>Record</h2><p className="stat">{home.record.wins}–{home.record.losses}–{home.record.draws}</p><p className="note">Wins, losses, draws</p></article>
          <article className="panel"><h2>Win streak</h2><p className="stat">{home.winStreak}</p><p className="note">Best {home.bestWinStreak}</p></article>
          <article className="panel"><h2>Day streak</h2><p className="stat">{home.dayStreak}</p><p className="note">Best {home.bestDayStreak} days in a row</p></article>
          <article className="panel"><h2>Best score</h2><p className="stat">{home.bestScore ?? '—'}</p><p className="note">Widest win {home.bestMargin ?? '—'}</p></article>
        </section>
        <div className="graph-row">
          <section className="panel stack">
            <h2>Hotspot</h2>
            <p className="note">Finished matches in each of the last eight weeks.</p>
            <div className="hotspot" aria-label="Matches by week">
              {home.weeks.map((week) => (
                <div key={week.label}>
                  <span style={{ height: `${Math.max(8, (week.games / peak) * 100)}%` }} title={`${week.games} matches`} />
                  <small>{week.label}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="panel stack">
            <h2>Activity</h2>
            <ActivityGraph matches={home.playedOn.map((finishedAt) => ({ finishedAt }))} />
          </section>
        </div>
        <section className="stack">
          <h2>Achievements</h2>
          <p className="note">Earned from finished matches. A dim seal is still ahead of you.</p>
          <ul className="badge-row">
            {achievements.map((badge) => (
              <li key={badge.id} className={badge.owned ? 'badge owned' : 'badge'}>
                <AchievementMark kind={badge.mark} />
                <span>
                  <strong>{badge.name}</strong>
                  <span>{badge.detail}</span>
                  <span className="progress">{badge.progress}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="stack">
          <h2>Opponents</h2>
          {home.opponents.length === 0 && <p className="note">No finished matches yet.</p>}
          {home.opponents.length > 0 && <OpponentTable rows={home.opponents} />}
        </section>
        <section className="stack">
          <h2>Recent games</h2>
          {home.recent.length === 0 && <p className="note">Your history will show up here. <Link href="/play">Play</Link>.</p>}
          {home.recent.length > 0 && <RecentTable rows={home.recent} />}
        </section>
      </main>
    </>
  );
}
