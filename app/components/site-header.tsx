import Link from 'next/link';
import { withTransaction } from '@/lib/db';

async function staffLinks(email?: string | null) {
  if (!email) return { moderator: false, admin: false };
  try {
    return await withTransaction(async (client) => {
      const found = await client.query(
        `SELECT COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
         FROM app_user u LEFT JOIN user_role r ON r.user_id = u.id
         WHERE lower(u.email) = lower($1) GROUP BY u.id`,
        [email],
      );
      const raw = found.rows[0]?.roles;
      const roles = Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? raw.replace(/^\{|\}$/g, '').split(',').filter(Boolean) : [];
      return { moderator: roles.includes('moderator') || roles.includes('admin'), admin: roles.includes('admin') };
    });
  } catch {
    return { moderator: false, admin: false };
  }
}

export async function SiteHeader({ email }: { email?: string | null }) {
  const staff = await staffLinks(email);
  return (
    <header className="shell topbar">
      <Link className="brand" href="/">
        <span className="seal"><img src="/brand/logo.jpg" alt="" /></span>
        <strong>Eco Dominion</strong>
      </Link>
      <nav className="nav">
        <Link href="/rules">Rulings</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        {email && <Link href="/community">Community</Link>}
        {email && <Link href="/play">Play</Link>}
        {email && <Link href="/history">History</Link>}
        {email && <Link href="/notifications">Inbox</Link>}
        {staff.moderator && <Link href="/moderation">Moderation</Link>}
        {staff.admin && <Link href="/admin">Admin</Link>}
        {email ? <Link href="/profile">Profile</Link> : <Link href="/login">Log in</Link>}
        {!email && <Link href="/register">Register</Link>}
      </nav>
    </header>
  );
}
