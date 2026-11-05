'use client';

import { useState } from 'react';
import { callApi } from '../../components/call-api';
import { AuthorChip, PostCard, type Post } from '../community-client';
import { copy, type Lang } from '@/lib/i18n';

type Comment = { id: string; author: { handle: string; displayName: string; hasAvatar?: boolean }; body: string; createdAt: string; mine: boolean };

export function Thread({ post, comments, suspended, readonly, lang = 'en' }: { post: Post; comments: Comment[]; suspended: boolean; readonly?: boolean; lang?: Lang }) {
  const labels = copy(lang).community;
  const zh = lang === 'zh';
  const [items, setItems] = useState(comments);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [gone, setGone] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await callApi<{ id?: string; error?: string }>(`/api/posts/${post.id}/comments`, { method: 'POST', body: { body: text } });
    if (ok && data.id) {
      setItems((current) => [...current, { id: data.id!, author: { handle: '', displayName: zh ? '你' : 'You', hasAvatar: false }, body: text, createdAt: new Date().toISOString(), mine: true }]);
      setText('');
      setError('');
    } else setError(data.error ?? (zh ? '无法评论' : 'Could not comment'));
  }

  async function removeComment(id: string) {
    const { ok } = await callApi(`/api/comments/${id}`, { method: 'DELETE' });
    if (ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  async function removePost() {
    const { ok } = await callApi(`/api/posts/${post.id}`, { method: 'DELETE' });
    if (ok) setGone(true);
  }

  if (gone) return <p className="note">{zh ? '这篇帖子已删除。' : 'This post was deleted.'}</p>;

  return (
    <>
      <PostCard lang={lang} post={post} readonly={readonly || suspended} />
      {post.mine && !suspended && !readonly && <button className="secondary" type="button" onClick={removePost}>{zh ? '删除帖子' : 'Delete post'}</button>}
      <ol className="list">
        {items.map((comment) => (
          <li key={comment.id} className="panel">
            <p className="note">{comment.author.handle ? <AuthorChip author={comment.author} /> : <strong>{comment.author.displayName}</strong>}</p>
            <p className="post-body">{comment.body}</p>
            {comment.mine && !suspended && !readonly && <button className="secondary" type="button" onClick={() => removeComment(comment.id)}>{zh ? '删除' : 'Delete'}</button>}
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
            setError(ok ? (zh ? '已交给版主。' : 'Report sent to moderators.') : data.error ?? (zh ? '无法举报' : 'Could not report'));
          }}
        >
          <label>
            {zh ? '举报这篇帖子' : 'Report this post'}
            <input name="reason" minLength={3} maxLength={500} required />
          </label>
          <button className="secondary" type="submit">{zh ? '发送举报' : 'Send report'}</button>
        </form>
      )}
      {readonly ? (
        <p className="note">{labels.guestsRead}</p>
      ) : suspended ? (
        <p className="note">{zh ? '账号已封禁，不能评论。' : 'Your account is suspended; you cannot comment.'}</p>
      ) : (
        <form className="panel stack" onSubmit={send}>
          <label>
            {zh ? '评论' : 'Comment'}
            <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} rows={3} required />
          </label>
          <button disabled={text.trim().length === 0} type="submit">{zh ? '回复' : 'Reply'}</button>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      )}
    </>
  );
}
