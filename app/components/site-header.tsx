import Link from 'next/link';
import { cookies } from 'next/headers';
import { AuthUnavailableError, currentIdentity } from '@/lib/api';
import { withTransaction } from '@/lib/db';
import { CASUAL_SEASON_ID } from '@/lib/match-rules';
import { levelOf, rankOf } from '@/lib/standing';
import { RankMark } from './rank-mark';
import { signOut } from '../profile/actions';

export function roleLabel(roles: string[]) {
  if (roles.includes('admin')) return 'Admin';
  if (roles.includes('moderator')) return 'Moderator';
  if (roles.includes('guest') && !roles.includes('player')) return 'Guest';
  return 'Player';
}

function rolesOf(raw: unknown) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
  return [];
}

async function signedInViewer() {
  await cookies();
  try {
    const identity = await currentIdentity();
    if (!identity) return { paused: false, viewer: null };
    const viewer = await withTransaction(async (client) => {
      const found = await client.query(
        `SELECT u.id, p.display_name, p.avatar_key,
                COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
         FROM app_user u
         JOIN profile p ON p.user_id = u.id
         LEFT JOIN user_role r ON r.user_id = u.id
         WHERE u.auth_subject = $1
         GROUP BY u.id, p.display_name, p.avatar_key`,
        [identity.subject],
      );
      const row = found.rows[0];
      if (!row) return { name: identity.name || identity.email, role: 'Player', level: 1, avatar: false };
      const rating = await client.query(`SELECT rating, games FROM rating WHERE season_id = $1 AND user_id = $2`, [CASUAL_SEASON_ID, row.id]);
      const games = rating.rows[0] ? Number(rating.rows[0].games) : 0;
      const score = rating.rows[0] ? Number(rating.rows[0].rating) : 1000;
      return { name: String(row.display_name), role: roleLabel(rolesOf(row.roles)), level: levelOf(score, games), avatar: Boolean(row.avatar_key) };
    });
    return { paused: false, viewer };
  } catch (error) {
    if (error instanceof AuthUnavailableError) return { paused: true, viewer: null };
    return { paused: true, viewer: null };
  }
}

/** `email` is ignored. The header reads the session itself so a page cannot forget who is signed in. */
export async function SiteHeader(_legacy?: { email?: string | null }) {
  const { paused, viewer } = await signedInViewer();
  return (
    <header className="shell topbar">
      <Link className="brand" href="/">
        <span className="seal"><img src="/brand/logo.jpg" alt="" /></span>
        <strong>Eco Dominion</strong>
      </Link>
      <nav className="nav">
        <Link href={viewer ? '/home' : '/'}>Home</Link>
        <Link href="/rules">Rulings</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/community">Community</Link>
        <Link href="/play">Play</Link>
        <Link href="/history">History</Link>
        {viewer?.role === 'Moderator' || viewer?.role === 'Admin' ? <Link href="/moderation">Moderation</Link> : null}
        {viewer?.role === 'Admin' && <Link href="/admin">Admin</Link>}
        {viewer ? (
          <span className="account">
            <Link className="who-link" href="/home">
              {viewer.avatar && <img className="avatar" src="/api/profile/avatar" alt="" />}
              <RankMark level={viewer.level} size={26} />
              <span className="who">
                <strong>{viewer.name}</strong>
                <span className="role">{rankOf(viewer.level).name} · Lv {viewer.level} · {viewer.role}</span>
              </span>
            </Link>
            <Link className="button" href="/profile">Profile</Link>
            <form action={signOut}>
              <button className="secondary" type="submit">Log out</button>
            </form>
          </span>
        ) : paused ? <span className="role">Session paused</span> : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
