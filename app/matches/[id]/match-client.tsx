'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Region, Seat } from '@/src/engine.mjs';
import type { MatchView } from '@/lib/match-service';
import { CARD_BY_ID, REGION_ORDER } from '@/lib/cards';
import { anyLegalPlay, cardPlay } from '@/lib/hand-actions';
import { cardTitle, phaseLabel, say } from '@/lib/locale-text';
import { callApi } from '../../components/call-api';
import { LanguageSwitch } from '../../components/language-switch';
import { ThemeSwitch } from '../../components/theme-switch';
import { useArt } from '../../components/art-context';
import { copy, type Lang } from '@/lib/i18n';
import { BoardView } from './board-view';
import { HandFan } from './hand-fan';
import { MatchReport } from './match-report';
import { PlaySheet, type PlayDraft } from './play-sheet';

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

export function MatchClient({ initial, lang }: { initial: MatchView; lang: Lang }) {
  const text = copy(lang).table;
  const art = useArt();
  const [view, setView] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [discardUid, setDiscardUid] = useState<string | null>(null);
  const [species, setSpecies] = useState('');
  const [draft, setDraft] = useState<PlayDraft | null>(null);
  const [hotRegion, setHotRegion] = useState<string | null>(null);
  const lastInput = useRef(Date.now());
  const versionRef = useRef(view.version);
  versionRef.current = view.version;

  const refresh = useCallback(async () => {
    const { ok, status, data } = await callApi<MatchView | Unchanged>(`/api/matches/${initial.id}?v=${versionRef.current}`);
    if (ok && !('unchanged' in data)) setView(data);
    else if (ok) setView((current) => ({ ...current, deadline: data.deadline }));
    else if (status === 0 || status === 503) setError(say(lang, 'Connection lost; reconnecting…', '连接中断，正在重连…'));
    if (ok) setError((message) => (message.startsWith('Connection lost') || message.startsWith('连接中断') ? '' : message));
  }, [initial.id, lang]);

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
    setDiscardUid(null);
    setSpecies('');
  }, [view.version]);

  useEffect(() => {
    setDraft((current) => {
      if (!current) return null;
      const hand = view.game.players[view.seat].hand ?? [];
      const card = hand.find((item) => item.uid === current.uid);
      const playing = view.status !== 'finished' && !view.game.result && !view.game.pending && view.game.active === view.seat && (view.game.phase === 'deploy' || view.game.phase === 'tactics');
      return playing && card && cardPlay(view.game, view.seat, card).legal ? current : null;
    });
  }, [view]);

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
      setError(reply.data.error ?? say(lang, 'Something went wrong; try again', '出了点问题，请再试一次'));
      if (reply.status === 409) refresh();
    }
  }

  const { game, seat, players } = view;
  const countdown = useCountdown(view.deadline);
  const finished = view.status === 'finished' || Boolean(game.result);
  const pending = game.pending;
  const myChoice = pending && pending.owner === seat ? pending : null;
  const myTurn = !finished && !pending && game.active === seat && (game.phase === 'deploy' || game.phase === 'tactics');
  const noLegalPlay = myTurn && !anyLegalPlay(game, seat);
  const practice = players.some((player) => player.seat !== seat && (player.handle === 'robot' || player.handle === 'grove'));
  const clockMine = view.clockSeat === seat;
  const myMovers = game.board.filter((item) => item.owner === seat && (CARD_BY_ID[item.card].regions?.length ?? 0) > 1);
  const pendingCard = draft ? (game.players[seat].hand ?? []).find((card) => card.uid === draft.uid) : null;
  const discardCard = discardUid ? (game.players[seat].hand ?? []).find((card) => card.uid === discardUid) : null;

  function beginPlay(uid: string, region?: Region) {
    const card = (game.players[seat].hand ?? []).find((item) => item.uid === uid);
    if (!card || (draft && draft.uid !== uid)) return;
    const plan = cardPlay(game, seat, card);
    if (!plan.legal) return;
    const dropped = region && plan.regions.includes(region) ? region : undefined;
    if (!plan.needsTarget && !plan.needsSpecies && (plan.immediate || dropped)) {
      send('play', dropped ? { uid, region: dropped } : plan.immediate!);
      return;
    }
    setDraft({ ...(draft ?? { uid }), uid, open: true, ...(dropped ? { region: dropped } : {}) });
  }

  return (
    <>
      <header className="hud">
        <a href="/play">{finished ? text.backToLobby : text.leave}</a>
        <strong>{practice ? text.practice : view.mode === 'ranked' ? text.ranked : view.mode === 'casual' ? text.casual : text.private}</strong>
        <span>
          {finished ? text.over : clockMine ? (myChoice ? text.yourChoice : text.yourTurn) : pending ? (practice ? text.groveChoosing : text.opponentChoosing) : practice ? text.grovePlaying : text.opponentTurn}
          {!finished && <> · {phaseLabel(lang, game.phase)}</>}
          {countdown !== null && !finished && <> · <span className={countdown <= 10 ? 'urgent' : ''}>{countdown}s</span></>}
          {view.timeouts[seat] > 0 && !finished && <> · {text.timeouts} {view.timeouts[seat]}/3</>}
        </span>
        <span className="hud-actions">
          <ThemeSwitch theme={art.theme} />
          <LanguageSwitch lang={lang} />
          {myTurn && <button className={noLegalPlay ? 'end-turn-nudge' : undefined} disabled={busy} onClick={() => send('pass')}>{text.endTurn}</button>}
          {!finished && <button className="secondary" disabled={busy} onClick={() => window.confirm(text.surrenderAsk) && send('concede')}>{text.surrender}</button>}
        </span>
      </header>
      {error && <p className="hud-error" role="alert">{error}</p>}

      {finished ? (
        <div className="table-end">
          <MatchReport game={game} seat={seat} players={players} timeouts={view.timeouts} rating={view.rating} />
        </div>
      ) : (
      <div className="table-stage">
        <BoardView lang={lang} game={game} seat={seat} players={players} hotRegion={hotRegion} />
        {draft?.open && (
          <PlaySheet
            game={game}
            seat={seat}
            draft={draft}
            busy={busy}
            lang={lang}
            onChange={setDraft}
            onCommit={(play) => send('play', play)}
            onPeek={() => setDraft({ ...draft, open: false })}
            onCancel={() => setDraft(null)}
          />
        )}
        {draft && !draft.open && pendingCard && (
          <button type="button" className="resume-choice" onClick={() => setDraft({ ...draft, open: true })}>
            {text.resumeChoice} · {cardTitle(lang, pendingCard.card)}
          </button>
        )}
        {myChoice?.kind === 'discard' && discardCard && (
          <section className="play-pop" aria-label={text.discardAsk}>
            <div className="play-pop-card">
              <img src={art.card(discardCard.card)} alt="" />
              <div>
                <h3>{text.discardAsk}</h3>
                <p>{cardTitle(lang, discardCard.card)}</p>
                <p className="note">{text.discardExactly} {myChoice.count}</p>
              </div>
            </div>
            <div className="row">
              <button type="button" disabled={busy} onClick={() => send('choose', { uids: [discardUid] })}>{text.discardYes}</button>
              <button type="button" className="secondary" onClick={() => setDiscardUid(null)}>{text.discardNo}</button>
            </div>
          </section>
        )}

        {myChoice && myChoice.kind !== 'discard' && (
          <section className="choice-bar" aria-label={text.yourChoice}>
            {myChoice.kind === 'rest' && (
              <>
                <strong>{text.rest}</strong>
                <div className="row">{(myChoice.options ?? []).map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { region })}>{copy(lang).region[region]}</button>)}</div>
              </>
            )}
            {myChoice.kind === 'invasion' && (
              <>
                <strong>{text.invasion}</strong>
                <div className="row">{REGION_ORDER.map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { region })}>{copy(lang).region[region]}</button>)}</div>
              </>
            )}
            {myChoice.kind === 'migration' && (
              <>
                <strong>{text.migration}</strong>
                <label>{text.species}<select value={species} onChange={(event) => setSpecies(event.target.value)}>
                  <option value="">{text.choose}</option>
                  {myMovers.map((item) => <option key={item.uid} value={item.uid}>{cardTitle(lang, item.card)} {text.in} {copy(lang).region[item.region]}</option>)}
                </select></label>
                <div className="row">
                  {species && CARD_BY_ID[myMovers.find((item) => item.uid === species)!.card].regions!
                    .filter((region) => region !== myMovers.find((item) => item.uid === species)!.region)
                    .map((region) => <button key={region} disabled={busy} onClick={() => send('choose', { species, region })}>{text.moveTo} {copy(lang).region[region]}</button>)}
                  <button className="secondary" disabled={busy} onClick={() => send('choose', { skip: true })}>{text.skip}</button>
                </div>
              </>
            )}
          </section>
        )}

        <div className="hand-dock">
          {myChoice?.kind === 'discard' ? (
            <HandFan
              lang={lang}
              game={game}
              seat={seat}
              busy={busy}
              myTurn={false}
              mode="discard"
              dock
              prompt={<p className="dock-prompt">{text.discardHow} {text.discardExactly} {myChoice.count}</p>}
              onPlay={() => undefined}
              onDiscard={setDiscardUid}
            />
          ) : !myChoice && (
            <HandFan
              lang={lang}
              game={game}
              seat={seat}
              busy={busy}
              myTurn={myTurn}
              mode="play"
              dock
              onPlay={(play) => send('play', play)}
              onBegin={beginPlay}
              onDragHover={setHotRegion}
              pendingUid={draft?.uid ?? null}
            />
          )}
        </div>
      </div>
      )}
    </>
  );
}
