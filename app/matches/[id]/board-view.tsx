import type { CardInstance, Projection, Seat } from '@/src/engine.mjs';
import { CARD_BY_ID, KIND_LABEL, REGION_LABEL, REGION_ORDER, titleOf } from '@/lib/cards';

export type Player = { seat: Seat; handle: string; displayName: string };

export function CardFace({ card, selected, onClick, disabled }: { card: CardInstance; selected?: boolean; onClick?: () => void; disabled?: boolean }) {
  const def = CARD_BY_ID[card.card];
  const body = (
    <>
      <img className="card-art" src={`/cards/${def.id}.jpg`} alt="" />
      <span className="card-head">
        <strong>{titleOf(def.id)}</strong>
        {def.cost !== undefined && <span className="cost" title="Cost">{def.cost}</span>}
      </span>
      <span className="card-name" lang="zh">{def.name}</span>
      <span className="card-meta">
        {KIND_LABEL[def.kind]}
        {def.power !== undefined && ` · power ${def.power}`}
        {def.regions && ` · ${def.regions.map((region) => REGION_LABEL[region]).join('/')}`}
      </span>
      <span className="card-effect">{def.effect}</span>
    </>
  );
  if (!onClick) return <div className={`card ${def.kind}`}>{body}</div>;
  return (
    <button type="button" className={`card ${def.kind}${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={onClick} disabled={disabled}>
      {body}
    </button>
  );
}

const nameOf = (players: Player[], seat: Seat) => players.find((player) => player.seat === seat)?.displayName ?? `Seat ${seat + 1}`;

export function resultText(game: Projection, seat: Seat, players: Player[]) {
  if (!game.result) return null;
  const { winner, reason, scores } = game.result;
  const headline = winner === null ? 'Draw' : winner === seat ? 'You won' : `${nameOf(players, winner)} won`;
  const why = { score: 'on final score', domination: 'by domination', concession: 'by concession', timeout: 'on timeouts' }[reason] ?? reason;
  return `${headline} ${why}${scores ? ` (${scores[seat]}–${scores[1 - seat]})` : ''}`;
}

export function BoardView({ game, seat, players }: { game: Projection; seat: Seat; players: Player[] }) {
  const opponent = (1 - seat) as Seat;
  const me = game.players[seat];
  const them = game.players[opponent];
  const event = game.event ? CARD_BY_ID[game.event] : null;
  return (
    <div className="stack">
      <section className="panel seat-strip" aria-label="Opponent">
        <strong>{nameOf(players, opponent)}</strong>
        <span>Turn {them.turns}/8</span>
        <span>Energy {them.energy}/{them.max}</span>
        <span>Reserve {them.reserve}</span>
        <span>{them.handCount} cards in hand</span>
      </section>

      <section className="regions" aria-label="Regions">
        {REGION_ORDER.map((region) => {
          const info = game.regions[region];
          const holder = info.controller === null ? 'Neutral' : info.controller === seat ? 'You control' : 'Opponent controls';
          return (
            <article key={region} className={`panel region ${info.controller === seat ? 'mine' : info.controller === opponent ? 'theirs' : ''}`}>
              <h3>{REGION_LABEL[region]}</h3>
              <p className="region-stats">
                Stability <strong>{info.stability}</strong> · {holder}
              </p>
              <p className="region-stats">
                Power: you {info.power[seat]} · them {info.power[opponent]}
                {(info.penalty[seat] > 0 || info.penalty[opponent] > 0) && ` · penalty ${info.penalty[seat]}/${info.penalty[opponent]}`}
              </p>
              {[opponent, seat].map((owner) => {
                const species = game.board.filter((item) => item.region === region && item.owner === owner);
                return (
                  <div key={owner} className="side">
                    <span className="side-label">{owner === seat ? 'Yours' : 'Theirs'}</span>
                    {species.length ? species.map((item) => <CardFace key={item.uid} card={item} />) : <span className="note">—</span>}
                  </div>
                );
              })}
            </article>
          );
        })}
      </section>

      <section className="panel seat-strip" aria-label="You">
        <strong>{nameOf(players, seat)} (you)</strong>
        <span>Turn {me.turns}/8</span>
        <span>Energy {me.energy}/{me.max}</span>
        <span>Reserve {me.reserve}</span>
        <span>Deck {game.deckCount} · events left {game.eventDeckCount}</span>
      </section>

      <section className="panel stack">
        <h3>Event</h3>
        {event ? (
          <figure className="event-art">
            <img src={`/cards/${event.id}.jpg`} alt="" />
            <figcaption><strong>{titleOf(event.id)}</strong> <span lang="zh">{event.name}</span> — {event.effect}</figcaption>
          </figure>
        ) : <p className="note">No event yet.</p>}
        <details>
          <summary>Shared discard ({game.discard.length})</summary>
          <p className="note">{game.discard.map((card) => titleOf(card.card)).join(', ') || 'Empty'}</p>
        </details>
      </section>
    </div>
  );
}
