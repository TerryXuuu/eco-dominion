'use client';

import { useState } from 'react';
import { callApi } from '../components/call-api';

type Report = {
  id: string;
  subjectType: string;
  subjectId: string;
  subject: { text: string; status: string; author: string | null; postId: string | null } | null;
  reason: string;
  status: string;
  reporter: string;
  createdAt: string;
};

export function Queue({ reports }: { reports: Report[] }) {
  const [items, setItems] = useState(reports);
  const [reason, setReason] = useState('Confirmed after review');
  const [error, setError] = useState('');

  async function act(reportId: string, action: string) {
    const { ok, data } = await callApi<{ error?: string }>('/api/moderation', { method: 'POST', body: { reportId, action, reason } });
    if (ok) setItems((current) => current.filter((item) => item.id !== reportId));
    else setError(data.error ?? 'Could not apply that action');
  }

  return (
    <section className="stack">
      <label>
        Reason for the next action
        <input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={500} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {items.length === 0 && <p className="note">No open reports.</p>}
      <ol className="list">
        {items.map((report) => (
          <li key={report.id} className="panel stack">
            <p>
              <strong>{report.subjectType}</strong> reported by @{report.reporter}: {report.reason}
            </p>
            {report.subject && <p className="note">{report.subject.author ? `@${report.subject.author}: ` : ''}{report.subject.text}</p>}
            <div className="row">
              {(report.subjectType === 'post' || report.subjectType === 'comment') && (
                <>
                  <button type="button" onClick={() => act(report.id, 'hide')}>Hide</button>
                  <button className="secondary" type="button" onClick={() => act(report.id, 'restore')}>Restore</button>
                </>
              )}
              {report.subjectType !== 'match' && (
                <>
                  <button type="button" onClick={() => act(report.id, 'suspend')}>Suspend</button>
                  <button className="secondary" type="button" onClick={() => act(report.id, 'unsuspend')}>Restore account</button>
                </>
              )}
              <button className="secondary" type="button" onClick={() => act(report.id, 'dismiss')}>Dismiss</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
