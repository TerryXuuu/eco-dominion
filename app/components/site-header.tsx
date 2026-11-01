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

type Viewer = { name: string; role: string; level: number; avatar: boolean };
const viewers = new Map<string, { at: number; viewer: Viewer }>();
const VIEWER_TTL_MS = 20_000;

async function signedInViewer() {
  await cookies();
  try {
    const identity = await currentIdentity();
    if (!identity) return { paused: false, viewer: null };
    const cached = viewers.get(identity.subject);
    if (cached && Date.now() - cached.at < VIEWER_TTL_MS) return { paused: false, viewer: cached.viewer };
    const viewer = await withTransaction(async (client) => {
      const found = await client.query(
        `SELECT p.display_name, p.avatar_key,
                COALESCE((SELECT array_agg(role) FROM user_role r WHERE r.user_id = u.id), '{}') AS roles,
                rt.rating, rt.games
         FROM app_user u
         JOIN profile p ON p.user_id = u.id
         LEFT JOIN rating rt ON rt.user_id = u.id AND rt.season_id = $2
         WHERE u.auth_subject = $1`,
        [identity.subject, CASUAL_SEASON_ID],
      );
      const row = found.rows[0];
      if (!row) return { name: identity.name || identity.email, role: 'Player', level: 1, avatar: false };
      const games = row.games == null ? 0 : Number(row.games);
      const score = row.rating == null ? 1000 : Number(row.rating);
      return { name: String(row.display_name), role: roleLabel(rolesOf(row.roles)), level: levelOf(score, games), avatar: Boolean(row.avatar_key) };
    });
    viewers.set(identity.subject, { at: Date.now(), viewer });
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
        <Link href={viewer ? '/home' : '/'} prefetch={false}>Home</Link>
        <Link href="/rules" prefetch={false}>Rulings</Link>
        <Link href="/library" prefetch={false}>Library</Link>
        <Link href="/leaderboard" prefetch={false}>Leaderboard</Link>
        <Link href="/community" prefetch={false}>Community</Link>
        <Link href="/play" prefetch={false}>Play</Link>
        <Link href="/history" prefetch={false}>History</Link>
        {viewer?.role === 'Moderator' || viewer?.role === 'Admin' ? <Link href="/moderation" prefetch={false}>Moderation</Link> : null}
        {viewer?.role === 'Admin' && <Link href="/admin" prefetch={false}>Admin</Link>}
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
