import { withClient } from '@/lib/db';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
import { DEFAULT_SITE_COPY, readSiteCopy, rememberSiteCopy, siteCopyGeneration, type SiteCopy } from '@/lib/site-copy';

export async function siteCopy(): Promise<SiteCopy> {
  const hit = readSiteCopy();
  if (hit) return hit;
  const seen = siteCopyGeneration();
  try {
    const value = await withClient(async (client) => {
      const found = await client.query(`SELECT key, value FROM site_setting WHERE key IN ('copyright', 'contacts')`);
      const map = new Map(found.rows.map((row) => [String(row.key), String(row.value)]));
      return {
        copyright: map.get('copyright') || DEFAULT_SITE_COPY.copyright,
        contacts: map.get('contacts') || DEFAULT_SITE_COPY.contacts,
      };
    });
    rememberSiteCopy(seen, value);
    return value;
  } catch {
    return DEFAULT_SITE_COPY;
  }
}

export async function SiteFooter() {
  const [setting, lang] = await Promise.all([siteCopy(), getLang()]);
  const text = copy(lang);
  const copyright = lang === 'zh' && setting.copyright === DEFAULT_SITE_COPY.copyright ? text.footer.rights : setting.copyright;
  return (
    <footer className="site-footer">
      <span>{copyright}</span>
      <span>{setting.contacts}</span>
    </footer>
  );
}
