'use client';

import Link from 'next/link';
import { DataTable } from '../components/data-table';

export type NoticeRow = {
  id: string;
  read: boolean;
  kind: string;
  actor: { handle: string; displayName: string } | null;
  postId: string;
  code: string;
  createdAt: string;
};

export function InboxTable({ rows, labels }: { rows: NoticeRow[]; labels: Record<string, string> }) {
  return (
    <DataTable
      rowKey={(row) => row.id}
      rows={rows}
      columns={[
        {
          id: 'event',
          label: 'Event',
          value: (row) => `${row.actor?.displayName ?? 'A moderator'} ${labels[row.kind] ?? row.kind}`,
          render: (row) => (
            <span>
              {row.read ? '' : '● '}
              {row.actor ? <Link href={`/players/${row.actor.handle}`}>{row.actor.displayName}</Link> : 'A moderator'} {labels[row.kind] ?? row.kind}
            </span>
          ),
        },
        {
          id: 'open',
          label: 'Open',
          value: (row) => row.postId || row.code || '',
          render: (row) => (
            <>
              {row.postId && <Link href={`/community/${row.postId}`}>Open post</Link>}
              {row.code && <span>Code {row.code}</span>}
            </>
          ),
        },
        { id: 'when', label: 'When', value: (row) => row.createdAt, render: (row) => `${row.createdAt.slice(0, 16).replace('T', ' ')} UTC` },
      ]}
    />
  );
}
