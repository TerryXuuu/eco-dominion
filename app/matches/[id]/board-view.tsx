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
  const why = { score: 'on final score', domination: 'by domination', concession: 'by surrender', timeout: 'on timeouts' }[reason] ?? reason;
  return `${headline} ${why}${scores ? ` (${scores[seat]}–${scores[1 - seat]})` : ''}`;
}

function TableCard({ card }: { card: CardInstance }) {
  const def = CARD_BY_ID[card.card];
  return (
    <figure className="table-card" title={`${titleOf(def.id)} · power ${def.power ?? '—'} · ${def.effect}`}>
      <img src={`/cards/${def.id}.jpg`} alt={titleOf(def.id)} />
      <figcaption>
        <span>{titleOf(def.id)}</span>
        {def.power !== undefined && <b>{def.power}</b>}
      </figcaption>
    </figure>
  );
}

function EnergyOrb({ energy, max, reserve, label }: { energy: number; max: number; reserve: number; label: string }) {
  return (
    <div className="pod energy" aria-label={label}>
      <span className="orb">{energy}</span>
      <small>of {max}</small>
      <span className="pips" aria-label={`Reserve ${reserve}`}>
        {[0, 1, 2].map((pip) => <i key={pip} className={pip < reserve ? 'on' : ''} />)}
      </span>
    </div>
  );
}

function CardPile({ count, label, face }: { count: number; label: string; face?: string }) {
  return (
    <div className="pod pile-pod" aria-label={label}>
      <span className="pile">
        <i />
        <i />
        {face ? <img src={face} alt="" /> : <i className="back" />}
      </span>
      <b>{count}</b>
      <small>{label}</small>
    </div>
  );
}

export function BoardView({ game, seat, players }: { game: Projection; seat: Seat; players: Player[] }) {
  const opponent = (1 - seat) as Seat;
  const me = game.players[seat];
  const them = game.players[opponent];
  const event = game.event ? CARD_BY_ID[game.event] : null;
  return (
    <div className="stadium">
      <div className="stadium-rail theirs">
        <EnergyOrb energy={them.energy} max={them.max} reserve={them.reserve} label={`${nameOf(players, opponent)} energy`} />
        <div className="rail-name">
          <strong>{nameOf(players, opponent)}</strong>
          <span>Turn {them.turns}/8</span>
        </div>
        <CardPile count={them.handCount} label="Hand" />
      </div>

      <div className="felt" aria-label="Regions">
        <div className="felt-center">
          {event ? (
            <figure className="event-float">
              <img src={`/cards/${event.id}.jpg`} alt="" />
              <figcaption>
                <strong>{titleOf(event.id)}</strong>
                <span lang="zh">{event.name}</span>
                <span>{event.effect}</span>
              </figcaption>
            </figure>
          ) : <p className="event-float empty">No event yet</p>}
          <details className="discard-float">
            <summary>Discard {game.discard.length}</summary>
            <p>{game.discard.map((card) => titleOf(card.card)).join(', ') || 'Empty'}</p>
          </details>
        </div>
        <div className="lanes">
          {REGION_ORDER.map((region) => {
            const info = game.regions[region];
            const holder = info.controller === null ? 'Neutral' : info.controller === seat ? 'You' : 'Opponent';
            return (
              <article key={region} className={`lane ${info.controller === seat ? 'mine' : info.controller === opponent ? 'theirs' : ''}`}>
                <div className="lane-row">
                  {game.board.filter((item) => item.region === region && item.owner === opponent).map((item) => <TableCard key={item.uid} card={item} />)}
                  {game.board.every((item) => item.region !== region || item.owner !== opponent) && <span className="slot" aria-hidden="true" />}
                </div>
                <header>
                  <strong>{REGION_LABEL[region]}</strong>
                  <span>Stability {info.stability} · {holder}</span>
                  <span>You {info.power[seat]} · opponent {info.power[opponent]}{(info.penalty[seat] > 0 || info.penalty[opponent] > 0) ? ` · penalty ${info.penalty[seat]}/${info.penalty[opponent]}` : ''}</span>
                </header>
                <div className="lane-row">
                  {game.board.filter((item) => item.region === region && item.owner === seat).map((item) => <TableCard key={item.uid} card={item} />)}
                  {game.board.every((item) => item.region !== region || item.owner !== seat) && <span className="slot" aria-hidden="true" />}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="stadium-rail mine">
        <EnergyOrb energy={me.energy} max={me.max} reserve={me.reserve} label="Your energy" />
        <div className="rail-name">
          <strong>{nameOf(players, seat)}</strong>
          <span>You · turn {me.turns}/8</span>
        </div>
        <CardPile count={game.deckCount} label="Deck" face="/brand/logo.jpg" />
        <CardPile count={game.eventDeckCount} label="Events" />
      </div>
    </div>
  );
}
