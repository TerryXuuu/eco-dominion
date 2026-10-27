'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Seat } from '@/src/engine.mjs';
import type { MatchView } from '@/lib/match-service';
import { CARD_BY_ID, REGION_LABEL, REGION_ORDER, titleOf } from '@/lib/cards';
import { anyLegalPlay } from '@/lib/hand-actions';
import { callApi } from '../../components/call-api';
import { BoardView } from './board-view';
import { HandFan } from './hand-fan';
import { MatchReport } from './match-report';

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
  const [picks, setPicks] = useState<string[]>([]);
  const [species, setSpecies] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(true);
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
      if (stopped) return;
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
    setPicks([]);
    setSpecies('');
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
  const countdown = useCountdown(view.deadline);
  const finished = view.status === 'finished' || Boolean(game.result);
  const pending = game.pending;
  const myChoice = pending && pending.owner === seat ? pending : null;
  const myTurn = !finished && !pending && game.active === seat && (game.phase === 'deploy' || game.phase === 'tactics');
  const canPlay = myTurn && anyLegalPlay(game, seat);
  const practice = players.some((player) => player.seat !== seat && player.handle === 'grove');
  const clockMine = view.clockSeat === seat;
  const myMovers = game.board.filter((item) => item.owner === seat && (CARD_BY_ID[item.card].regions?.length ?? 0) > 1);

  async function newGame() {
    if (!practice) {
      window.location.assign('/play');
      return;
    }
    setBusy(true);
    setError('');
    const reply = await callApi<{ matchId?: string; error?: string }>('/api/practice', { method: 'POST' });
    if (reply.ok && reply.data.matchId && reply.data.matchId !== view.id) {
      window.location.assign(`/matches/${reply.data.matchId}`);
      return;
    }
    setBusy(false);
    setError(reply.data.error ?? 'Could not start a new game');
  }

  return (
    <>
      <header className="hud">
        <Link href="/play">Leave</Link>
        <strong>{practice ? 'Practice' : view.mode === 'casual' ? 'Casual' : 'Private'}</strong>
        <span>
          {finished ? 'Match over' : clockMine ? (myChoice ? 'Your choice' : 'Your turn') : pending ? (practice ? 'Grove is choosing' : 'Opponent is choosing') : practice ? 'Grove is playing' : "Opponent's turn"}
          {!finished && <> · {game.phase}</>}
          {countdown !== null && !finished && <> · <span className={countdown <= 10 ? 'urgent' : ''}>{countdown}s</span></>}
          {view.timeouts[seat] > 0 && !finished && <> · timeouts {view.timeouts[seat]}/3</>}
        </span>
        <span className="hud-actions">
          {finished && (
            <>
              <button type="button" disabled={busy} onClick={() => void newGame()}>New game</button>
              <button type="button" className="secondary" onClick={() => setSummaryOpen((open) => !open)}>{summaryOpen ? 'Close summary' : 'Summary'}</button>
            </>
          )}
          {canPlay && <button disabled={busy} onClick={() => send('pass')}>{game.phase === 'deploy' ? 'End deployment' : 'Settle'}</button>}
          {!finished && <button className="secondary" disabled={busy} onClick={() => window.confirm('Surrender this match? The other player wins.') && send('concede')}>Surrender</button>}
        </span>
      </header>
      {error && <p className="hud-error" role="alert">{error}</p>}

      <div className="table-stage">
        <BoardView game={game} seat={seat} players={players} />

        {finished && summaryOpen && (
          <div className="table-overlay">
            <MatchReport game={game} seat={seat} players={players} timeouts={view.timeouts} rating={view.rating} matchId={view.id} onClose={() => setSummaryOpen(false)} />
          </div>
        )}

        {myChoice && myChoice.kind !== 'discard' && (
          <section className="choice-bar" aria-label="Your choice">
            {myChoice.kind === 'rest' && (
              <>
                <strong>Rest: add 2 stability</strong>
                <div className="row">{(myChoice.options ?? []).map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { region })}>{REGION_LABEL[region]}</button>)}</div>
              </>
            )}
            {myChoice.kind === 'invasion' && (
              <>
                <strong>Invasion: choose the region</strong>
                <div className="row">{REGION_ORDER.map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { region })}>{REGION_LABEL[region]}</button>)}</div>
              </>
            )}
            {myChoice.kind === 'migration' && (
              <>
                <strong>Migration</strong>
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

        <div className="hand-dock">
          {myChoice?.kind === 'discard' ? (
            <HandFan
              game={game}
              seat={seat}
              busy={busy}
              myTurn={false}
              mode="discard"
              dock
              prompt={<p className="dock-prompt">Discard exactly {myChoice.count}</p>}
              extra={<button type="button" className="dock-act" disabled={busy || picks.length !== myChoice.count} onClick={() => send('choose', { uids: picks })}>Discard selected</button>}
              picked={picks}
              onPlay={() => undefined}
              onToggle={(uid) => setPicks((current) => (current.includes(uid) ? current.filter((item) => item !== uid) : [...current, uid]))}
            />
          ) : !myChoice && (
            <HandFan
              game={game}
              seat={seat}
              busy={busy}
              myTurn={myTurn}
              mode="play"
              dock
              onPlay={(play) => send('play', play)}
              onPass={() => send('pass')}
            />
          )}
        </div>
      </div>
    </>
  );
}
