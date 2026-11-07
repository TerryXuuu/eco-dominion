'use client';

import Link from 'next/link';
import { DataTable } from '../components/data-table';
import { say } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

export type NoticeRow = {
  id: string;
  read: boolean;
  kind: string;
  actor: { handle: string; displayName: string } | null;
  postId: string;
  code: string;
  createdAt: string;
};

export function InboxTable({ rows, labels, lang = 'en' }: { rows: NoticeRow[]; labels: Record<string, string>; lang?: Lang }) {
  return (
    <DataTable
      lang={lang}
      rowKey={(row) => row.id}
      rows={rows}
      columns={[
        {
          id: 'event',
          label: say(lang, 'Event', '事件'),
          value: (row) => `${row.actor?.displayName ?? say(lang, 'A moderator', '版主')} ${labels[row.kind] ?? row.kind}`,
          render: (row) => (
            <span>
              {row.read ? '' : '● '}
              {row.actor ? <Link href={`/players/${row.actor.handle}`}>{row.actor.displayName}</Link> : say(lang, 'A moderator', '版主')} {labels[row.kind] ?? row.kind}
            </span>
          ),
        },
        {
          id: 'open',
          label: say(lang, 'Open', '打开'),
          value: (row) => row.postId || row.code || '',
          render: (row) => (
            <>
              {row.postId && <Link href={`/community/${row.postId}`}>{say(lang, 'Open post', '打开帖子')}</Link>}
              {row.kind === 'room_invite' && <Link href="/play">{say(lang, 'Open Play', '去对战')}</Link>}
            </>
          ),
        },
        { id: 'when', label: say(lang, 'When', '时间'), value: (row) => row.createdAt, render: (row) => `${row.createdAt.slice(0, 16).replace('T', ' ')} UTC` },
      ]}
    />
  );
}
