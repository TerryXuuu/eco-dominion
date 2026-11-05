import { cookies } from 'next/headers';
import { LANG_COOKIE, parseLang, type Lang } from './i18n';

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  return parseLang(jar.get(LANG_COOKIE)?.value);
}
