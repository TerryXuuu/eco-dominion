import type { CardInstance, Projection, Seat } from '@/src/engine.mjs';
import { CARD_BY_ID, REGION_ORDER } from '@/lib/cards';
import { copy, type Lang } from '@/lib/i18n';
import { cardTitle, say, shownEffect } from '@/lib/locale-text';
import { useArt } from '../../components/art-context';

export type Player = { seat: Seat; handle: string; displayName: string };

export function CardFace({ card, selected, onClick, disabled }: { card: CardInstance; selected?: boolean; onClick?: () => void; disabled?: boolean }) {
  const art = useArt();
  const text = copy(art.lang);
  const def = CARD_BY_ID[card.card];
  const body = (
    <>
      <img className="card-art" src={art.card(def.id)} alt="" />
      <span className="card-head">
        <strong>{cardTitle(art.lang, def.id)}</strong>
        {def.cost !== undefined && <span className="cost" title={text.library.cost}>{def.cost}</span>}
      </span>
      {art.lang === 'en' && <span className="card-name" lang="zh">{def.name}</span>}
      <span className="card-meta">
        {text.kind[def.kind as keyof typeof text.kind] ?? def.kind}
        {def.power !== undefined && ` · ${text.library.power} ${def.power}`}
        {def.regions && ` · ${def.regions.map((region) => text.region[region]).join('/')}`}
      </span>
      <span className="card-effect">{shownEffect(art.lang, def.id, def.effect)}</span>
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

export function resultText(game: Projection, seat: Seat, players: Player[], lang: Lang = 'en') {
  if (!game.result) return null;
  const { winner, reason, scores } = game.result;
  const headline = winner === null
    ? say(lang, 'Draw', '平局')
    : winner === seat
      ? say(lang, 'You won', '你赢了')
      : say(lang, `${nameOf(players, winner)} won`, `${nameOf(players, winner)} 获胜`);
  const why = {
    score: say(lang, 'on final score', '按终局得分'),
    domination: say(lang, 'by domination', '以支配'),
    concession: say(lang, 'by surrender', '因认输'),
    timeout: say(lang, 'on timeouts', '因超时'),
  }[reason] ?? reason;
  return `${headline} ${why}${scores ? ` (${scores[seat]}–${scores[1 - seat]})` : ''}`;
}

function TableCard({ card }: { card: CardInstance }) {
  const art = useArt();
  const def = CARD_BY_ID[card.card];
  const title = cardTitle(art.lang, def.id);
  return (
    <figure className="table-card" title={`${title} · ${art.lang === 'zh' ? '力量' : 'power'} ${def.power ?? '—'} · ${shownEffect(art.lang, def.id, def.effect)}`}>
      <img src={art.card(def.id)} alt={title} />
      <figcaption>
        <span>{title}</span>
        {def.power !== undefined && <b>{def.power}</b>}
      </figcaption>
    </figure>
  );
}

function EnergyOrb({ energy, max, reserve, label, lang }: { energy: number; max: number; reserve: number; label: string; lang: Lang }) {
  return (
    <div className="pod energy" aria-label={label}>
      <span className="orb">{energy}</span>
      <small>{say(lang, `of ${max}`, `上限 ${max}`)}</small>
      <span className="pips" aria-label={`${say(lang, 'Reserve', '储备')} ${reserve}`}>
        {[0, 1, 2].map((pip) => <i key={pip} className={pip < reserve ? 'on' : ''} />)}
      </span>
    </div>
  );
}

function CardPile({ count, label, face, className }: { count: number; label: string; face?: string; className?: string }) {
  return (
    <div className={`pod pile-pod${className ? ` ${className}` : ''}`} aria-label={label}>
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

export function BoardView({ game, seat, players, lang = 'en' }: { game: Projection; seat: Seat; players: Player[]; lang?: Lang }) {
  const text = copy(lang);
  const art = useArt();
  const opponent = (1 - seat) as Seat;
  const me = game.players[seat];
  const them = game.players[opponent];
  const event = game.event ? CARD_BY_ID[game.event] : null;
  return (
    <div className="stadium">
      <div className="seat-pod theirs">
        <EnergyOrb lang={lang} energy={them.energy} max={them.max} reserve={them.reserve} label={say(lang, `${nameOf(players, opponent)} energy`, `${nameOf(players, opponent)} 的能量`)} />
        <div className="rail-name">
          <strong>{nameOf(players, opponent)}</strong>
          <span>{text.table.turn} {them.turns}/8</span>
        </div>
      </div>
      <CardPile className="hand-pile" count={them.handCount} label={text.table.hand} />

      <div className="felt-slot">
      <div className="felt" aria-label={say(lang, 'Regions', '区域')}>
        <div className="felt-center">
          {event ? (
            <figure className="event-float">
              <img src={art.card(event.id)} alt="" />
              <figcaption>
                <strong>{cardTitle(lang, event.id)}</strong>
                {lang === 'en' && <span lang="zh">{event.name}</span>}
                <span>{shownEffect(lang, event.id, event.effect)}</span>
              </figcaption>
            </figure>
          ) : <p className="event-float empty">{text.table.noEvent}</p>}
          <details className="discard-float">
            <summary>{text.table.discard} {game.discard.length}</summary>
            <p>{game.discard.map((card) => cardTitle(lang, card.card)).join(', ') || text.table.empty}</p>
          </details>
        </div>
        <div className="lanes">
          {REGION_ORDER.map((region) => {
            const info = game.regions[region];
            const holder = info.controller === null ? text.table.neutral : info.controller === seat ? text.table.you : text.table.opponent;
            return (
              <article key={region} className={`lane ${info.controller === seat ? 'mine' : info.controller === opponent ? 'theirs' : ''}`}>
                <div className="lane-row theirs">
                  <span className="side-label">{text.table.opponent}</span>
                  {game.board.filter((item) => item.region === region && item.owner === opponent).map((item) => <TableCard key={item.uid} card={item} />)}
                  {game.board.every((item) => item.region !== region || item.owner !== opponent) && <span className="slot" aria-hidden="true" />}
                </div>
                <header>
                  <strong>{text.region[region]}</strong>
                  <span>{holder} · {text.table.stability} {info.stability}</span>
                  <span>{text.table.you} {info.power[seat]} · {text.table.opponent} {info.power[opponent]}{(info.penalty[seat] > 0 || info.penalty[opponent] > 0) ? ` · ${text.table.penalty} ${info.penalty[seat]}/${info.penalty[opponent]}` : ''}</span>
                </header>
                <div className="lane-row mine">
                  <span className="side-label">{text.table.you}</span>
                  {game.board.filter((item) => item.region === region && item.owner === seat).map((item) => <TableCard key={item.uid} card={item} />)}
                  {game.board.every((item) => item.region !== region || item.owner !== seat) && <span className="slot" aria-hidden="true" />}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      </div>

      <div className="seat-pod mine">
        <EnergyOrb lang={lang} energy={me.energy} max={me.max} reserve={me.reserve} label={say(lang, 'Your energy', '你的能量')} />
        <div className="rail-name">
          <strong>{nameOf(players, seat)}</strong>
          <span>{text.table.youTurn} {me.turns}/8</span>
        </div>
      </div>
      <div className="pile-row">
        <CardPile count={game.deckCount} label={text.table.deck} face={art.logo} />
        <CardPile count={game.eventDeckCount} label={text.table.events} />
      </div>
    </div>
  );
}
