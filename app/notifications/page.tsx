import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { notifications } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { MarkRead } from './inbox-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KIND: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'followed you',
  friend_request: 'sent a friend request',
  friend_accept: 'accepted your friend request',
  room_invite: 'invited you to a private room',
  report: 'filed a report',
  report_closed: 'closed a report you filed',
  moderation: 'took a moderation action that affects you',
};

export default async function NotificationsPage() {
  const { email, data } = await pageActor((client, userId) => notifications(client, userId, {}));
  if (data.status !== 200) return null;
  const inbox = data.body;
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <h1>Notifications</h1>
        <p className="note">{inbox.unread} unread</p>
        <MarkRead />
        {inbox.notifications.length === 0 && <p className="note">Nothing yet.</p>}
        <ol className="list">
          {inbox.notifications.map((item) => (
            <li key={item.id} className="panel list-row">
              <span>{item.read ? '' : '● '}{item.actor ? <Link href={`/players/${item.actor.handle}`}>{item.actor.displayName}</Link> : 'A moderator'} {KIND[item.kind] ?? item.kind}</span>
              {typeof item.details.postId === 'string' && <Link href={`/community/${item.details.postId}`}>Open post</Link>}
              {typeof item.details.code === 'string' && <span>Code {item.details.code}</span>}
              <time dateTime={item.createdAt}>{item.createdAt.slice(0, 16).replace('T', ' ')} UTC</time>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
