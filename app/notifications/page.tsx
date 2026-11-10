import { notifications } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { MarkRead } from './inbox-client';
import { InboxTable } from './inbox-table';
import { getLang } from '@/lib/lang';
import { say } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KIND: Record<Lang, Record<string, string>> = {
  en: {
    like: 'liked your post',
    comment: 'commented on your post',
    follow: 'followed you',
    friend_request: 'sent a friend request',
    friend_accept: 'accepted your friend request',
    room_invite: 'invited you to a private room',
    report: 'filed a report',
    report_closed: 'closed a report you filed',
    moderation: 'took a moderation action that affects you',
  },
  zh: {
    like: '赞了你的帖子',
    comment: '评论了你的帖子',
    follow: '关注了你',
    friend_request: '向你发送了好友请求',
    friend_accept: '接受了你的好友请求',
    room_invite: '邀请你进入私人房间',
    report: '提交了举报',
    report_closed: '关闭了你提交的举报',
    moderation: '做了影响你的审核操作',
  },
};

export default async function NotificationsPage() {
  const [{ data }, lang] = await Promise.all([pageActor((client, userId) => notifications(client, userId, {})), getLang()]);
  if (data.status !== 200) return null;
  const inbox = data.body;
  return (
    <>
      <main className="shell stack">
        <h1>{say(lang, 'Notifications', '通知')}</h1>
        <p className="note">{say(lang, `${inbox.unread} unread`, `${inbox.unread} 条未读`)}</p>
        <MarkRead lang={lang} />
        {inbox.notifications.length === 0 && <p className="note">{say(lang, 'Nothing yet.', '还没有通知。')}</p>}
        {inbox.notifications.length > 0 && (
          <InboxTable
            lang={lang}
            labels={KIND[lang]}
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
