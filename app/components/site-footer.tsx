import { withTransaction } from '@/lib/db';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

const DEFAULTS = {
  copyright: '© Eco Dominion. All rights reserved.',
  contacts: 'Terry & Lynx',
};

export async function siteCopy() {
  try {
    return await withTransaction(async (client) => {
      const found = await client.query(`SELECT key, value FROM site_setting WHERE key IN ('copyright', 'contacts')`);
      const map = new Map(found.rows.map((row) => [String(row.key), String(row.value)]));
      return {
        copyright: map.get('copyright') || DEFAULTS.copyright,
        contacts: map.get('contacts') || DEFAULTS.contacts,
      };
    });
  } catch {
    return DEFAULTS;
  }
}

export async function SiteFooter() {
  const [setting, lang] = await Promise.all([siteCopy(), getLang()]);
  const text = copy(lang);
  const copyright = lang === 'zh' && setting.copyright === DEFAULTS.copyright ? text.footer.rights : setting.copyright;
  return (
    <footer className="site-footer">
      <span>{copyright}</span>
      <span>{setting.contacts}</span>
    </footer>
  );
}
