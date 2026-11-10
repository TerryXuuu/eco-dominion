import Link from 'next/link';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { AuthUnavailableError, currentIdentity } from '@/lib/api';
import { withClient } from '@/lib/db';
import { levelProgress, rankOf } from '@/lib/standing';
import { ExperienceBar, RankMark } from './rank-mark';
import { LanguageSwitch } from './language-switch';
import { ThemeSwitch } from './theme-switch';
import { logoUrl, variantFor } from '@/lib/artwork';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
import { getTheme } from '@/lib/theme';

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

type Viewer = { name: string; role: string; xp: number; ladderPeak: number; avatar: boolean };
const viewers = new Map<string, { at: number; viewer: Viewer }>();
const VIEWER_TTL_MS = 3 * 60_000;

const signedInViewer = cache(async () => {
  await cookies();
  try {
    const identity = await currentIdentity();
    if (!identity) return { paused: false, viewer: null };
    const cached = viewers.get(identity.subject);
    if (cached && Date.now() - cached.at < VIEWER_TTL_MS) return { paused: false, viewer: cached.viewer };
    const viewer = await withClient(async (client) => {
      const found = await client.query(
        `SELECT p.display_name, p.avatar_key, p.peak_xp, p.ladder_peak,
                COALESCE((SELECT array_agg(role) FROM user_role r WHERE r.user_id = u.id), '{}') AS roles
         FROM app_user u
         JOIN profile p ON p.user_id = u.id
         WHERE u.auth_subject = $1`,
        [identity.subject],
      );
      const row = found.rows[0];
      if (!row) return { name: identity.name || identity.email, role: 'Player', xp: 0, ladderPeak: 0, avatar: false };
      return { name: String(row.display_name), role: roleLabel(rolesOf(row.roles)), xp: Number(row.peak_xp ?? 0), ladderPeak: Number(row.ladder_peak ?? 0), avatar: Boolean(row.avatar_key) };
    });
    viewers.set(identity.subject, { at: Date.now(), viewer });
    return { paused: false, viewer };
  } catch (error) {
    if (error instanceof AuthUnavailableError) return { paused: true, viewer: null };
    return { paused: true, viewer: null };
  }
});

/** `email` is ignored. The header reads the session itself so a page cannot forget who is signed in. */
export async function SiteHeader({ persistent = false }: { email?: string | null; persistent?: boolean } = {}) {
  const [{ paused, viewer }, lang, theme] = await Promise.all([signedInViewer(), getLang(), getTheme()]);
  const text = copy(lang);
  const rank = viewer ? rankOf(viewer.ladderPeak) : null;
  const level = viewer ? levelProgress(viewer.xp) : null;
  return (
    <header className={persistent ? 'shell topbar site-header' : 'shell topbar'}>
      <Link className="brand" href="/">
        <img className="brand-logo" src={logoUrl(theme, variantFor(lang))} alt="Eco Dominion" />
      </Link>
      <nav className="nav">
        <Link href={viewer ? '/home' : '/'}>{text.nav.home}</Link>
        <Link href="/rules">{text.nav.rulings}</Link>
        <Link href="/library">{text.nav.library}</Link>
        <Link href="/leaderboard">{text.nav.leaderboard}</Link>
        <Link href="/community">{text.nav.community}</Link>
        {viewer && <Link href="/friends">{text.nav.friends}</Link>}
        <Link href="/play">{text.nav.play}</Link>
        <Link href="/history">{text.nav.history}</Link>
        {viewer?.role === 'Moderator' || viewer?.role === 'Admin' ? <Link href="/moderation">{text.nav.moderation}</Link> : null}
        {viewer?.role === 'Admin' && <Link href="/admin">{text.nav.admin}</Link>}
        {viewer && <Link href="/settings">{text.nav.settings}</Link>}
        <ThemeSwitch theme={theme} />
        <LanguageSwitch lang={lang} />
        {viewer && rank ? (
          <span className="account">
            <Link className="who-link" href="/home">
              {viewer.avatar && <img className="avatar" src="/api/profile/avatar" alt="" />}
              <RankMark score={viewer.ladderPeak} size={26} />
              <span className="who">
                <strong>{viewer.name}</strong>
                <span className="role">{text.rank[rank.name]} · {text.home.level} {level?.level} · {text.role[viewer.role as keyof typeof text.role]}</span>
                <ExperienceBar xp={viewer.xp} />
              </span>
            </Link>
          </span>
        ) : paused ? <span className="role">{text.nav.paused}</span> : (
          <>
            <Link href="/login">{text.nav.login}</Link>
            <Link href="/register">{text.nav.register}</Link>
          </>
        )}
      </nav>
    </header>
  );
}
