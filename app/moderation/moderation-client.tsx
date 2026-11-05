'use client';

import { useState } from 'react';
import { callApi } from '../components/call-api';
import { DataTable } from '../components/data-table';
import { say } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

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

export function Queue({ reports, lang }: { reports: Report[]; lang: Lang }) {
  const [items, setItems] = useState(reports);
  const [reason, setReason] = useState(say(lang, 'Confirmed after review', '审核后确认'));
  const [error, setError] = useState('');

  async function act(reportId: string, action: string) {
    const { ok, data } = await callApi<{ error?: string }>('/api/moderation', { method: 'POST', body: { reportId, action, reason } });
    if (ok) setItems((current) => current.filter((item) => item.id !== reportId));
    else setError(data.error ?? say(lang, 'Could not apply that action', '无法执行该操作'));
  }

  return (
    <section className="stack">
      <label>
        {say(lang, 'Reason for the next action', '下一步操作的原因')}
        <input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={500} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {items.length === 0 && <p className="note">{say(lang, 'No open reports.', '没有待处理的举报。')}</p>}
      {items.length > 0 && (
        <DataTable
          lang={lang}
          rowKey={(report) => report.id}
          rows={items}
          columns={[
            { id: 'when', label: say(lang, 'When', '时间'), value: (report) => report.createdAt, render: (report) => `${report.createdAt.slice(0, 16).replace('T', ' ')} UTC` },
            { id: 'type', label: say(lang, 'Type', '类型'), value: (report) => report.subjectType },
            { id: 'reporter', label: say(lang, 'Reporter', '举报人'), value: (report) => report.reporter },
            { id: 'reason', label: say(lang, 'Reason', '原因'), value: (report) => report.reason },
            { id: 'subject', label: say(lang, 'Subject', '对象'), value: (report) => report.subject?.text ?? '' },
            {
              id: 'action',
              label: say(lang, 'Action', '操作'),
              value: (report) => report.status,
              render: (report) => (
                <div className="queue-actions">
                  {(report.subjectType === 'post' || report.subjectType === 'comment') && (
                    <>
                      <button type="button" onClick={() => act(report.id, 'hide')}>{say(lang, 'Hide', '隐藏')}</button>
                      <button type="button" onClick={() => act(report.id, 'restore')}>{say(lang, 'Restore', '恢复')}</button>
                    </>
                  )}
                  {report.subjectType !== 'match' && (
                    <>
                      <button type="button" onClick={() => act(report.id, 'suspend')}>{say(lang, 'Suspend', '封禁')}</button>
                      <button type="button" onClick={() => act(report.id, 'unsuspend')}>{say(lang, 'Unsuspend', '解封')}</button>
                    </>
                  )}
                  <button className="quiet" type="button" onClick={() => act(report.id, 'dismiss')}>{say(lang, 'Dismiss', '驳回')}</button>
                </div>
              ),
            },
          ]}
        />
      )}
    </section>
  );
}
