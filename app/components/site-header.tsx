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
        {email ? <Link href="/profile">Profile</Link> : <Link href="/login">Log in</Link>}
        {!email && <Link href="/register">Register</Link>}
      </nav>
    </header>
  );
}
