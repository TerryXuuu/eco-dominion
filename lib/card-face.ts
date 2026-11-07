import { cookies } from 'next/headers';
import { CARD_TEXT_COOKIE } from './artwork';

export function textFreeFrom(value: string | undefined | null) {
  return value === 'plain';
}

export async function getTextFree() {
  const jar = await cookies();
  return textFreeFrom(jar.get(CARD_TEXT_COOKIE)?.value);
}
