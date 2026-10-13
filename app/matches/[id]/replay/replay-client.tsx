'use client';

import { useState } from 'react';
import type { Projection, Seat } from '@/src/engine.mjs';
import { titleOf } from '@/lib/cards';
import { callApi } from '../../../components/call-api';
import { BoardView, CardFace, resultText, type Player } from '../board-view';

export type ReplayFrame = {
  id: string;
  seat: Seat;
  step: number;
  total: number;
  moves: { step: number; seat: Seat; type: string; auto: boolean }[];
  players: Player[];
  game: Projection;
};

export function ReplayClient({ initial }: { initial: ReplayFrame }) {
  const [frame, setFrame] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function goTo(step: number) {
    setBusy(true);
    const { ok, data } = await callApi<ReplayFrame>(`/api/matches/${frame.id}/replay?step=${Math.max(0, Math.min(frame.total, step))}`);
    setBusy(false);
    if (ok) setFrame(data);
  }

  const last = frame.step > 0 ? frame.moves[frame.step - 1] : null;
  const who = (seat: Seat) => (seat === frame.seat ? 'You' : frame.players.find((player) => player.seat === seat)?.displayName ?? 'Opponent');
  return (
    <div className="stack">
      <section className="panel stack">
        <div className="row">
          <button disabled={busy || frame.step === 0} onClick={() => goTo(0)}>Start</button>
          <button disabled={busy || frame.step === 0} onClick={() => goTo(frame.step - 1)}>Back</button>
          <button disabled={busy || frame.step === frame.total} onClick={() => goTo(frame.step + 1)}>Next</button>
          <button disabled={busy || frame.step === frame.total} onClick={() => goTo(frame.total)}>End</button>
        </div>
        <p>
          Step {frame.step} of {frame.total}
          {last && <> · {who(last.seat)}: {last.type}{last.auto ? ' (timeout)' : ''}</>}
          {frame.game.result && <> · <strong>{resultText(frame.game, frame.seat, frame.players)}</strong></>}
        </p>
      </section>
      <BoardView game={frame.game} seat={frame.seat} players={frame.players} />
      <section className="panel stack">
        <h3>Your hand at this step</h3>
        <div className="hand">{(frame.game.players[frame.seat].hand ?? []).map((card) => <CardFace key={card.uid} card={card} />)}</div>
        <p className="note">Phase {frame.game.phase} · {titleOf(frame.game.event ?? 'no event')}</p>
      </section>
    </div>
  );
}
