import type { Visibility } from './profile-policy.ts';

export const POST_MAX = 2000;
export const COMMENT_MAX = 1000;
export const REASON_MAX = 500;
export const FEED_PAGE = 20;
export const PAGE_MAX = 50;

export const RELATIONSHIP_ACTIONS = ['follow', 'unfollow', 'friend', 'accept', 'decline', 'unfriend', 'block', 'unblock'] as const;
export type RelationshipAction = (typeof RELATIONSHIP_ACTIONS)[number];

export const REPORT_SUBJECTS = ['user', 'post', 'comment', 'match'] as const;
export type ReportSubject = (typeof REPORT_SUBJECTS)[number];

export const MODERATION_ACTIONS = ['hide', 'restore', 'suspend', 'unsuspend', 'resolve', 'dismiss'] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

/** Plain text only: control characters other than newline and tab are removed, line endings normalised. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return text.length >= 1 && text.length <= max ? text : null;
}

const isVisibility = (value: unknown): value is Visibility => value === 'public' || value === 'friends' || value === 'private';

export function parsePostInput(input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const body = cleanText(raw.body, POST_MAX);
  const visibility = raw.visibility ?? 'public';
  if (!body || !isVisibility(visibility)) return null;
  return { body, visibility };
}

export function parsePostPatch(input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const patch: { body?: string; visibility?: Visibility } = {};
  if (raw.body !== undefined) {
    const body = cleanText(raw.body, POST_MAX);
    if (!body) return null;
    patch.body = body;
  }
  if (raw.visibility !== undefined) {
    if (!isVisibility(raw.visibility)) return null;
    patch.visibility = raw.visibility;
  }
  return patch.body === undefined && patch.visibility === undefined ? null : patch;
}

export function parseLimit(raw: unknown, fallback = FEED_PAGE) {
  const value = Number(raw ?? fallback);
  return Number.isInteger(value) && value >= 1 ? Math.min(value, PAGE_MAX) : fallback;
}

/** Keyset cursor over (created_at, id), opaque to clients. */
export function encodeCursor(createdAt: string, id: string) {
  return Buffer.from(`${createdAt}|${id}`).toString('base64url');
}

export function decodeCursor(raw: unknown): { createdAt: string; id: string } | null | 'invalid' {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string' || raw.length > 200) return 'invalid';
  const [createdAt, id] = Buffer.from(raw, 'base64url').toString('utf8').split('|');
  if (!id || !isUuid(id) || Number.isNaN(Date.parse(createdAt))) return 'invalid';
  return { createdAt: new Date(createdAt).toISOString(), id };
}

export function parseReport(input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const subjectType = raw.subjectType;
  const reason = cleanText(raw.reason, REASON_MAX);
  if (!REPORT_SUBJECTS.includes(subjectType as ReportSubject) || !reason || reason.length < 3) return null;
  if (subjectType === 'user') {
    const handle = typeof raw.handle === 'string' ? raw.handle.trim().toLowerCase() : '';
    return /^[a-z0-9_]{3,24}$/.test(handle) ? { subjectType: 'user' as const, handle, reason } : null;
  }
  return isUuid(raw.subjectId) ? { subjectType: subjectType as Exclude<ReportSubject, 'user'>, subjectId: raw.subjectId.toLowerCase(), reason } : null;
}

export function parseModeration(input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const action = raw.action as ModerationAction;
  const reason = cleanText(raw.reason, REASON_MAX);
  if (!MODERATION_ACTIONS.includes(action) || !reason || reason.length < 3) return null;
  if (raw.reportId !== undefined) return isUuid(raw.reportId) ? { action, reason, reportId: raw.reportId.toLowerCase() } : null;
  if (!REPORT_SUBJECTS.includes(raw.subjectType as ReportSubject) || !isUuid(raw.subjectId)) return null;
  if (action === 'resolve' || action === 'dismiss') return null;
  return { action, reason, subjectType: raw.subjectType as ReportSubject, subjectId: raw.subjectId.toLowerCase() };
}

/** Which moderation actions apply to which subject; suspensions on content target its author. */
export function actionFits(action: ModerationAction, subjectType: ReportSubject) {
  if (action === 'resolve' || action === 'dismiss') return true;
  if (action === 'hide' || action === 'restore') return subjectType === 'post' || subjectType === 'comment';
  return subjectType !== 'match';
}
