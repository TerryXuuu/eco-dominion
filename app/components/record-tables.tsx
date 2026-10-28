'use client';

import Link from 'next/link';
import { DataTable } from './data-table';

export type HistoryRow = {
  id: string;
  when: string;
  result: string;
  opponent: string;
  detail: string;
  score: string;
  ratingLabel: string;
};

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  return (
    <DataTable
      rowKey={(row) => row.id}
      rows={rows}
      columns={[
        { id: 'when', label: 'When', value: (row) => row.when },
        { id: 'result', label: 'Result', value: (row) => row.result },
        { id: 'opponent', label: 'Opponent', value: (row) => row.opponent },
        { id: 'detail', label: 'How', value: (row) => row.detail },
        { id: 'score', label: 'Score', value: (row) => row.score },
        { id: 'rating', label: 'Rating', value: (row) => row.ratingLabel },
        { id: 'replay', label: 'Replay', value: () => 'Replay', render: (row) => <Link href={`/matches/${row.id}/replay`}>Replay</Link> },
      ]}
    />
  );
}

export type BoardRow = { rank: number; player: string; rating: number; games: number };

export function LeaderboardTable({ rows }: { rows: BoardRow[] }) {
  return (
    <DataTable
      rowKey={(row) => String(row.rank)}
      rows={rows}
      columns={[
        { id: 'rank', label: '#', value: (row) => row.rank },
        { id: 'player', label: 'Player', value: (row) => row.player },
        { id: 'rating', label: 'Rating', value: (row) => row.rating },
        { id: 'games', label: 'Games', value: (row) => row.games },
      ]}
    />
  );
}

export type OpponentRow = { handle: string; games: number; wins: number; losses: number; draws: number };

export function OpponentTable({ rows }: { rows: OpponentRow[] }) {
  return (
    <DataTable
      rowKey={(row) => row.handle}
      rows={rows}
      columns={[
        { id: 'handle', label: 'Opponent', value: (row) => row.handle, render: (row) => <Link href={`/players/${row.handle}`}>@{row.handle}</Link> },
        { id: 'games', label: 'Games', value: (row) => row.games },
        { id: 'wins', label: 'Wins', value: (row) => row.wins },
        { id: 'losses', label: 'Losses', value: (row) => row.losses },
        { id: 'draws', label: 'Draws', value: (row) => row.draws },
      ]}
    />
  );
}

export type RecentRow = { id: string; finishedAt: string; opponent: string; outcome: string; score: string; mode: string };

export function RecentTable({ rows }: { rows: RecentRow[] }) {
  return (
    <DataTable
      rowKey={(row) => row.id}
      rows={rows}
      columns={[
        { id: 'when', label: 'When', value: (row) => row.finishedAt, render: (row) => row.finishedAt.slice(0, 16).replace('T', ' ') },
        { id: 'opponent', label: 'Opponent', value: (row) => row.opponent },
        { id: 'outcome', label: 'Result', value: (row) => row.outcome },
        { id: 'score', label: 'Score', value: (row) => row.score },
        { id: 'mode', label: 'Mode', value: (row) => row.mode },
        { id: 'replay', label: 'Replay', value: () => 'Replay', render: (row) => <Link href={`/matches/${row.id}/replay`}>Replay</Link> },
      ]}
    />
  );
}

export type PersonRow = { handle: string; displayName: string };

export function PeopleTable({ title, rows }: { title: string; rows: PersonRow[] }) {
  return (
    <section className="panel stack">
      <h2>{title}</h2>
      {rows.length === 0 && <p className="note">None.</p>}
      {rows.length > 0 && (
        <DataTable
          rowKey={(row) => row.handle}
          rows={rows}
          columns={[
            { id: 'name', label: 'Name', value: (row) => row.displayName, render: (row) => <Link href={`/players/${row.handle}`}>{row.displayName}</Link> },
            { id: 'handle', label: 'Handle', value: (row) => row.handle },
          ]}
        />
      )}
    </section>
  );
}
