import { notFound } from 'next/navigation';
import { SiteHeader } from '../components/site-header';
import { auditTrail, isModerator, moderationQueue } from '@/lib/community-service';
import { pageActor } from '@/lib/page-actor';
import { Queue } from './moderation-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ModerationPage() {
  const { email, data } = await pageActor(async (client, userId) => {
    if (!(await isModerator(client, userId))) return null;
    const [queue, trail] = await Promise.all([moderationQueue(client, userId, {}), auditTrail(client, userId)]);
    if (queue.status !== 200 || trail.status !== 200) return null;
    return { reports: queue.body.reports, entries: trail.body.entries };
  });
  if (!data) notFound();
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell stack">
        <h1>Moderation</h1>
        <p className="note">This queue is for reported posts, comments and players. Hide or restore content, suspend or restore the reported account, and close the report. Accounts, role grants, casual ratings and match records are on the admin console.</p>
        <Queue reports={data.reports} />
        <h2>Audit trail</h2>
        <ol className="list">
          {data.entries.map((entry) => (
            <li key={entry.id} className="panel list-row">
              <strong>{entry.action}</strong>
              <span>{entry.actor}</span>
              <span>{entry.subjectType} {entry.subjectId}</span>
              {entry.reason && <span>{entry.reason}</span>}
              <time dateTime={entry.createdAt}>{entry.createdAt.slice(0, 16).replace('T', ' ')} UTC</time>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
