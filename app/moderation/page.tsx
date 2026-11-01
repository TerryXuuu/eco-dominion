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
        {data.entries.length === 0 && <p className="note">No audit entries yet.</p>}
        {data.entries.length > 0 && (
          <div className="panel audit">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Subject</th>
                  <th>Note</th>
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
