'use client';

import Link from 'next/link';
import { useState } from 'react';
import { callApi } from '../components/call-api';
import { copy, type Lang } from '@/lib/i18n';

type Author = { handle: string; displayName: string; hasAvatar?: boolean };

export function AuthorChip({ author }: { author: Author }) {
  const [photo, setPhoto] = useState(Boolean(author.hasAvatar));
  const initial = author.displayName.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <Link className="author" href={`/players/${author.handle}`}>
      {photo
        ? <img className="avatar" src={`/api/players/${author.handle}/avatar`} alt="" onError={() => setPhoto(false)} />
        : <span className="avatar fallback" aria-hidden="true">{initial}</span>}
      {author.displayName}
    </Link>
  );
}

export type Post = {
  id: string;
  author: Author;
  body: string;
  tags?: string[];
  images?: string[];
  visibility: string;
  createdAt: string;
  edited: boolean;
  likes: number;
  liked: boolean;
  comments: number;
  mine: boolean;
};

export function Compose({ suspended, lang }: { suspended: boolean; lang: Lang }) {
  const text = copy(lang).community;
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (suspended) return <p className="note">{text.suspended}</p>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData();
    form.set('body', body);
    form.set('visibility', visibility);
    form.set('tags', tags);
    for (const file of files.slice(0, 3)) form.append('images', file);
    try {
      const response = await fetch('/api/posts', { method: 'POST', body: form });
      const data = (await response.json().catch(() => ({}))) as { post?: Post; error?: string };
      setBusy(false);
      if (response.ok && data.post) location.assign(`/community/${data.post.id}`);
      else setError(data.error ?? (lang === 'zh' ? '无法发布' : 'Could not publish'));
    } catch {
      setBusy(false);
      setError(lang === 'zh' ? '连接中断，请再试一次' : 'Connection lost; try again');
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <label>
        {text.newPost}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={4} required />
      </label>
      <label>
        {text.tags}
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={lang === 'zh' ? '啮鼠, 森林, 开局' : 'mouse, forest, opener'} maxLength={120} />
      </label>
      <label className="note">
        {text.images}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 3))}
        />
      </label>
      {files.length > 0 && <p className="note">{files.map((file) => file.name).join(', ')}</p>}
      <label>
        {text.who}
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          <option value="public">{text.public}</option>
          <option value="friends">{text.friends}</option>
          <option value="private">{text.private}</option>
        </select>
      </label>
      <button disabled={busy || body.trim().length === 0 || suspended} type="submit">{busy ? text.publishing : text.publish}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

export function PostCard({ post, href, readonly, lang = 'en' }: { post: Post; href?: boolean; readonly?: boolean; lang?: Lang }) {
  const text = copy(lang).community;
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
        <AuthorChip author={post.author} />
        {post.visibility !== 'public' && ` · ${post.visibility === 'friends' ? text.friends : post.visibility === 'private' ? text.private : post.visibility}`}
        {post.edited && (lang === 'zh' ? ' · 已编辑' : ' · edited')}
      </p>
      <p className="post-body">{post.body}</p>
      {post.tags && post.tags.length > 0 && (
        <p className="tag-row">
          {post.tags.map((tag) => <Link key={tag} href={`/community?q=${encodeURIComponent(tag)}`}>#{tag}</Link>)}
        </p>
      )}
      {post.images && post.images.length > 0 && (
        <div className="post-images">
          {post.images.map((imageId) => <img key={imageId} src={`/api/posts/${post.id}/images/${imageId}`} alt="" />)}
        </div>
      )}
      <div className="row">
        {readonly ? <span>{likes} {text.like}</span> : <button className="secondary" type="button" onClick={toggle}>{liked ? text.unlike : text.like} ({likes})</button>}
        {href && <Link href={`/community/${post.id}`}>{post.comments} {text.comments}</Link>}
      </div>
    </article>
  );
}

export function Feed({ initial, nextCursor, scope, search = '', readonly, lang = 'en' }: { initial: Post[]; nextCursor: string | null; scope: string; search?: string; readonly?: boolean; lang?: Lang }) {
  const [posts, setPosts] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [busy, setBusy] = useState(false);

  async function more() {
    if (!cursor) return;
    setBusy(true);
    const query = new URLSearchParams({ cursor, limit: '20' });
    if (scope === 'following') query.set('scope', 'following');
    if (search) query.set('q', search);
    const { ok, data } = await callApi<{ posts: Post[]; nextCursor: string | null }>(`/api/feed?${query}`);
    setBusy(false);
    if (ok) {
      setPosts((current) => [...current, ...data.posts]);
      setCursor(data.nextCursor);
    }
  }

  return (
    <>
      {posts.length === 0 && <p className="note">{copy(lang).community.empty}</p>}
      <ol className="list">
        {posts.map((post) => (
          <li key={post.id}><PostCard lang={lang} post={post} href readonly={readonly} /></li>
        ))}
      </ol>
      {cursor && <button className="secondary" disabled={busy} onClick={more}>{lang === 'zh' ? '更早的帖子' : 'Older posts'}</button>}
    </>
  );
}
