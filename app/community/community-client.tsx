'use client';

import Link from 'next/link';
import { useState } from 'react';
import { callApi } from '../components/call-api';

type Post = {
  id: string;
  author: { handle: string; displayName: string };
  body: string;
  visibility: string;
  createdAt: string;
  edited: boolean;
  likes: number;
  liked: boolean;
  comments: number;
  mine: boolean;
};

export function Compose({ suspended }: { suspended: boolean }) {
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (suspended) return <p className="note">Your account is suspended; you can read the feed but not post.</p>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const { ok, data } = await callApi<{ post?: Post; error?: string }>('/api/posts', { method: 'POST', body: { body, visibility } });
    setBusy(false);
    if (ok && data.post) location.assign(`/community/${data.post.id}`);
    else setError(data.error ?? 'Could not publish');
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <label>
        New post
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={4} required />
      </label>
      <label>
        Who can see it
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          <option value="public">Everyone</option>
          <option value="friends">Friends</option>
          <option value="private">Only me</option>
        </select>
      </label>
      <button disabled={busy || body.trim().length === 0} type="submit">{busy ? 'Publishing…' : 'Publish'}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

export function PostCard({ post, href, readonly }: { post: Post; href?: boolean; readonly?: boolean }) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(post.liked);

  async function toggle() {
    const { ok, data } = await callApi<{ likes: number; liked: boolean }>(`/api/posts/${post.id}/like`, { method: liked ? 'DELETE' : 'POST' });
    if (ok) {
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  return (
    <article className="panel stack">
      <p className="note">
        <Link href={`/players/${post.author.handle}`}>{post.author.displayName}</Link>
        {' · '}@{post.author.handle}
        {post.visibility !== 'public' && ` · ${post.visibility}`}
        {post.edited && ' · edited'}
      </p>
      <p className="post-body">{post.body}</p>
      <div className="row">
        {readonly ? <span>{likes} likes</span> : <button className="secondary" type="button" onClick={toggle}>{liked ? 'Unlike' : 'Like'} ({likes})</button>}
        {href && <Link href={`/community/${post.id}`}>{post.comments} comments</Link>}
      </div>
    </article>
  );
}

export function Feed({ initial, nextCursor, scope, readonly }: { initial: Post[]; nextCursor: string | null; scope: string; readonly?: boolean }) {
  const [posts, setPosts] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [busy, setBusy] = useState(false);

  async function more() {
    if (!cursor) return;
    setBusy(true);
    const query = new URLSearchParams({ cursor, limit: '20' });
    if (scope === 'following') query.set('scope', 'following');
    const { ok, data } = await callApi<{ posts: Post[]; nextCursor: string | null }>(`/api/feed?${query}`);
    setBusy(false);
    if (ok) {
      setPosts((current) => [...current, ...data.posts]);
      setCursor(data.nextCursor);
    }
  }

  return (
    <>
      {posts.length === 0 && <p className="note">No posts yet.</p>}
      <ol className="list">
        {posts.map((post) => (
          <li key={post.id}><PostCard post={post} href readonly={readonly} /></li>
        ))}
      </ol>
      {cursor && <button className="secondary" disabled={busy} onClick={more}>Older posts</button>}
    </>
  );
}
