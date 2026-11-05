'use client';

import { useState } from 'react';
import type { Projection, Seat } from '@/src/engine.mjs';
import { callApi } from '../../../components/call-api';
import { cardTitle, phaseLabel, say } from '@/lib/locale-text';
import { useArt } from '../../../components/art-context';
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
  const lang = useArt().lang;
  const [frame, setFrame] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function goTo(step: number) {
    setBusy(true);
    const { ok, data } = await callApi<ReplayFrame>(`/api/matches/${frame.id}/replay?step=${Math.max(0, Math.min(frame.total, step))}`);
    setBusy(false);
    if (ok) setFrame(data);
  }

  const last = frame.step > 0 ? frame.moves[frame.step - 1] : null;
  const who = (seat: Seat) => (seat === frame.seat ? say(lang, 'You', '你') : frame.players.find((player) => player.seat === seat)?.displayName ?? say(lang, 'Opponent', '对手'));
  return (
    <div className="stack">
      <section className="panel stack">
        <div className="row">
          <button disabled={busy || frame.step === 0} onClick={() => goTo(0)}>{say(lang, 'Start', '开头')}</button>
          <button disabled={busy || frame.step === 0} onClick={() => goTo(frame.step - 1)}>{say(lang, 'Back', '上一步')}</button>
          <button disabled={busy || frame.step === frame.total} onClick={() => goTo(frame.step + 1)}>{say(lang, 'Next', '下一步')}</button>
          <button disabled={busy || frame.step === frame.total} onClick={() => goTo(frame.total)}>{say(lang, 'End', '结尾')}</button>
        </div>
        <p>
          {say(lang, `Step ${frame.step} of ${frame.total}`, `第 ${frame.step} 步，共 ${frame.total} 步`)}
          {last && <> · {who(last.seat)}: {last.type}{last.auto ? say(lang, ' (timeout)', '（超时）') : ''}</>}
          {frame.game.result && <> · <strong>{resultText(frame.game, frame.seat, frame.players, lang)}</strong></>}
        </p>
      </section>
      <BoardView lang={lang} game={frame.game} seat={frame.seat} players={frame.players} />
      <section className="panel stack">
        <h3>{say(lang, 'Your hand at this step', '这一步的手牌')}</h3>
        <div className="hand">{(frame.game.players[frame.seat].hand ?? []).map((card) => <CardFace key={card.uid} card={card} />)}</div>
        <p className="note">{say(lang, 'Phase', '阶段')} {phaseLabel(lang, frame.game.phase)} · {cardTitle(lang, frame.game.event ?? 'no event')}</p>
      </section>
    </div>
  );
}
