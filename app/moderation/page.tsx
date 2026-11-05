import { notFound } from 'next/navigation';
import { SiteHeader } from '../components/site-header';
import { auditTrail, isModerator, moderationQueue } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { Queue } from './moderation-client';
import { getLang } from '@/lib/lang';
import { say } from '@/lib/locale-text';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ModerationPage() {
  const [{ email, data }, lang] = await Promise.all([pageActor(async (client, userId) => {
    if (!(await isModerator(client, userId))) return null;
    const [queue, trail] = await Promise.all([moderationQueue(client, userId, {}), auditTrail(client, userId)]);
    if (queue.status !== 200 || trail.status !== 200) return null;
    return { reports: queue.body.reports, entries: trail.body.entries };
  }), getLang()]);
  if (!data) notFound();
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <h1>{say(lang, 'Moderation', '审核')}</h1>
        <p className="note">{say(lang, 'This queue is for reported posts, comments and players. Hide or restore content, suspend or restore the reported account, and close the report. Accounts, role grants, casual ratings and match records are on the admin console.', '这个队列处理被举报的帖子、评论和玩家。可以隐藏或恢复内容，封禁或恢复被举报的账号，并关闭举报。账号、角色、休闲积分和对局记录在管理后台。')}</p>
        <Queue lang={lang} reports={data.reports} />
        <h2>{say(lang, 'Audit trail', '审核记录')}</h2>
        {data.entries.length === 0 && <p className="note">{say(lang, 'No audit entries yet.', '还没有审核记录。')}</p>}
        {data.entries.length > 0 && (
          <div className="panel audit">
            <table>
              <thead>
                <tr>
                  <th>{say(lang, 'When', '时间')}</th>
                  <th>{say(lang, 'Action', '操作')}</th>
                  <th>{say(lang, 'Actor', '执行人')}</th>
                  <th>{say(lang, 'Subject', '对象')}</th>
                  <th>{say(lang, 'Note', '备注')}</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td><time dateTime={entry.createdAt}>{entry.createdAt.slice(0, 16).replace('T', ' ')} UTC</time></td>
                    <td>{entry.action}</td>
                    <td>{entry.actor}</td>
                    <td title={`${entry.subjectType} ${entry.subjectId}`}>{entry.subjectType} {entry.subjectId.length > 8 ? `${entry.subjectId.slice(0, 8)}…` : entry.subjectId}</td>
                    <td>{entry.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
