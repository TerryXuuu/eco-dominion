import { withTransaction } from '@/lib/db';

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
  const copy = await siteCopy();
  return (
    <footer className="site-footer">
      <span>{copy.copyright}</span>
      <span>{copy.contacts}</span>
    </footer>
  );
}
