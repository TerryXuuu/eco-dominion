import { randomUUID } from 'node:crypto';
import {
  COMMENT_MAX,
  actionFits,
  cleanText,
  decodeCursor,
  encodeCursor,
  isUuid,
  parseLimit,
  parseModeration,
  parsePostInput,
  parsePostPatch,
  parseReport,
  parseSearch,
  RELATIONSHIP_ACTIONS,
  type ModerationAction,
  type RelationshipAction,
  type ReportSubject,
} from './community-policy.ts';
import { participationGate } from './access.ts';
import { canViewProfile, mutationGate, type Visibility } from './profile-policy.ts';
import type { Queryable } from './profile-service.ts';

const fail = <S extends 400 | 403 | 404 | 409 | 429>(status: S, error: string) => ({ status, body: { error } as const });
const iso = (value: unknown) => new Date(value as string).toISOString();

const blocked = (a: string, b: string) =>
  `EXISTS (SELECT 1 FROM user_block k WHERE (k.blocker = ${a} AND k.blocked = ${b}) OR (k.blocker = ${b} AND k.blocked = ${a}))`;
const friends = (a: string, b: string) =>
  `EXISTS (SELECT 1 FROM friend_request f WHERE f.status = 'accepted' AND ((f.sender = ${a} AND f.recipient = ${b}) OR (f.sender = ${b} AND f.recipient = ${a})))`;

/** A post is visible to $1 when it is live, its author exists, neither side blocked the other, and its audience includes $1. */
const VISIBLE_POST = `p.status = 'visible' AND u.status <> 'deleted' AND NOT ${blocked('$1', 'p.author_id')}
  AND (p.author_id = $1 OR p.visibility = 'public' OR (p.visibility = 'friends' AND ${friends('$1', 'p.author_id')}))`;

const VISIBLE_COMMENT = `c.status = 'visible' AND cu.status <> 'deleted' AND NOT ${blocked('$1', 'c.author_id')}`;

const POST_SELECT = `
  SELECT p.id, p.body, p.visibility, p.tags, p.created_at, p.updated_at, p.author_id, u.handle, pr.display_name,
    (pr.avatar_key IS NOT NULL) AS has_avatar,
    (SELECT count(*)::int FROM reaction r WHERE r.post_id = p.id) AS likes,
    EXISTS (SELECT 1 FROM reaction r WHERE r.post_id = p.id AND r.user_id = $1) AS liked,
    (SELECT count(*)::int FROM comment c JOIN app_user cu ON cu.id = c.author_id WHERE c.post_id = p.id AND ${VISIBLE_COMMENT}) AS comments,
    COALESCE((SELECT json_agg(i.id ORDER BY i.created_at) FROM post_image i WHERE i.post_id = p.id), '[]'::json) AS images
  FROM post p JOIN app_user u ON u.id = p.author_id JOIN profile pr ON pr.user_id = u.id`;

function textList(raw: unknown) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        /* A Postgres array arrives as a brace list instead. */
      }
    }
    return trimmed.replace(/^\{|\}$/g, '').split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function postView(row: Record<string, unknown>, viewerId: string) {
  return {
    id: String(row.id),
    author: { handle: String(row.handle), displayName: String(row.display_name), hasAvatar: Boolean(row.has_avatar) },
    body: String(row.body),
    tags: textList(row.tags),
    images: textList(row.images),
    visibility: String(row.visibility) as Visibility,
    createdAt: iso(row.created_at),
    edited: iso(row.updated_at) !== iso(row.created_at),
    likes: Number(row.likes),
    liked: Boolean(row.liked),
    comments: Number(row.comments),
    mine: String(row.author_id) === viewerId,
  };
}
export type PostView = ReturnType<typeof postView>;

async function audit(client: Queryable, actorId: string | null, action: string, subjectType: string, subjectId: string, metadata: Record<string, unknown> = {}) {
  await client.query(
    `INSERT INTO audit_log (id, actor_id, action, subject_type, subject_id, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [randomUUID(), actorId, action, subjectType, subjectId, JSON.stringify(metadata)],
  );
}

/** Durable rate limit: counts this user's audited actions in the window. */
async function limited(client: Queryable, userId: string, action: string, max: number, seconds: number) {
  const recent = await client.query(
    `SELECT count(*)::int AS n FROM audit_log WHERE actor_id = $1 AND action = $2 AND created_at > now() - ($3 * interval '1 second')`,
    [userId, action, seconds],
  );
  return Number(recent.rows[0].n) >= max;
}

async function notify(client: Queryable, userId: string, kind: string, payload: Record<string, unknown>) {
  await client.query(`INSERT INTO notification (id, user_id, kind, payload) VALUES ($1, $2, $3, $4::jsonb)`, [randomUUID(), userId, kind, JSON.stringify(payload)]);
}

export async function isModerator(client: Queryable, userId: string) {
  const roles = await client.query(`SELECT 1 FROM user_role WHERE user_id = $1 AND role IN ('moderator', 'admin')`, [userId]);
  return roles.rows.length > 0;
}

async function isAdmin(client: Queryable, userId: string) {
  return (await client.query(`SELECT 1 FROM user_role WHERE user_id = $1 AND role = 'admin'`, [userId])).rows.length > 0;
}

// ---------- Feed and posts ----------

export async function feed(client: Queryable, viewerId: string, query: { cursor?: unknown; limit?: unknown; scope?: unknown; q?: unknown }) {
  const cursor = decodeCursor(query.cursor);
  if (cursor === 'invalid') return fail(400, 'Invalid cursor');
  const limit = parseLimit(query.limit);
  const params: unknown[] = [viewerId];
  let where = VISIBLE_POST;
  if (query.scope === 'following') where += ` AND (p.author_id = $1 OR EXISTS (SELECT 1 FROM user_follow uf WHERE uf.follower = $1 AND uf.followed = p.author_id))`;
  const search = parseSearch(query.q);
  if (search) {
    params.push(`%${search}%`);
    const mark = `$${params.length}`;
    where += ` AND (p.body ILIKE ${mark} OR pr.display_name ILIKE ${mark} OR u.handle ILIKE ${mark} OR EXISTS (SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE ${mark}))`;
  }
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    where += ` AND (p.created_at, p.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
  }
  params.push(limit + 1);
  const rows = (await client.query(`${POST_SELECT} WHERE ${where} ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`, params)).rows;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return {
    status: 200,
    body: { posts: page.map((row) => postView(row, viewerId)), nextCursor: rows.length > limit && last ? encodeCursor(iso(last.created_at), String(last.id)) : null },
  };
}

async function visiblePost(client: Queryable, viewerId: string, postId: unknown) {
  if (!isUuid(postId)) return null;
  return (await client.query(`${POST_SELECT} WHERE ${VISIBLE_POST} AND p.id = $2`, [viewerId, postId])).rows[0] ?? null;
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 1_500_000;

export async function createPost(client: Queryable, userId: string, input: unknown, images: { mime: string; bytes: Buffer }[] = []) {
  const playing = await participationGate(client, userId);
  if (!playing.ok) return fail(403, playing.error);
  const gate = await mutationGate(client, userId);
  if (!gate.ok) return fail(403, gate.error);
  const parsed = parsePostInput(input);
  if (!parsed) return fail(400, 'Write 1–2000 characters, choose who can see it, and use up to 5 tags of letters, numbers, or hyphens');
  if (images.length > 3) return fail(400, 'Attach at most 3 images');
  for (const image of images) {
    if (!IMAGE_TYPES.has(image.mime) || image.bytes.length === 0 || image.bytes.length > MAX_IMAGE_BYTES) {
      return fail(400, 'Each image must be a JPEG, PNG, WebP, or GIF under 1.5 MB');
    }
  }
  if (await limited(client, userId, 'post.create', 10, 60)) return fail(429, 'You are posting too quickly; wait a minute');
  const id = randomUUID();
  await client.query(`INSERT INTO post (id, author_id, body, visibility, tags) VALUES ($1, $2, $3, $4, $5)`, [id, userId, parsed.body, parsed.visibility, parsed.tags]);
  for (const image of images) {
    await client.query(`INSERT INTO post_image (id, post_id, mime, bytes) VALUES ($1, $2, $3, $4)`, [randomUUID(), id, image.mime, image.bytes]);
  }
  await audit(client, userId, 'post.create', 'post', id, { tags: parsed.tags, images: images.length });
  return { status: 201, body: { post: postView((await visiblePost(client, userId, id))!, userId) } };
}

export async function readPostImage(client: Queryable, viewerId: string, postId: unknown, imageId: unknown) {
  if (!isUuid(postId) || !isUuid(imageId)) return null;
  const found = await client.query(
    `SELECT i.mime, i.bytes FROM post_image i
     JOIN post p ON p.id = i.post_id
     JOIN app_user u ON u.id = p.author_id
     WHERE i.id = $2 AND p.id = $3 AND ${VISIBLE_POST}`,
    [viewerId, imageId, postId],
  );
  return found.rows[0] ?? null;
}

export async function getPost(client: Queryable, viewerId: string, postId: unknown) {
  const row = await visiblePost(client, viewerId, postId);
  if (!row) return fail(404, 'Post not found');
  const comments = await client.query(
    `SELECT c.id, c.body, c.created_at, c.author_id, cu.handle, cp.display_name, (cp.avatar_key IS NOT NULL) AS has_avatar
     FROM comment c JOIN app_user cu ON cu.id = c.author_id JOIN profile cp ON cp.user_id = cu.id
     WHERE c.post_id = $2 AND ${VISIBLE_COMMENT} ORDER BY c.created_at, c.id LIMIT 201`,
    [viewerId, postId],
  );
  return {
    status: 200,
    body: {
      post: postView(row, viewerId),
      comments: comments.rows.slice(0, 200).map((comment) => ({
        id: String(comment.id),
        author: { handle: String(comment.handle), displayName: String(comment.display_name), hasAvatar: Boolean(comment.has_avatar) },
        body: String(comment.body),
        createdAt: iso(comment.created_at),
        mine: String(comment.author_id) === viewerId,
      })),
      moreComments: comments.rows.length > 200,
    },
  };
}

/** Owner-only edits; anyone who cannot see the post gets 404, others who can see it get 403. */
async function ownPost(client: Queryable, userId: string, postId: unknown) {
  const row = await visiblePost(client, userId, postId);
  if (!row) return { error: fail(404, 'Post not found') };
  if (String(row.author_id) !== userId) return { error: fail(403, 'Only the author can change this post') };
  return { row };
}

export async function updatePost(client: Queryable, userId: string, postId: unknown, input: unknown) {
  const playing = await participationGate(client, userId);
  if (!playing.ok) return fail(403, playing.error);
  const patch = parsePostPatch(input);
  if (!patch) return fail(400, 'Write 1–2000 characters and choose who can see it');
  const owned = await ownPost(client, userId, postId);
  if (owned.error) return owned.error;
  if (await limited(client, userId, 'post.update', 20, 60)) return fail(429, 'Too many edits; wait a minute');
  await client.query(
    `UPDATE post SET body = COALESCE($2, body), visibility = COALESCE($3, visibility), updated_at = now() WHERE id = $1`,
    [postId, patch.body ?? null, patch.visibility ?? null],
  );
  await audit(client, userId, 'post.update', 'post', String(postId), { fields: Object.keys(patch) });
  return { status: 200, body: { post: postView((await visiblePost(client, userId, postId))!, userId) } };
}

export async function deletePost(client: Queryable, userId: string, postId: unknown) {
  const playing = await participationGate(client, userId);
  if (!playing.ok) return fail(403, playing.error);
  const owned = await ownPost(client, userId, postId);
  if (owned.error) return owned.error;
  await client.query(`UPDATE post SET status = 'deleted', updated_at = now() WHERE id = $1`, [postId]);
  await audit(client, userId, 'post.delete', 'post', String(postId));
  return { status: 200, body: { deleted: true } };
}

export async function setLike(client: Queryable, userId: string, postId: unknown, like: boolean) {
  const playing = await participationGate(client, userId);
  if (!playing.ok) return fail(403, playing.error);
  const row = await visiblePost(client, userId, postId);
  if (!row) return fail(404, 'Post not found');
  if (like) {
    const inserted = await client.query(`INSERT INTO reaction (post_id, user_id, kind) VALUES ($1, $2, 'like') ON CONFLICT DO NOTHING RETURNING post_id`, [postId, userId]);
    if (inserted.rows[0] && String(row.author_id) !== userId) await notify(client, String(row.author_id), 'like', { actorId: userId, postId });
  } else {
    await client.query(`DELETE FROM reaction WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
  }
  const fresh = (await visiblePost(client, userId, postId))!;
  return { status: 200, body: { likes: Number(fresh.likes), liked: Boolean(fresh.liked) } };
}

export async function addComment(client: Queryable, userId: string, postId: unknown, input: unknown) {
  const playing = await participationGate(client, userId);
  if (!playing.ok) return fail(403, playing.error);
  const body = cleanText((input as Record<string, unknown> | null)?.body, COMMENT_MAX);
  if (!body) return fail(400, 'Write a comment of 1–1000 characters');
  const row = await visiblePost(client, userId, postId);
  if (!row) return fail(404, 'Post not found');
  if (await limited(client, userId, 'comment.create', 20, 60)) return fail(429, 'You are commenting too quickly; wait a minute');
  const id = randomUUID();
  await client.query(`INSERT INTO comment (id, post_id, author_id, body) VALUES ($1, $2, $3, $4)`, [id, postId, userId, body]);
  await audit(client, userId, 'comment.create', 'comment', id, { postId });
  if (String(row.author_id) !== userId) await notify(client, String(row.author_id), 'comment', { actorId: userId, postId, commentId: id });
  return { status: 201, body: { id } };
}

export async function deleteComment(client: Queryable, userId: string, commentId: unknown) {
  const playing = await participationGate(client, userId);
  if (!playing.ok) return fail(403, playing.error);
  if (!isUuid(commentId)) return fail(404, 'Comment not found');
  const found = await client.query(
    `SELECT c.author_id FROM comment c JOIN app_user cu ON cu.id = c.author_id JOIN post p ON p.id = c.post_id JOIN app_user u ON u.id = p.author_id
     WHERE c.id = $2 AND ${VISIBLE_COMMENT} AND ${VISIBLE_POST}`,
    [userId, commentId],
  );
  if (!found.rows[0]) return fail(404, 'Comment not found');
  if (String(found.rows[0].author_id) !== userId) return fail(403, 'Only the author can delete this comment');
  await client.query(`UPDATE comment SET status = 'deleted' WHERE id = $1`, [commentId]);
  await audit(client, userId, 'comment.delete', 'comment', String(commentId));
  return { status: 200, body: { deleted: true } };
}

// ---------- Relationships ----------

async function userByHandle(client: Queryable, handle: unknown) {
  if (typeof handle !== 'string' || !/^[a-z0-9_]{3,24}$/i.test(handle)) return null;
  const found = await client.query(
    `SELECT u.id, u.handle, u.status, p.display_name, p.visibility FROM app_user u JOIN profile p ON p.user_id = u.id WHERE lower(u.handle) = lower($1)`,
    [handle],
  );
  return found.rows[0] ?? null;
}

async function relationshipState(client: Queryable, viewerId: string, targetId: string) {
  const result = await client.query(
    `SELECT
       EXISTS (SELECT 1 FROM user_follow WHERE follower = $1 AND followed = $2) AS following,
       EXISTS (SELECT 1 FROM user_follow WHERE follower = $2 AND followed = $1) AS followed_by,
       EXISTS (SELECT 1 FROM user_block WHERE blocker = $1 AND blocked = $2) AS blocking,
       EXISTS (SELECT 1 FROM user_block WHERE blocker = $2 AND blocked = $1) AS blocked_by,
       (SELECT status FROM friend_request WHERE sender = $1 AND recipient = $2) AS outgoing,
       (SELECT status FROM friend_request WHERE sender = $2 AND recipient = $1) AS incoming`,
    [viewerId, targetId],
  );
  const row = result.rows[0];
  const friend = row.outgoing === 'accepted' || row.incoming === 'accepted' ? 'friends' : row.incoming === 'pending' ? 'incoming' : row.outgoing === 'pending' ? 'outgoing' : 'none';
  return { following: Boolean(row.following), followedBy: Boolean(row.followed_by), blocking: Boolean(row.blocking), blockedBy: Boolean(row.blocked_by), friend };
}

export async function getRelationship(client: Queryable, viewerId: string, handle: unknown) {
  const target = await userByHandle(client, handle);
  if (!target || target.status === 'deleted' || String(target.id) === viewerId) return fail(404, 'Player not found');
  const state = await relationshipState(client, viewerId, String(target.id));
  if (state.blockedBy) return fail(404, 'Player not found');
  const { blockedBy: _hidden, ...visible } = state;
  return { status: 200, body: { handle: String(target.handle), ...visible } };
}

export async function changeRelationship(client: Queryable, viewerId: string, handle: unknown, input: unknown) {
  const playing = await participationGate(client, viewerId);
  if (!playing.ok) return fail(403, playing.error);
  const gate = await mutationGate(client, viewerId);
  if (!gate.ok) return fail(403, gate.error);
  const action = (input as Record<string, unknown> | null)?.action as RelationshipAction;
  if (!RELATIONSHIP_ACTIONS.includes(action)) return fail(400, 'Unknown action');
  const target = await userByHandle(client, handle);
  if (!target || target.status === 'deleted' || String(target.id) === viewerId) return fail(404, 'Player not found');
  const targetId = String(target.id);
  const state = await relationshipState(client, viewerId, targetId);
  const reaching = action === 'follow' || action === 'friend' || action === 'accept';
  if (reaching) {
    const visible = canViewProfile({ viewerId, ownerId: targetId, visibility: target.visibility as Visibility, friends: state.friend === 'friends', ownerStatus: String(target.status) });
    if (state.blockedBy || (!visible && action !== 'accept')) return fail(404, 'Player not found');
    if (state.blocking) return fail(409, 'Unblock this player first');
  }
  if (await limited(client, viewerId, 'relationship.change', 60, 60)) return fail(429, 'Too many changes; wait a minute');

  if (action === 'follow') {
    const inserted = await client.query(`INSERT INTO user_follow (follower, followed) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING follower`, [viewerId, targetId]);
    if (inserted.rows[0]) await notify(client, targetId, 'follow', { actorId: viewerId });
  } else if (action === 'unfollow') {
    await client.query(`DELETE FROM user_follow WHERE follower = $1 AND followed = $2`, [viewerId, targetId]);
  } else if (action === 'friend') {
    if (state.friend === 'incoming') return changeRelationship(client, viewerId, handle, { action: 'accept' });
    if (state.friend === 'none') {
      if (await limited(client, viewerId, 'friend.request', 10, 3600)) return fail(429, 'Too many friend requests; try again later');
      await client.query(
        `INSERT INTO friend_request (sender, recipient, status) VALUES ($1, $2, 'pending')
         ON CONFLICT (sender, recipient) DO UPDATE SET status = 'pending', created_at = now()`,
        [viewerId, targetId],
      );
      await client.query(`DELETE FROM friend_request WHERE sender = $1 AND recipient = $2 AND status = 'declined'`, [targetId, viewerId]);
      await audit(client, viewerId, 'friend.request', 'app_user', targetId);
      await notify(client, targetId, 'friend_request', { actorId: viewerId });
    }
  } else if (action === 'accept') {
    const accepted = await client.query(
      `UPDATE friend_request SET status = 'accepted' WHERE sender = $2 AND recipient = $1 AND status = 'pending' RETURNING sender`,
      [viewerId, targetId],
    );
    if (!accepted.rows[0]) return fail(409, 'There is no friend request to accept');
    await client.query(`DELETE FROM friend_request WHERE sender = $1 AND recipient = $2`, [viewerId, targetId]);
    await notify(client, targetId, 'friend_accept', { actorId: viewerId });
  } else if (action === 'decline') {
    await client.query(`UPDATE friend_request SET status = 'declined' WHERE sender = $2 AND recipient = $1 AND status = 'pending'`, [viewerId, targetId]);
  } else if (action === 'unfriend') {
    await client.query(
      `DELETE FROM friend_request WHERE (sender = $1 AND recipient = $2) OR (sender = $2 AND recipient = $1 AND status = 'accepted')`,
      [viewerId, targetId],
    );
  } else if (action === 'block') {
    await client.query(`INSERT INTO user_block (blocker, blocked) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [viewerId, targetId]);
    await client.query(`DELETE FROM user_follow WHERE (follower = $1 AND followed = $2) OR (follower = $2 AND followed = $1)`, [viewerId, targetId]);
    await client.query(`DELETE FROM friend_request WHERE (sender = $1 AND recipient = $2) OR (sender = $2 AND recipient = $1)`, [viewerId, targetId]);
  } else if (action === 'unblock') {
    await client.query(`DELETE FROM user_block WHERE blocker = $1 AND blocked = $2`, [viewerId, targetId]);
  }
  await audit(client, viewerId, 'relationship.change', 'app_user', targetId, { action });
  const { blockedBy: _hidden, ...visible } = await relationshipState(client, viewerId, targetId);
  return { status: 200, body: { handle: String(target.handle), ...visible } };
}

export async function relationships(client: Queryable, userId: string) {
  const list = async (sql: string) =>
    (await client.query(sql, [userId])).rows.map((row) => ({ handle: String(row.handle), displayName: String(row.display_name) }));
  const person = `SELECT u.handle, p.display_name FROM app_user u JOIN profile p ON p.user_id = u.id WHERE u.status <> 'deleted' AND`;
  return {
    status: 200,
    body: {
      friends: await list(`${person} u.id IN (SELECT CASE WHEN sender = $1 THEN recipient ELSE sender END FROM friend_request WHERE status = 'accepted' AND $1 IN (sender, recipient)) ORDER BY u.handle`),
      incoming: await list(`${person} u.id IN (SELECT sender FROM friend_request WHERE recipient = $1 AND status = 'pending') ORDER BY u.handle`),
      outgoing: await list(`${person} u.id IN (SELECT recipient FROM friend_request WHERE sender = $1 AND status = 'pending') ORDER BY u.handle`),
      following: await list(`${person} u.id IN (SELECT followed FROM user_follow WHERE follower = $1) ORDER BY u.handle`),
      followers: await list(`${person} u.id IN (SELECT follower FROM user_follow WHERE followed = $1) ORDER BY u.handle`),
      blocked: await list(`${person} u.id IN (SELECT blocked FROM user_block WHERE blocker = $1) ORDER BY u.handle`),
    },
  };
}

// ---------- Game invitations ----------

/** Only the host of an open room may invite, and only a friend who has not blocked them (or been blocked). */
export async function inviteToRoom(client: Queryable, userId: string, input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const code = typeof raw.code === 'string' ? raw.code.trim().toUpperCase() : '';
  const room = await client.query(`SELECT code FROM room WHERE code = $1 AND host_id = $2 AND status = 'open'`, [code, userId]);
  if (!room.rows[0]) return fail(404, 'Open a private room before inviting');
  const target = await userByHandle(client, raw.handle);
  if (!target || target.status !== 'active' || String(target.id) === userId) return fail(404, 'Player not found');
  const state = await relationshipState(client, userId, String(target.id));
  if (state.blockedBy || state.blocking) return fail(404, 'Player not found');
  if (state.friend !== 'friends') return fail(403, 'You can only invite friends');
  if (await limited(client, userId, 'room.invite', 10, 600)) return fail(429, 'Too many invitations; try again later');
  await notify(client, String(target.id), 'room_invite', { actorId: userId, code });
  await audit(client, userId, 'room.invite', 'app_user', String(target.id), { code });
  return { status: 200, body: { invited: String(target.handle), code } };
}

// ---------- Notifications ----------

export async function notifications(client: Queryable, userId: string, query: { cursor?: unknown; limit?: unknown }) {
  const cursor = decodeCursor(query.cursor);
  if (cursor === 'invalid') return fail(400, 'Invalid cursor');
  const limit = parseLimit(query.limit);
  const params: unknown[] = [userId];
  let where = `n.user_id = $1 AND (a.id IS NULL OR (a.status <> 'deleted' AND NOT ${blocked('$1', 'a.id')}))`;
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    where += ` AND (n.created_at, n.id) < ($2::timestamptz, $3::uuid)`;
  }
  params.push(limit + 1);
  const rows = (
    await client.query(
      `SELECT n.id, n.kind, n.payload, n.created_at, n.read_at, a.handle, ap.display_name
       FROM notification n
       LEFT JOIN app_user a ON a.id = (n.payload->>'actorId')::uuid
       LEFT JOIN profile ap ON ap.user_id = a.id
       WHERE ${where} ORDER BY n.created_at DESC, n.id DESC LIMIT $${params.length}`,
      params,
    )
  ).rows;
  const unread = await client.query(`SELECT count(*)::int AS n FROM notification WHERE user_id = $1 AND read_at IS NULL`, [userId]);
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return {
    status: 200,
    body: {
      unread: Number(unread.rows[0].n),
      notifications: page.map((row) => {
        const payload = (typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload) as Record<string, unknown>;
        const { actorId: _actor, ...details } = payload;
        return {
          id: String(row.id),
          kind: String(row.kind),
          actor: row.handle ? { handle: String(row.handle), displayName: String(row.display_name) } : null,
          details,
          createdAt: iso(row.created_at),
          read: row.read_at !== null,
        };
      }),
      nextCursor: rows.length > limit && last ? encodeCursor(iso(last.created_at), String(last.id)) : null,
    },
  };
}

export async function markRead(client: Queryable, userId: string, input: unknown) {
  const ids = (input as Record<string, unknown> | null)?.ids;
  if (ids === 'all') {
    await client.query(`UPDATE notification SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`, [userId]);
  } else if (Array.isArray(ids) && ids.length <= 50 && ids.every(isUuid)) {
    await client.query(`UPDATE notification SET read_at = now() WHERE user_id = $1 AND read_at IS NULL AND id = ANY($2::uuid[])`, [userId, ids]);
  } else {
    return fail(400, 'Choose notifications to mark as read');
  }
  const unread = await client.query(`SELECT count(*)::int AS n FROM notification WHERE user_id = $1 AND read_at IS NULL`, [userId]);
  return { status: 200, body: { unread: Number(unread.rows[0].n) } };
}

// ---------- Reports and moderation ----------

/** Resolves a reportable subject the reporter can actually see; returns the user it concerns, if any. */
async function reportableSubject(client: Queryable, reporterId: string, report: NonNullable<ReturnType<typeof parseReport>>) {
  if (report.subjectType === 'user') {
    const target = await userByHandle(client, report.handle);
    if (!target || target.status === 'deleted' || String(target.id) === reporterId) return null;
    return { subjectId: String(target.id) };
  }
  if (report.subjectType === 'post') {
    const row = await visiblePost(client, reporterId, report.subjectId);
    return row && String(row.author_id) !== reporterId ? { subjectId: report.subjectId } : null;
  }
  if (report.subjectType === 'comment') {
    const found = await client.query(
      `SELECT c.author_id FROM comment c JOIN app_user cu ON cu.id = c.author_id JOIN post p ON p.id = c.post_id JOIN app_user u ON u.id = p.author_id
       WHERE c.id = $2 AND ${VISIBLE_COMMENT} AND ${VISIBLE_POST}`,
      [reporterId, report.subjectId],
    );
    return found.rows[0] && String(found.rows[0].author_id) !== reporterId ? { subjectId: report.subjectId } : null;
  }
  const member = await client.query(`SELECT 1 FROM match_player WHERE match_id = $1 AND user_id = $2`, [report.subjectId, reporterId]);
  return member.rows[0] ? { subjectId: report.subjectId } : null;
}

export async function createReport(client: Queryable, reporterId: string, input: unknown) {
  const parsed = parseReport(input);
  if (!parsed) return fail(400, 'Choose what to report and give a reason of 3–500 characters');
  const subject = await reportableSubject(client, reporterId, parsed);
  if (!subject) return fail(404, 'Nothing to report there');
  if (await limited(client, reporterId, 'report.create', 10, 3600)) return fail(429, 'Too many reports; try again later');
  const existing = await client.query(
    `SELECT id FROM report WHERE reporter_id = $1 AND subject_type = $2 AND subject_id = $3 AND status IN ('open', 'reviewing')`,
    [reporterId, parsed.subjectType, subject.subjectId],
  );
  if (existing.rows[0]) return { status: 200, body: { status: 'open', duplicate: true } };
  const id = randomUUID();
  await client.query(`INSERT INTO report (id, reporter_id, subject_type, subject_id, reason) VALUES ($1, $2, $3, $4, $5)`, [
    id,
    reporterId,
    parsed.subjectType,
    subject.subjectId,
    parsed.reason,
  ]);
  await audit(client, reporterId, 'report.create', parsed.subjectType, subject.subjectId, { reportId: id });
  const moderators = await client.query(`SELECT DISTINCT r.user_id FROM user_role r JOIN app_user u ON u.id = r.user_id WHERE r.role IN ('moderator', 'admin') AND u.status = 'active' AND r.user_id <> $1`, [reporterId]);
  for (const moderator of moderators.rows) await notify(client, String(moderator.user_id), 'report', { actorId: reporterId, reportId: id, subjectType: parsed.subjectType });
  return { status: 201, body: { status: 'open', duplicate: false } };
}

/** The user a subject concerns: a user directly, or the author of a post or comment. */
async function subjectOwner(client: Queryable, subjectType: ReportSubject, subjectId: string) {
  const sql: Record<ReportSubject, string | null> = {
    user: `SELECT id FROM app_user WHERE id = $1`,
    post: `SELECT author_id AS id FROM post WHERE id = $1`,
    comment: `SELECT author_id AS id FROM comment WHERE id = $1`,
    match: null,
  };
  const query = sql[subjectType];
  if (!query) return null;
  const row = (await client.query(query, [subjectId])).rows[0];
  return row ? String(row.id) : null;
}

async function subjectSummary(client: Queryable, subjectType: string, subjectId: string) {
  if (subjectType === 'post' || subjectType === 'comment') {
    const table = subjectType === 'post' ? 'post' : 'comment';
    const row = (await client.query(`SELECT t.body, t.status, u.handle${subjectType === 'comment' ? ', t.post_id' : ''} FROM ${table} t JOIN app_user u ON u.id = t.author_id WHERE t.id = $1`, [subjectId])).rows[0];
    if (!row) return null;
    return { text: String(row.body).slice(0, 280), status: String(row.status), author: String(row.handle), postId: row.post_id ? String(row.post_id) : subjectType === 'post' ? subjectId : null };
  }
  if (subjectType === 'user') {
    const row = (await client.query(`SELECT handle, status FROM app_user WHERE id = $1`, [subjectId])).rows[0];
    return row ? { text: `@${row.handle}`, status: String(row.status), author: String(row.handle), postId: null } : null;
  }
  const row = (await client.query(`SELECT status FROM match WHERE id = $1`, [subjectId])).rows[0];
  return row ? { text: `Match ${subjectId}`, status: String(row.status), author: null, postId: null } : null;
}

export async function moderationQueue(client: Queryable, moderatorId: string, query: { status?: unknown }) {
  if (!(await isModerator(client, moderatorId))) return fail(403, 'Moderators only');
  const open = query.status !== 'closed';
  const reports = await client.query(
    `SELECT r.id, r.subject_type, r.subject_id, r.reason, r.status, r.created_at, r.resolution, r.resolved_at, u.handle AS reporter, m.handle AS resolver
     FROM report r JOIN app_user u ON u.id = r.reporter_id LEFT JOIN app_user m ON m.id = r.resolved_by
     WHERE r.status ${open ? `IN ('open', 'reviewing')` : `IN ('resolved', 'dismissed')`}
     ORDER BY r.created_at ${open ? 'ASC' : 'DESC'} LIMIT 50`,
  );
  const items = [];
  for (const row of reports.rows) {
    items.push({
      id: String(row.id),
      subjectType: String(row.subject_type),
      subjectId: String(row.subject_id),
      subject: await subjectSummary(client, String(row.subject_type), String(row.subject_id)),
      reason: String(row.reason),
      status: String(row.status),
      reporter: String(row.reporter),
      createdAt: iso(row.created_at),
      resolution: row.resolution ? String(row.resolution) : null,
      resolvedBy: row.resolver ? String(row.resolver) : null,
      resolvedAt: row.resolved_at ? iso(row.resolved_at) : null,
    });
  }
  return { status: 200, body: { reports: items } };
}

export async function moderate(client: Queryable, moderatorId: string, input: unknown) {
  if (!(await isModerator(client, moderatorId))) return fail(403, 'Moderators only');
  const parsed = parseModeration(input);
  if (!parsed) return fail(400, 'Choose an action and give a reason of 3–500 characters');
  let reportId: string | null = null;
  let subjectType: ReportSubject;
  let subjectId: string;
  if ('reportId' in parsed && parsed.reportId) {
    const report = (await client.query(`SELECT subject_type, subject_id, status, reporter_id FROM report WHERE id = $1 FOR UPDATE`, [parsed.reportId])).rows[0];
    if (!report) return fail(404, 'Report not found');
    if (report.status !== 'open' && report.status !== 'reviewing') return fail(409, 'This report is already closed');
    reportId = parsed.reportId;
    subjectType = report.subject_type as ReportSubject;
    subjectId = String(report.subject_id);
  } else {
    subjectType = (parsed as { subjectType: ReportSubject }).subjectType;
    subjectId = (parsed as { subjectId: string }).subjectId;
  }
  const action: ModerationAction = parsed.action;
  if (!actionFits(action, subjectType)) return fail(400, 'That action does not apply to this report');

  const owner = await subjectOwner(client, subjectType, subjectId);
  if (action === 'hide' || action === 'restore') {
    const table = subjectType === 'post' ? 'post' : 'comment';
    const [from, to] = action === 'hide' ? ['visible', 'hidden'] : ['hidden', 'visible'];
    const changed = await client.query(`UPDATE ${table} SET status = $2 WHERE id = $1 AND status = $3 RETURNING id`, [subjectId, to, from]);
    if (!changed.rows[0]) return fail(409, action === 'hide' ? 'That content is not visible' : 'That content is not hidden');
  } else if (action === 'suspend' || action === 'unsuspend') {
    if (!owner) return fail(404, 'Player not found');
    if (owner === moderatorId) return fail(403, 'You cannot moderate your own account');
    if (action === 'suspend' && (await isModerator(client, owner)) && !(await isAdmin(client, moderatorId))) return fail(403, 'Only an admin can suspend a moderator');
    const [from, to] = action === 'suspend' ? ['active', 'suspended'] : ['suspended', 'active'];
    const changed = await client.query(`UPDATE app_user SET status = $2 WHERE id = $1 AND status = $3 RETURNING id`, [owner, to, from]);
    if (!changed.rows[0]) return fail(409, action === 'suspend' ? 'That player is not active' : 'That player is not suspended');
    if (action === 'suspend') {
      await client.query(`DELETE FROM queue_entry WHERE user_id = $1 AND status = 'waiting'`, [owner]);
      await client.query(`UPDATE room SET status = 'cancelled' WHERE host_id = $1 AND status = 'open'`, [owner]);
    }
  }

  const actionId = randomUUID();
  await client.query(
    `INSERT INTO moderation_action (id, report_id, actor_id, action, reason, subject_type, subject_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [actionId, reportId, moderatorId, action, parsed.reason, subjectType, subjectId],
  );
  await audit(client, moderatorId, `moderation.${action}`, subjectType, subjectId, { reportId, reason: parsed.reason, affectedUser: owner });
  if (reportId) {
    await client.query(`UPDATE report SET status = $2, resolved_by = $3, resolved_at = now(), resolution = $4 WHERE id = $1`, [
      reportId,
      action === 'dismiss' ? 'dismissed' : 'resolved',
      moderatorId,
      action,
    ]);
    const reporter = (await client.query(`SELECT reporter_id FROM report WHERE id = $1`, [reportId])).rows[0];
    await notify(client, String(reporter.reporter_id), 'report_closed', { reportId, outcome: action === 'dismiss' ? 'dismissed' : 'actioned' });
  }
  if (owner && action !== 'resolve' && action !== 'dismiss') await notify(client, owner, 'moderation', { action, subjectType, subjectId });
  return { status: 200, body: { actionId, action, subjectType, subjectId, reportId } };
}

export async function auditTrail(client: Queryable, moderatorId: string) {
  if (!(await isModerator(client, moderatorId))) return fail(403, 'Moderators only');
  const rows = await client.query(
    `SELECT a.id, a.action, a.subject_type, a.subject_id, a.metadata, a.created_at, u.handle
     FROM audit_log a LEFT JOIN app_user u ON u.id = a.actor_id
     WHERE a.action LIKE 'moderation.%' OR a.action LIKE 'report.%' OR a.action LIKE 'role.%'
     ORDER BY a.created_at DESC, a.id DESC LIMIT 100`,
  );
  return {
    status: 200,
    body: {
      entries: rows.rows.map((row) => {
        const metadata = (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) as Record<string, unknown>;
        return {
          id: String(row.id),
          action: String(row.action),
          actor: row.handle ? String(row.handle) : 'operator',
          subjectType: String(row.subject_type),
          subjectId: String(row.subject_id),
          reason: typeof metadata.reason === 'string' ? metadata.reason : null,
          reportId: typeof metadata.reportId === 'string' ? metadata.reportId : null,
          createdAt: iso(row.created_at),
        };
      }),
    },
  };
}
