'use client';

import { useMemo, useState } from 'react';
import { titleOf } from '@/lib/cards';
import { cardTitle } from '@/lib/locale-text';
import { useArt } from '../components/art-context';
import { copy, type Lang } from '@/lib/i18n';
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

export function Library({ cards, lang }: { cards: LibraryCard[]; lang: Lang }) {
  const text = copy(lang);
  const art = useArt();
  const [kind, setKind] = useState<string>('all');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () => cards.filter((card) => {
      if (kind !== 'all' && card.kind !== kind) return false;
      if (!needle) return true;
      const haystack = [card.id, card.name, titleOf(card.id), card.effect, card.play, card.pair, text.kind[card.kind as keyof typeof text.kind] ?? card.kind].join(' ').toLowerCase();
      return haystack.includes(needle);
    }),
    [cards, kind, needle, text],
  );

  return (
    <div className="stack">
      <div className="library-tools">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.library.search} aria-label={text.library.search} />
        <div className="kind-filters">
          <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>{text.kind.all}</button>
          {KINDS.map((item) => (
            <button key={item} type="button" aria-pressed={kind === item} onClick={() => setKind(item)}>{text.kind[item]}</button>
          ))}
        </div>
      </div>
      <p className="note">{shown.length} {text.library.count}</p>
      <ol className="library">
        {shown.map((card) => (
          <li key={card.id} className="panel library-card" id={card.id}>
            <img src={art.card(card.id)} alt="" />
            <div className="stack">
              <h2>
                <span lang={lang === 'zh' ? 'zh' : 'en'}>{cardTitle(lang, card.id)}</span>
                <span className="note" lang={lang === 'zh' ? 'en' : 'zh'}> {lang === 'zh' ? titleOf(card.id) : card.name}</span>
              </h2>
              <p className="note">
                {text.kind[card.kind as keyof typeof text.kind] ?? card.kind}
                {card.cost !== undefined && ` · ${text.library.cost} ${card.cost}`}
                {card.power !== undefined && ` · ${text.library.power} ${card.power}`}
                {` · ${card.copies} ${text.library.deck}`}
                {card.regions && ` · ${card.regions.map((region) => text.region[region]).join(', ')}`}
              </p>
              <p><strong>{text.library.rules} </strong>{card.effect}</p>
              <p><strong>{text.library.use} </strong>{card.play}</p>
              <p><strong>{text.library.with} </strong>{card.pair}</p>
            </div>
          </li>
        ))}
      </ol>
      {shown.length === 0 && <p className="note">{text.library.none}</p>}
    </div>
  );
}
