'use client';

import type { Projection, Region, Seat } from '@/src/engine.mjs';
import { CARD_BY_ID, REGION_ORDER } from '@/lib/cards';
import { cardPlay } from '@/lib/hand-actions';
import { copy, type Lang } from '@/lib/i18n';
import { cardTitle, shownEffect } from '@/lib/locale-text';
import { useArt } from '../../components/art-context';

export type PlayDraft = {
  uid: string;
  open: boolean;
  region?: Region;
  target?: Region;
  species?: string;
};

type Play = { uid: string; region?: Region; target?: Region; species?: string };

export function PlaySheet({
  game,
  seat,
  draft,
  busy,
  lang,
  onChange,
  onCommit,
  onPeek,
  onCancel,
}: {
  game: Projection;
  seat: Seat;
  draft: PlayDraft;
  busy: boolean;
  lang: Lang;
  onChange: (draft: PlayDraft) => void;
  onCommit: (play: Play) => void;
  onPeek: () => void;
  onCancel: () => void;
}) {
  const text = copy(lang);
  const art = useArt();
  const card = (game.players[seat].hand ?? []).find((item) => item.uid === draft.uid);
  if (!card) return null;
  const plan = cardPlay(game, seat, card);
  const def = CARD_BY_ID[card.card];
  if (!def || !plan.legal) return null;
  const opponent = (1 - seat) as Seat;
  const targets = def.id === 'bison'
    ? REGION_ORDER.filter((region) => game.regions[region].controller === opponent)
    : REGION_ORDER;
  const mover = game.board.find((item) => item.uid === draft.species);
  const destinations = mover
    ? (CARD_BY_ID[mover.card].regions ?? []).filter((region) => region !== mover.region)
    : [];
  const homes = plan.needsSpecies ? destinations : plan.regions;

  function commit(next: PlayDraft) {
    if (plan.needsSpecies) {
      if (!next.species || !next.region) {
        onChange(next);
        return;
      }
      onCommit({ uid: next.uid, species: next.species, region: next.region });
      return;
    }
    if (plan.needsTarget && !next.target) {
      onChange(next);
      return;
    }
    const region = next.region ?? (plan.regions.length === 1 ? plan.regions[0] : undefined);
    if (!region) {
      onChange(next);
      return;
    }
    onCommit({ uid: next.uid, region, ...(next.target ? { target: next.target } : {}) });
  }

  return (
    <section className="play-pop" aria-label={cardTitle(lang, def.id)}>
      <div className="play-pop-card">
        <img src={art.card(def.id)} alt="" />
        <div>
          <h3>{cardTitle(lang, def.id)}</h3>
          {lang === 'en' && <p className="note" lang="zh">{def.name}</p>}
          <p>{shownEffect(lang, def.id, def.effect)}</p>
        </div>
      </div>
      {plan.needsTarget && (
        <div className="play-pop-choice">
          <p>{def.id === 'bison' ? text.table.enemyRegion : text.table.region}</p>
          <div className="row">
            {targets.map((region) => (
              <button
                key={region}
                type="button"
                aria-pressed={draft.target === region}
                className={draft.target === region ? 'pressed' : 'secondary'}
                disabled={busy}
                onClick={() => commit({ ...draft, target: region, region: plan.regions.length === 1 ? plan.regions[0] : draft.region })}
              >
                {text.region[region]}
              </button>
            ))}
          </div>
        </div>
      )}
      {plan.needsSpecies && (
        <div className="play-pop-choice">
          <p>{text.table.species}</p>
          <div className="row">
            {game.board.filter((item) => item.owner === seat && (CARD_BY_ID[item.card].regions?.length ?? 0) > 1).map((item) => (
              <button
                key={item.uid}
                type="button"
                aria-pressed={draft.species === item.uid}
                className={draft.species === item.uid ? 'pressed' : 'secondary'}
                disabled={busy}
                onClick={() => onChange({ ...draft, species: item.uid, region: undefined })}
              >
                {cardTitle(lang, item.card)} {text.table.in} {text.region[item.region]}
              </button>
            ))}
          </div>
        </div>
      )}
      {homes.length > 0 && (!plan.needsSpecies || draft.species) && (!plan.needsTarget || draft.target || plan.regions.length === 1) && plan.regions.length !== 1 && (
        <div className="play-pop-choice">
          <p>{plan.needsSpecies ? text.table.moveTo : text.table.region}</p>
          <div className="row">
            {homes.map((region) => (
              <button key={region} type="button" aria-pressed={draft.region === region} className={draft.region === region ? 'pressed' : 'secondary'} disabled={busy} onClick={() => commit({ ...draft, region })}>
                {text.region[region]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="row">
        <button type="button" className="secondary" onClick={onPeek}>{text.table.backToGame}</button>
        <button type="button" className="secondary" disabled={busy} onClick={onCancel}>{text.table.cancelCard}</button>
      </div>
    </section>
  );
}
