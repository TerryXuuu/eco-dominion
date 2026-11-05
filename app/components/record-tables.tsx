'use client';

import Link from 'next/link';
import { DataTable } from './data-table';
import { copy, type Lang } from '@/lib/i18n';

export type HistoryRow = {
  id: string;
  when: string;
  result: string;
  opponent: string;
  detail: string;
  score: string;
  ratingLabel: string;
};

export function HistoryTable({ rows, lang = 'en' }: { rows: HistoryRow[]; lang?: Lang }) {
  const text = copy(lang).history;
  return (
    <DataTable
      lang={lang}
      rowKey={(row) => row.id}
      rows={rows}
      columns={[
        { id: 'when', label: text.when, value: (row) => row.when },
        { id: 'result', label: text.result, value: (row) => row.result },
        { id: 'opponent', label: text.opponent, value: (row) => row.opponent },
        { id: 'detail', label: text.how, value: (row) => row.detail },
        { id: 'score', label: text.score, value: (row) => row.score },
        { id: 'rating', label: text.rating, value: (row) => row.ratingLabel },
        { id: 'replay', label: text.replay, value: () => text.replay, render: (row) => <Link href={`/matches/${row.id}/replay`}>{text.replay}</Link> },
      ]}
    />
  );
}

export type BoardRow = { rank: number; player: string; rating: number; games: number };

export function LeaderboardTable({ rows, lang = 'en' }: { rows: BoardRow[]; lang?: Lang }) {
  const text = copy(lang).board;
  return (
    <DataTable
      lang={lang}
      rowKey={(row) => String(row.rank)}
      rows={rows}
      columns={[
        { id: 'rank', label: '#', value: (row) => row.rank },
        { id: 'player', label: text.player, value: (row) => row.player },
        { id: 'rating', label: text.rating, value: (row) => row.rating },
        { id: 'games', label: text.games, value: (row) => row.games },
      ]}
    />
  );
}

export type OpponentRow = { handle: string; displayName: string; games: number; wins: number; losses: number; draws: number };

export function OpponentTable({ rows, lang = 'en' }: { rows: OpponentRow[]; lang?: Lang }) {
  const text = copy(lang).history;
  return (
    <DataTable
      lang={lang}
      rowKey={(row) => row.handle}
      rows={rows}
      columns={[
        { id: 'name', label: text.opponent, value: (row) => row.displayName, render: (row) => <Link href={`/players/${row.handle}`}>{row.displayName}</Link> },
        { id: 'games', label: lang === 'zh' ? '场次' : 'Games', value: (row) => row.games },
        { id: 'wins', label: text.win, value: (row) => row.wins },
        { id: 'losses', label: text.loss, value: (row) => row.losses },
        { id: 'draws', label: text.draw, value: (row) => row.draws },
      ]}
    />
  );
}

export type RecentRow = { id: string; finishedAt: string; opponent: string; outcome: string; score: string; mode: string };

export function RecentTable({ rows, lang = 'en' }: { rows: RecentRow[]; lang?: Lang }) {
  const text = copy(lang).history;
  return (
    <DataTable
      lang={lang}
      rowKey={(row) => row.id}
      rows={rows}
      columns={[
        { id: 'when', label: text.when, value: (row) => row.finishedAt, render: (row) => row.finishedAt.slice(0, 16).replace('T', ' ') },
        { id: 'opponent', label: text.opponent, value: (row) => row.opponent },
        { id: 'outcome', label: text.result, value: (row) => row.outcome },
        { id: 'score', label: text.score, value: (row) => row.score },
        { id: 'mode', label: lang === 'zh' ? '模式' : 'Mode', value: (row) => row.mode },
        { id: 'replay', label: text.replay, value: () => text.replay, render: (row) => <Link href={`/matches/${row.id}/replay`}>{text.replay}</Link> },
      ]}
    />
  );
}

export type PersonRow = { handle: string; displayName: string };

export function PeopleTable({ title, rows, empty = 'None.', nameLabel = 'Name', lang = 'en' }: { title: string; rows: PersonRow[]; empty?: string; nameLabel?: string; lang?: Lang }) {
  return (
    <section className="panel stack">
      <h2>{title}</h2>
      {rows.length === 0 && <p className="note">{empty}</p>}
      {rows.length > 0 && (
        <DataTable
          lang={lang}
          rowKey={(row) => row.handle}
          rows={rows}
          columns={[
            { id: 'name', label: nameLabel, value: (row) => row.displayName, render: (row) => <Link href={`/players/${row.handle}`}>{row.displayName}</Link> },
          ]}
        />
      )}
    </section>
  );
}
