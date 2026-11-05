'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';

export type Column<T> = {
  id: string;
  label: string;
  value: (row: T) => string | number;
  render?: (row: T) => ReactNode;
};

export function DataTable<T>({ columns, rows, rowKey, lang = 'en' }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; lang?: Lang }) {
  const filter = lang === 'zh' ? '筛选' : 'Filter';
  const [sortId, setSortId] = useState<string | null>(null);
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const shown = useMemo(() => {
    const filtered = rows.filter((row) => columns.every((column) => {
      const query = (filters[column.id] ?? '').trim().toLowerCase();
      return !query || String(column.value(row)).toLowerCase().includes(query);
    }));
    if (!sortId) return filtered;
    const column = columns.find((item) => item.id === sortId);
    if (!column) return filtered;
    return [...filtered].sort((a, b) => {
      const av = column.value(a);
      const bv = column.value(b);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [columns, dir, filters, rows, sortId]);

  function toggle(id: string) {
    if (sortId === id) setDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortId(id);
      setDir('asc');
    }
  }

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.id}>
              <button type="button" className="sort-heading" onClick={() => toggle(column.id)}>
                {column.label}{sortId === column.id ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
              </button>
            </th>
          ))}
        </tr>
        <tr>
          {columns.map((column) => (
            <th key={`${column.id}-filter`}>
              <input
                className="column-filter"
                value={filters[column.id] ?? ''}
                aria-label={`${filter} ${column.label}`}
                placeholder={filter}
                onChange={(event) => setFilters((current) => ({ ...current, [column.id]: event.target.value }))}
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => <td key={column.id}>{column.render ? column.render(row) : column.value(row)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
