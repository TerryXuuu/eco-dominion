'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function parentOf(path: string) {
  if (/^\/matches\/[^/]+\/replay\/?$/.test(path)) return { href: path.replace(/\/replay\/?$/, ''), label: 'Match' };
  if (path.startsWith('/matches/')) return { href: '/play', label: 'Play' };
  if (path.startsWith('/community/')) return { href: '/community', label: 'Community' };
  if (path.startsWith('/players/')) return { href: '/people', label: 'People' };
  if (path === '/login' || path === '/register' || path === '/recover' || path === '/reset-password') return { href: '/', label: 'Home' };
  return { href: '/', label: 'Home' };
}

export function BackLink() {
  const path = usePathname() || '/';
  if (path === '/') return null;
  const parent = parentOf(path);
  return (
    <Link className="back" href={parent.href}>
      ← {parent.label}
    </Link>
  );
}
