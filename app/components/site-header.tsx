import Link from 'next/link';
import { AuthUnavailableError, currentIdentity } from '@/lib/api';
import { withTransaction } from '@/lib/db';
import { signOut } from '../profile/actions';
import { BackLink } from './back-link';

export function roleLabel(roles: string[]) {
  if (roles.includes('admin')) return 'Admin';
  if (roles.includes('moderator')) return 'Moderator';
  return 'Player';
}

function rolesOf(raw: unknown) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
  return [];
}

async function signedInViewer() {
  try {
    const identity = await currentIdentity();
    if (!identity) return { paused: false, viewer: null };
    const viewer = await withTransaction(async (client) => {
      const found = await client.query(
        `SELECT p.display_name,
                COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
         FROM app_user u
         JOIN profile p ON p.user_id = u.id
         LEFT JOIN user_role r ON r.user_id = u.id
         WHERE u.auth_subject = $1
         GROUP BY p.display_name`,
        [identity.subject],
      );
      const row = found.rows[0];
      if (!row) return { name: identity.name || identity.email, role: 'Player' };
      return { name: String(row.display_name), role: roleLabel(rolesOf(row.roles)) };
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
        <Link href="/rules">Rulings</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        {viewer && <Link href="/community">Community</Link>}
        {viewer && <Link href="/play">Play</Link>}
        {viewer && <Link href="/history">History</Link>}
        {viewer && <Link href="/notifications">Inbox</Link>}
        {viewer?.role === 'Moderator' || viewer?.role === 'Admin' ? <Link href="/moderation">Moderation</Link> : null}
        {viewer?.role === 'Admin' && <Link href="/admin">Admin</Link>}
        {viewer ? <Link href="/profile">Profile</Link> : paused ? null : <Link href="/login">Log in</Link>}
        {!viewer && !paused && <Link href="/register">Register</Link>}
        {viewer && (
          <span className="account">
            <span className="who">
              <strong>{viewer.name}</strong>
              <span className="role">{viewer.role}</span>
            </span>
            <form action={signOut}>
              <button className="secondary" type="submit">Log out</button>
            </form>
          </span>
        )}
        {paused && !viewer && <span className="role">Session paused</span>}
      </nav>
      <BackLink />
    </header>
  );
}
