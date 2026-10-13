'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Region, Seat } from '@/src/engine.mjs';
import type { MatchView } from '@/lib/match-service';
import { CARD_BY_ID, REGION_LABEL, REGION_ORDER, spellNeedsRegion, titleOf } from '@/lib/cards';
import { callApi } from '../../components/call-api';
import { BoardView, CardFace, resultText } from './board-view';

type Unchanged = { unchanged: true; version: number; deadline: string | null };
type CommandReply = { duplicate: boolean; view: MatchView; error?: string; version?: number };

const ACTIVE_POLL_MS = 1000;
const IDLE_POLL_MS = 5000;
const IDLE_AFTER_MS = 60_000;

function useCountdown(deadline: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  if (!deadline) return null;
  return Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000));
}

export function MatchClient({ initial }: { initial: MatchView }) {
  const [view, setView] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [species, setSpecies] = useState('');
  const [target, setTarget] = useState('');
  const lastInput = useRef(Date.now());
  const versionRef = useRef(view.version);
  versionRef.current = view.version;

  const refresh = useCallback(async () => {
    const { ok, status, data } = await callApi<MatchView | Unchanged>(`/api/matches/${initial.id}?v=${versionRef.current}`);
    if (ok && !('unchanged' in data)) setView(data);
    else if (ok) setView((current) => ({ ...current, deadline: data.deadline }));
    else if (status === 0 || status === 503) setError('Connection lost; reconnecting…');
    if (ok) setError((message) => (message.startsWith('Connection lost') ? '' : message));
  }, [initial.id]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      // Hidden tabs make no requests but keep checking, since embedded views may never fire visibilitychange.
      if (document.hidden) {
        timer = setTimeout(loop, IDLE_POLL_MS);
        return;
      }
      await refresh();
      const idle = Date.now() - lastInput.current > IDLE_AFTER_MS;
      timer = setTimeout(loop, idle ? IDLE_POLL_MS : ACTIVE_POLL_MS);
    };
    const wake = () => {
      clearTimeout(timer);
      if (!document.hidden) loop();
    };
    const touch = () => (lastInput.current = Date.now());
    loop();
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('online', wake);
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
      window.removeEventListener('online', wake);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
    };
  }, [refresh]);

  useEffect(() => {
    setSelected(null);
    setPicks([]);
    setSpecies('');
    setTarget('');
  }, [view.version]);

  async function send(type: string, fields: Record<string, unknown> = {}) {
    setBusy(true);
    setError('');
    lastInput.current = Date.now();
    const body = { commandId: crypto.randomUUID(), expectedVersion: view.version, type, ...fields };
    // Retrying with the same commandId is safe: the server applies it at most once.
    let reply = await callApi<CommandReply>(`/api/matches/${view.id}/commands`, { method: 'POST', body });
    for (let attempt = 0; (reply.status === 0 || reply.status === 503) && attempt < 2; attempt += 1) {
      reply = await callApi<CommandReply>(`/api/matches/${view.id}/commands`, { method: 'POST', body });
    }
    setBusy(false);
    if (reply.ok) setView(reply.data.view);
    else {
      setError(reply.data.error ?? 'Something went wrong; try again');
      if (reply.status === 409) refresh();
    }
  }

  const { game, seat, players } = view;
  const me = game.players[seat];
  const hand = me.hand ?? [];
  const countdown = useCountdown(view.deadline);
  const finished = view.status === 'finished' || Boolean(game.result);
  const pending = game.pending;
  const myChoice = pending && pending.owner === seat ? pending : null;
  const myTurn = !finished && !pending && game.active === seat && (game.phase === 'deploy' || game.phase === 'tactics');
  const clockMine = view.clockSeat === seat;
  const selectedCard = selected ? hand.find((card) => card.uid === selected) : undefined;
  const selectedDef = selectedCard ? CARD_BY_ID[selectedCard.card] : undefined;
  const opponent = (1 - seat) as Seat;
  const enemyControlled = REGION_ORDER.filter((region) => game.regions[region].controller === opponent);
  const myMovers = game.board.filter((item) => item.owner === seat && (CARD_BY_ID[item.card].regions?.length ?? 0) > 1);

  function playTo(region?: Region) {
    if (!selectedCard || !selectedDef) return;
    const fields: Record<string, unknown> = { uid: selectedCard.uid };
    if (region) fields.region = region;
    if (selectedDef.id === 'bison' && enemyControlled.length) fields.target = target;
    if (selectedDef.id === 'algae') fields.target = target;
    if (selectedDef.id === 'migrate') fields.species = species;
    send('play', fields);
  }

  const playable = (id: string) => (CARD_BY_ID[id].kind === 'species' ? game.phase === 'deploy' : game.phase === 'tactics');

  return (
    <div className="stack">
      <section className={`panel status ${clockMine && !finished ? 'your-move' : ''}`} aria-live="polite">
        <div>
          <strong>{view.mode === 'casual' ? 'Casual match' : 'Private room'}</strong> · version {view.version} · phase {game.phase}
        </div>
        {finished ? (
          <div className="result">
            <strong>{resultText(game, seat, players)}</strong>
            {view.rating && <span> · casual rating {view.rating.before} → {view.rating.after}</span>}
            <div className="row">
              <Link className="button" href={`/matches/${view.id}/replay`}>Watch replay</Link>
              <Link className="button secondary" href="/history">History</Link>
              <Link className="button secondary" href="/play">Play again</Link>
            </div>
          </div>
        ) : (
          <div>
            {clockMine ? (myChoice ? 'Your choice' : 'Your turn') : pending ? 'Opponent is choosing' : "Opponent's turn"}
            {countdown !== null && <> · <span className={countdown <= 10 ? 'urgent' : ''}>{countdown}s</span> left</>}
            {view.timeouts[seat] > 0 && <> · your timeouts {view.timeouts[seat]}/3</>}
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {myChoice && (
        <section className="panel stack choice" aria-label="Your choice">
          {myChoice.kind === 'discard' && (
            <>
              <h3>Discard exactly {myChoice.count} card{myChoice.count === 1 ? '' : 's'}</h3>
              <div className="hand">
                {hand.map((card) => (
                  <CardFace
                    key={card.uid}
                    card={card}
                    selected={picks.includes(card.uid)}
                    onClick={() => setPicks((current) => (current.includes(card.uid) ? current.filter((uid) => uid !== card.uid) : [...current, card.uid]))}
                  />
                ))}
              </div>
              <div className="row"><button disabled={busy || picks.length !== myChoice.count} onClick={() => send('choose', { uids: picks })}>Discard selected</button></div>
            </>
          )}
          {myChoice.kind === 'rest' && (
            <>
              <h3>Rest: add 2 stability to a region you control</h3>
              <div className="row">{(myChoice.options ?? []).map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { region })}>{REGION_LABEL[region]}</button>)}</div>
            </>
          )}
          {myChoice.kind === 'invasion' && (
            <>
              <h3>Invasion: choose the contested region</h3>
              <div className="row">{REGION_ORDER.map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { region })}>{REGION_LABEL[region]}</button>)}</div>
            </>
          )}
          {myChoice.kind === 'migration' && (
            <>
              <h3>Migration: you may move one species</h3>
              <label>Species<select value={species} onChange={(event) => setSpecies(event.target.value)}>
                <option value="">Choose…</option>
                {myMovers.map((item) => <option key={item.uid} value={item.uid}>{titleOf(item.card)} in {REGION_LABEL[item.region]}</option>)}
              </select></label>
              <div className="row">
                {species && CARD_BY_ID[myMovers.find((item) => item.uid === species)!.card].regions!
                  .filter((region) => region !== myMovers.find((item) => item.uid === species)!.region)
                  .map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { species, region })}>Move to {REGION_LABEL[region]}</button>)}
                <button className="secondary" disabled={busy} onClick={() => send('choose', { skip: true })}>Skip</button>
              </div>
            </>
          )}
        </section>
      )}

      <BoardView game={game} seat={seat} players={players} />

      {!myChoice && (
        <section className="panel stack" aria-label="Your hand">
          <h3>Your hand ({hand.length})</h3>
          <div className="hand">
            {hand.map((card) => (
              <CardFace key={card.uid} card={card} selected={selected === card.uid} disabled={!myTurn || !playable(card.card)} onClick={() => setSelected(selected === card.uid ? null : card.uid)} />
            ))}
          </div>
          {myTurn && selectedDef && (
            <div className="stack play-panel">
              {selectedDef.id === 'bison' && enemyControlled.length > 0 && (
                <label>Bison target (enemy-controlled region)<select value={target} onChange={(event) => setTarget(event.target.value)}>
                  <option value="">Choose…</option>
                  {enemyControlled.map((region) => <option key={region} value={region}>{REGION_LABEL[region]}</option>)}
                </select></label>
              )}
              {selectedDef.id === 'algae' && (
                <label>Algae boosts which region?<select value={target} onChange={(event) => setTarget(event.target.value)}>
                  <option value="">Choose…</option>
                  {REGION_ORDER.map((region) => <option key={region} value={region}>{REGION_LABEL[region]}</option>)}
                </select></label>
              )}
              {selectedDef.id === 'migrate' && (
                <label>Species to move<select value={species} onChange={(event) => setSpecies(event.target.value)}>
                  <option value="">Choose…</option>
                  {myMovers.map((item) => <option key={item.uid} value={item.uid}>{titleOf(item.card)} in {REGION_LABEL[item.region]}</option>)}
                </select></label>
              )}
              <div className="row">
                {selectedDef.kind === 'species'
                  ? selectedDef.regions!.map((region) => <button key={region} disabled={busy} onClick={() => playTo(region)}>Play to {REGION_LABEL[region]}</button>)
                  : spellNeedsRegion(selectedDef.id)
                    ? REGION_ORDER.map((region) => <button key={region} disabled={busy} onClick={() => playTo(region)}>Cast on {REGION_LABEL[region]}</button>)
                    : <button disabled={busy} onClick={() => playTo()}>Cast {titleOf(selectedDef.id)}</button>}
              </div>
            </div>
          )}
          <div className="row">
            {myTurn && <button disabled={busy} onClick={() => send('pass')}>{game.phase === 'deploy' ? 'End deployment' : 'End turn and settle'}</button>}
            {!finished && (
              <button className="secondary" disabled={busy} onClick={() => window.confirm('Concede this match?') && send('concede')}>Concede</button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
