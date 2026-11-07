'use client';

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { CardInstance, Projection, Region, Seat } from '@/src/engine.mjs';
import { CARD_BY_ID } from '@/lib/cards';
import { copy, type Lang } from '@/lib/i18n';
import { cardTitle, shownEffect } from '@/lib/locale-text';
import { useArt } from '../../components/art-context';
import { cardPlay } from '@/lib/hand-actions';

type Play = { uid: string; region?: Region; target?: Region; species?: string };

function arranged(hand: CardInstance[]) {
  return [...hand].sort((a, b) => {
    const left = CARD_BY_ID[a.card];
    const right = CARD_BY_ID[b.card];
    const group = (left?.kind === 'species' ? 1 : 0) - (right?.kind === 'species' ? 1 : 0);
    if (group) return group;
    const cost = (right?.cost ?? 0) - (left?.cost ?? 0);
    if (cost) return cost;
    return (right?.power ?? 0) - (left?.power ?? 0);
  });
}

export function HandFan({
  game,
  seat,
  busy,
  myTurn,
  mode,
  picked = [],
  onBegin,
  onDragHover,
  pendingUid = null,
  onToggle,
  onDiscard,
  dock = false,
  prompt = null,
  extra = null,
  lang = 'en',
}: {
  game: Projection;
  seat: Seat;
  busy: boolean;
  myTurn: boolean;
  mode: 'play' | 'discard';
  picked?: string[];
  onPlay: (play: Play) => void;
  onBegin?: (uid: string, region?: Region) => void;
  onDragHover?: (region: Region | 'board' | null) => void;
  pendingUid?: string | null;
  onToggle?: (uid: string) => void;
  onDiscard?: (uid: string) => void;
  dock?: boolean;
  prompt?: ReactNode;
  extra?: ReactNode;
  lang?: Lang;
}) {
  const text = copy(lang);
  const art = useArt();
  const hand = arranged(game.players[seat].hand ?? []);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ uid: string; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const stopDrag = useRef<(() => void) | null>(null);
  const focusId = hovered ?? pinned ?? pendingUid;
  const focus = hand.find((card) => card.uid === focusId);
  const plan = focus ? cardPlay(game, seat, focus) : null;
  const def = focus ? CARD_BY_ID[focus.card] : null;
  const mid = (hand.length - 1) / 2;

  useEffect(() => () => stopDrag.current?.(), []);

  function activate(card: CardInstance) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (mode === 'discard') {
      onToggle?.(card.uid);
      setPinned(card.uid);
      return;
    }
    setPinned((current) => (dock && current === card.uid ? null : card.uid));
  }

  function begin(card: CardInstance, region?: Region) {
    if (mode === 'discard') {
      onDiscard?.(card.uid);
      return;
    }
    if (!myTurn || mode !== 'play' || !onBegin) return;
    if (pendingUid && pendingUid !== card.uid) return;
    if (!cardPlay(game, seat, card).legal) return;
    onBegin(card.uid, region);
  }

  function pointerDown(event: ReactPointerEvent<HTMLButtonElement>, card: CardInstance) {
    if (event.button !== 0 || mode !== 'play' || !myTurn || !onBegin) return;
    if (pendingUid && pendingUid !== card.uid) return;
    if (!cardPlay(game, seat, card).legal) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const hover = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      const region = hit?.closest('[data-region]')?.getAttribute('data-region');
      const onBoard = Boolean(hit?.closest('[data-drop]'));
      onDragHover?.(region ? (region as Region) : onBoard ? 'board' : null);
    };
    const move = (e: PointerEvent) => {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) < 8) return;
      moved = true;
      setGhost({ uid: card.uid, x: e.clientX, y: e.clientY });
      hover(e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      stopDrag.current = null;
      if (!moved) return;
      suppressClick.current = true;
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const region = hit?.closest('[data-region]')?.getAttribute('data-region') as Region | undefined;
      const onBoard = Boolean(hit?.closest('[data-drop]'));
      setGhost(null);
      onDragHover?.(null);
      if (onBoard || region) begin(card, region);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    stopDrag.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }

  const fan = (
    <div className="fan">
      {hand.map((card, index) => {
        const offset = index - mid;
        const rot = offset * (dock ? 3 : hand.length > 6 ? 6 : 8);
        const raised = focusId === card.uid || picked.includes(card.uid);
        const playable = mode === 'discard' || (myTurn && (!pendingUid || pendingUid === card.uid) && cardPlay(game, seat, card).legal);
        const x = offset * (hand.length > 6 ? (dock ? 54 : 34) : dock ? 68 : 44);
        const y = Math.abs(offset) * (dock ? 5 : 8);
        const pose = raised
          ? `translateX(calc(-50% + ${x}px)) translateY(${y - (dock ? 18 : 96)}px) rotate(0deg) scale(1.04)`
          : `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg)`;
        const face = CARD_BY_ID[card.card];
        return (
          <button
            key={card.uid}
            type="button"
            className={`fan-card${raised ? ' raised' : ''}${playable ? '' : ' dim'}${pendingUid && pendingUid !== card.uid ? ' held-back' : ''}${pendingUid === card.uid ? ' pending-play' : ''}`}
            style={{ transform: pose, zIndex: raised ? 30 : index + 1 }}
            aria-pressed={picked.includes(card.uid) || pinned === card.uid}
            disabled={busy}
            onMouseEnter={() => setHovered(card.uid)}
            onFocus={() => setHovered(card.uid)}
            onPointerDown={(event) => pointerDown(event, card)}
            onDoubleClick={() => begin(card)}
            onClick={() => activate(card)}
          >
            <img src={art.card(face.id)} alt="" />
            <span className="fan-caption">
              <strong>{cardTitle(lang, face.id)}</strong>
              {face.cost !== undefined && <span className="cost">{face.cost}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );

  const kicker = def && focus
    ? `${text.kind[def.kind as keyof typeof text.kind] ?? def.kind}${def.power !== undefined ? ` · ${text.library.power} ${def.power}` : ''}${def.regions ? ` · ${def.regions.map((region) => text.region[region]).join(' / ')}` : ''}`
    : '';
  const identity = def && focus && plan ? (
    <>
      <h3>{cardTitle(lang, def.id)} {lang === 'en' && <span lang="zh">{def.name}</span>}</h3>
      <p>{shownEffect(lang, def.id, def.effect)}</p>
    </>
  ) : !hand.length ? (
    <p className="note">{lang === 'zh' ? '你的手牌是空的。' : 'Your hand is empty.'}</p>
  ) : myTurn && mode === 'play' ? (
    <p className="note">{text.table.playHow}</p>
  ) : null;

  const actions = (
    <>
      {kicker && <p className="fan-kicker">{kicker}</p>}
      {plan?.reason && <p className="note">{plan.reason}</p>}
    </>
  );

  const ghostCard = ghost ? hand.find((card) => card.uid === ghost.uid) : null;
  const ghostFace = ghostCard ? (
    <img className="drag-ghost" src={art.card(ghostCard.card)} alt="" style={{ left: ghost!.x, top: ghost!.y }} />
  ) : null;

  if (dock) {
    return (
      <div className="hand-shelf" onMouseLeave={() => setHovered(null)}>
        <aside className="hand-side" aria-live="polite">
          {prompt}
          {identity}
        </aside>
        {fan}
        {ghostFace}
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
      {ghostFace}
      <div className="fan-detail" aria-live="polite">
        {identity}
        {actions}
      </div>
    </div>
  );
}
