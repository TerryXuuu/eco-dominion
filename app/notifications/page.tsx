import { SiteHeader } from '../components/site-header';
import { notifications } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { MarkRead } from './inbox-client';
import { InboxTable } from './inbox-table';

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
  const { data } = await pageActor((client, userId) => notifications(client, userId, {}));
  if (data.status !== 200) return null;
  const inbox = data.body;
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <h1>Notifications</h1>
        <p className="note">{inbox.unread} unread</p>
        <MarkRead />
        {inbox.notifications.length === 0 && <p className="note">Nothing yet.</p>}
        {inbox.notifications.length > 0 && (
          <InboxTable
            labels={KIND}
            rows={inbox.notifications.map((item) => ({
              id: item.id,
              read: item.read,
              kind: item.kind,
              actor: item.actor,
              postId: typeof item.details.postId === 'string' ? item.details.postId : '',
              code: typeof item.details.code === 'string' ? item.details.code : '',
              createdAt: item.createdAt,
            }))}
          />
        )}
      </main>
    </>
  );
}
