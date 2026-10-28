'use client';

import { useState } from 'react';
import { callApi } from '../../components/call-api';
import { PostCard } from '../community-client';

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

type Comment = { id: string; author: { handle: string; displayName: string }; body: string; createdAt: string; mine: boolean };

export function Thread({ post, comments, suspended, readonly }: { post: Post; comments: Comment[]; suspended: boolean; readonly?: boolean }) {
  const [items, setItems] = useState(comments);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [gone, setGone] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await callApi<{ id?: string; error?: string }>(`/api/posts/${post.id}/comments`, { method: 'POST', body: { body: text } });
    if (ok && data.id) {
      setItems((current) => [...current, { id: data.id!, author: { handle: 'you', displayName: 'You' }, body: text, createdAt: new Date().toISOString(), mine: true }]);
      setText('');
      setError('');
    } else setError(data.error ?? 'Could not comment');
  }

  async function removeComment(id: string) {
    const { ok } = await callApi(`/api/comments/${id}`, { method: 'DELETE' });
    if (ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  async function removePost() {
    const { ok } = await callApi(`/api/posts/${post.id}`, { method: 'DELETE' });
    if (ok) setGone(true);
  }

  if (gone) return <p className="note">This post was deleted.</p>;

  return (
    <>
      <PostCard post={post} readonly={readonly || suspended} />
      {post.mine && !suspended && !readonly && <button className="secondary" type="button" onClick={removePost}>Delete post</button>}
      <ol className="list">
        {items.map((comment) => (
          <li key={comment.id} className="panel">
            <p className="note">{comment.author.displayName} · @{comment.author.handle}</p>
            <p className="post-body">{comment.body}</p>
            {comment.mine && !suspended && !readonly && <button className="secondary" type="button" onClick={() => removeComment(comment.id)}>Delete</button>}
          </li>
        ))}
      </ol>
      {!post.mine && !suspended && !readonly && (
        <form
          className="panel stack"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;
            const { ok, data } = await callApi<{ error?: string }>('/api/reports', { method: 'POST', body: { subjectType: 'post', subjectId: post.id, reason } });
            setError(ok ? 'Report sent to moderators.' : data.error ?? 'Could not report');
          }}
        >
          <label>
            Report this post
            <input name="reason" minLength={3} maxLength={500} required />
          </label>
          <button className="secondary" type="submit">Send report</button>
        </form>
      )}
      {readonly ? (
        <p className="note">Guests can read posts. Playing, posting, likes, and comments are for players.</p>
      ) : suspended ? (
        <p className="note">Your account is suspended; you cannot comment.</p>
      ) : (
        <form className="panel stack" onSubmit={send}>
          <label>
            Comment
            <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} rows={3} required />
          </label>
          <button disabled={text.trim().length === 0} type="submit">Reply</button>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      )}
    </>
  );
}
