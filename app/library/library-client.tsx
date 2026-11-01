'use client';

import { useMemo, useState } from 'react';
import { KIND_LABEL, REGION_LABEL, titleOf } from '@/lib/cards';
import type { Region } from '@/src/engine.mjs';

export type LibraryCard = {
  id: string;
  name: string;
  kind: string;
  cost?: number;
  power?: number;
  regions?: Region[];
  copies: number;
  effect: string;
  play: string;
  pair: string;
};

const KINDS = ['species', 'tactic', 'interference', 'event'] as const;

export function Library({ cards }: { cards: LibraryCard[] }) {
  const [kind, setKind] = useState<string>('all');
  const [text, setText] = useState('');
  const needle = text.trim().toLowerCase();
  const shown = useMemo(
    () => cards.filter((card) => {
      if (kind !== 'all' && card.kind !== kind) return false;
      if (!needle) return true;
      const haystack = [card.id, card.name, titleOf(card.id), card.effect, card.play, card.pair, KIND_LABEL[card.kind]].join(' ').toLowerCase();
      return haystack.includes(needle);
    }),
    [cards, kind, needle],
  );

  return (
    <div className="stack">
      <div className="library-tools">
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Search the library" aria-label="Search the library" />
        <div className="kind-filters">
          <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>All</button>
          {KINDS.map((item) => (
            <button key={item} type="button" aria-pressed={kind === item} onClick={() => setKind(item)}>{KIND_LABEL[item]}</button>
          ))}
        </div>
      </div>
      <p className="note">{shown.length} cards</p>
      <ol className="library">
        {shown.map((card) => (
          <li key={card.id} className="panel library-card" id={card.id}>
            <img src={`/cards/${card.id}.jpg`} alt="" />
            <div className="stack">
              <h2>
                <span lang="zh">{card.name}</span>
                <span className="note"> {titleOf(card.id)}</span>
              </h2>
              <p className="note">
                {KIND_LABEL[card.kind]}
                {card.cost !== undefined && ` · cost ${card.cost}`}
                {card.power !== undefined && ` · power ${card.power}`}
                {` · ${card.copies} in the deck`}
                {card.regions && ` · ${card.regions.map((region) => REGION_LABEL[region]).join(', ')}`}
              </p>
              <p><strong>Rules. </strong>{card.effect}</p>
              <p><strong>How to use it. </strong>{card.play}</p>
              <p><strong>Play it with. </strong>{card.pair}</p>
            </div>
          </li>
        ))}
      </ol>
      {shown.length === 0 && <p className="note">No card matches that search.</p>}
    </div>
  );
}
