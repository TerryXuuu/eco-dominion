import { cookies } from 'next/headers';
import { parseTheme, THEME_COOKIE, type Theme } from './artwork';

export async function getTheme(): Promise<Theme> {
  const jar = await cookies();
  return parseTheme(jar.get(THEME_COOKIE)?.value);
}
