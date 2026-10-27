'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import type { CardInstance, Projection, Region, Seat } from '@/src/engine.mjs';
import { CARD_BY_ID, KIND_LABEL, REGION_LABEL, REGION_ORDER, titleOf } from '@/lib/cards';
import { anyLegalPlay, cardPlay } from '@/lib/hand-actions';

type Play = { uid: string; region?: Region; target?: Region; species?: string };

export function HandFan({
  game,
  seat,
  busy,
  myTurn,
  mode,
  picked = [],
  onPlay,
  onToggle,
  onPass,
  dock = false,
  prompt = null,
  extra = null,
}: {
  game: Projection;
  seat: Seat;
  busy: boolean;
  myTurn: boolean;
  mode: 'play' | 'discard';
  picked?: string[];
  onPlay: (play: Play) => void;
  onToggle?: (uid: string) => void;
  onPass?: () => void;
  dock?: boolean;
  prompt?: ReactNode;
  extra?: ReactNode;
}) {
  const hand = game.players[seat].hand ?? [];
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [flying, setFlying] = useState<string | null>(null);
  const [target, setTarget] = useState<Region | ''>('');
  const [species, setSpecies] = useState('');
  const focusId = hovered ?? pinned;
  const focus = hand.find((card) => card.uid === focusId);
  const plan = focus ? cardPlay(game, seat, focus) : null;
  const def = focus ? CARD_BY_ID[focus.card] : null;
  const stuck = myTurn && mode === 'play' && !anyLegalPlay(game, seat);
  const mid = (hand.length - 1) / 2;

  function commit(play: Play) {
    if (busy || flying) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onPlay(play);
      return;
    }
    setFlying(play.uid);
    window.setTimeout(() => {
      setFlying(null);
      onPlay(play);
    }, 320);
  }

  function activate(card: CardInstance) {
    if (mode === 'discard') {
      onToggle?.(card.uid);
      setPinned(card.uid);
      return;
    }
    if (!myTurn) {
      setPinned((current) => (dock && current === card.uid ? null : card.uid));
      return;
    }
    const next = cardPlay(game, seat, card);
    if (!next.legal) {
      setPinned((current) => (dock && current === card.uid ? null : card.uid));
      return;
    }
    if (next.immediate) {
      commit(next.immediate);
      return;
    }
    setPinned((current) => (dock && current === card.uid ? null : card.uid));
  }

  const fan = (
    <div className="fan">
      {hand.map((card, index) => {
        const offset = index - mid;
        const rot = offset * (dock ? 3 : hand.length > 6 ? 6 : 8);
        const raised = focusId === card.uid || picked.includes(card.uid);
        const playable = mode === 'discard' || (myTurn && cardPlay(game, seat, card).legal);
        const x = offset * (hand.length > 6 ? (dock ? 54 : 34) : dock ? 68 : 44);
        const y = Math.abs(offset) * (dock ? 5 : 8);
        const pose = flying === card.uid
          ? `translateX(calc(-50% + ${x}px)) translateY(-11rem) scale(0.72)`
          : raised
            ? `translateX(calc(-50% + ${x}px)) translateY(${y - (dock ? 18 : 96)}px) rotate(0deg) scale(1.04)`
            : `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg)`;
        const face = CARD_BY_ID[card.card];
        return (
          <button
            key={card.uid}
            type="button"
            className={`fan-card${raised ? ' raised' : ''}${playable ? '' : ' dim'}${flying === card.uid ? ' flying' : ''}`}
            style={{ transform: pose, zIndex: flying === card.uid ? 40 : raised ? 30 : index + 1 }}
            aria-pressed={picked.includes(card.uid) || pinned === card.uid}
            disabled={busy}
            onMouseEnter={() => setHovered(card.uid)}
            onFocus={() => setHovered(card.uid)}
            onClick={() => activate(card)}
          >
            <img src={`/cards/${face.id}.jpg`} alt="" />
            <span className="fan-caption">
              <strong>{titleOf(face.id)}</strong>
              {face.cost !== undefined && <span className="cost">{face.cost}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );

  const kicker = def && focus
    ? `${KIND_LABEL[def.kind]}${def.power !== undefined ? ` · power ${def.power}` : ''}${def.regions ? ` · ${def.regions.map((region) => REGION_LABEL[region]).join(' / ')}` : ''}`
    : '';
  const regionChoices = plan && focus && myTurn && mode === 'play' && plan.legal && !plan.immediate
    ? (plan.needsSpecies
      ? (CARD_BY_ID[game.board.find((item) => item.uid === species)?.card ?? '']?.regions ?? []).filter((region) => region !== game.board.find((item) => item.uid === species)?.region)
      : plan.regions)
    : [];

  const identity = def && focus && plan ? (
    <>
      <h3>{titleOf(def.id)} <span lang="zh">{def.name}</span></h3>
      <p>{def.effect}</p>
    </>
  ) : !dock ? (
    <p className="note">{hand.length ? 'Hover a card to read it. Click a playable card to lay it on the table.' : 'Your hand is empty.'}</p>
  ) : null;

  const actions = (
    <>
      {kicker && <p className="fan-kicker">{kicker}</p>}
      {plan?.reason && <p className="note">{plan.reason}</p>}
      {regionChoices.length > 0 && focus && (
        <div className="row">
          {regionChoices.map((region) => (
            <button
              key={region}
              type="button"
              disabled={busy || (plan?.needsTarget && !target) || (plan?.needsSpecies && !species)}
              onClick={() => commit({ uid: focus.uid, region, ...(plan?.needsTarget && target ? { target } : {}), ...(plan?.needsSpecies ? { species } : {}) })}
            >
              {REGION_LABEL[region]}
            </button>
          ))}
        </div>
      )}
      {def && focus && plan && myTurn && mode === 'play' && plan.legal && !plan.immediate && plan.needsTarget && (
        <label>{def.id === 'bison' ? 'Enemy region' : 'Region'}
          <select value={target} onChange={(event) => setTarget(event.target.value as Region | '')}>
            <option value="">Choose…</option>
            {(def.id === 'bison' ? REGION_ORDER.filter((region) => game.regions[region].controller === (1 - seat)) : REGION_ORDER).map((region) => <option key={region} value={region}>{REGION_LABEL[region]}</option>)}
          </select>
        </label>
      )}
      {def && focus && plan && myTurn && mode === 'play' && plan.legal && plan.needsSpecies && (
        <label>Species to move
          <select value={species} onChange={(event) => setSpecies(event.target.value)}>
            <option value="">Choose…</option>
            {game.board.filter((item) => item.owner === seat && (CARD_BY_ID[item.card].regions?.length ?? 0) > 1).map((item) => (
              <option key={item.uid} value={item.uid}>{titleOf(item.card)} in {REGION_LABEL[item.region]}</option>
            ))}
          </select>
        </label>
      )}
      {stuck && onPass && (
        <div className="row">
          <button type="button" disabled={busy} onClick={onPass}>Pass</button>
          <span className="note">No legal play this phase.</span>
        </div>
      )}
    </>
  );

  if (dock) {
    return (
      <div className="hand-shelf" onMouseLeave={() => setHovered(null)}>
        <aside className="hand-side" aria-live="polite">
          {prompt}
          {identity}
        </aside>
        {fan}
        <aside className="hand-side">
          {actions}
          {extra}
        </aside>
      </div>
    );
  }

  return (
    <div className="table-hand" onMouseLeave={() => setHovered(null)}>
      {fan}
      <div className="fan-detail" aria-live="polite">
        {identity}
        {actions}
      </div>
    </div>
  );
}
