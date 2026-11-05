import { CARD_BY_ID, titleOf } from './cards';
import type { Lang } from './i18n';
import { ZH_EFFECT, ZH_GUIDE } from './zh-cards';
import { ZH_RULINGS } from './zh-rulings';

export function say(lang: Lang, en: string, zh: string) {
  return lang === 'zh' ? zh : en;
}

const NOTICES: Record<string, string> = {
  'Authentication is not configured': '登录服务尚未配置',
  'Email or password is incorrect': '邮箱或密码不正确',
  'Check the name, email, and password (8 or more characters).': '请检查名字、邮箱和密码（至少 8 位）。',
  'Unable to create account. Try again shortly.': '暂时无法创建账号，请稍后再试。',
  'Enter a valid email address.': '请输入有效的邮箱地址。',
  'Unable to request recovery right now.': '暂时无法发送找回邮件。',
  'A recovery token and a password of 8 or more characters are required.': '需要找回令牌，以及至少 8 位的密码。',
  'Unable to reset the password.': '无法重置密码。',
  'If an account exists for that email, a recovery message has been requested.': '若该邮箱有账号，已请求发送找回邮件。',
};

export function shownNotice(lang: Lang, message: string) {
  if (lang !== 'zh') return message;
  return NOTICES[message] ?? message;
}

export function cardTitle(lang: Lang, id: string) {
  const card = CARD_BY_ID[id];
  if (!card) return id === 'no event' ? (lang === 'zh' ? '无事件' : 'No event') : id;
  return lang === 'zh' ? card.name : titleOf(id);
}

export function shownEffect(lang: Lang, id: string, english: string) {
  return lang === 'zh' ? (ZH_EFFECT[id] ?? english) : english;
}

export function shownGuide(lang: Lang, id: string, play: string, pair: string) {
  if (lang !== 'zh') return { play, pair };
  return ZH_GUIDE[id] ?? { play, pair };
}

export function shownRuling(lang: Lang, id: string, english: string) {
  return lang === 'zh' ? (ZH_RULINGS[id] ?? english) : english;
}

const PHASES: Record<string, string> = {
  refresh: '刷新',
  draw: '抽牌',
  event: '事件',
  deploy: '部署',
  tactics: '战术',
  settle: '结算',
  finished: '结束',
};

export function phaseLabel(lang: Lang, phase: string) {
  if (lang !== 'zh') return phase;
  return PHASES[phase] ?? phase;
}
