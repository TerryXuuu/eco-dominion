import Link from 'next/link';

export function SiteHeader({ email }: { email?: string | null }) {
  return (
    <header className="shell topbar">
      <Link className="brand" href="/">
        <span className="seal">生</span>
        <strong>Eco Dominion</strong>
      </Link>
      <nav className="nav">
        <Link href="/rules">Rulings</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        {email && <Link href="/community">Community</Link>}
        {email && <Link href="/play">Play</Link>}
        {email && <Link href="/history">History</Link>}
        {email && <Link href="/notifications">Inbox</Link>}
        {email ? <Link href="/profile">Profile</Link> : <Link href="/login">Log in</Link>}
        {!email && <Link href="/register">Register</Link>}
      </nav>
    </header>
  );
}
