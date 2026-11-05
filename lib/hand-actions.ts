import type { CardInstance, Projection, Region, Seat } from '../src/engine.mjs';
import { CARD_BY_ID, REGION_ORDER } from './cards.ts';

const REGION_SPELLS = new Set(['fortify', 'bloom', 'infuse', 'erode', 'break', 'veil', 'destroy', 'migrate']);
const PAIRS: [string, string][] = [
  ['mouse', 'deer'],
  ['beetle', 'ray'],
  ['fox', 'lizard'],
  ['heron', 'beaver'],
  ['snake', 'ray'],
  ['panther', 'bison'],
];

export type CardPlan = {
  legal: boolean;
  reason: string | null;
  /** A complete play command when the card needs no further choice. */
  immediate: { uid: string; region?: Region } | null;
  regions: Region[];
  needsTarget: boolean;
  needsSpecies: boolean;
};

const none = (reason: string): CardPlan => ({ legal: false, reason, immediate: null, regions: [], needsTarget: false, needsSpecies: false });

function enemySynergy(game: Projection, region: Region, opponent: Seat) {
  if (game.regions[region].stability <= 0) return false;
  const present = game.board.filter((item) => item.region === region && item.owner === opponent).map((item) => item.card);
  return PAIRS.some((pair) => pair.every((id) => present.includes(id)));
}

function spellRegions(game: Projection, seat: Seat, id: string): Region[] {
  const opponent = (1 - seat) as Seat;
  return REGION_ORDER.filter((region) => {
    if (id === 'fortify' || id === 'infuse') return game.regions[region].controller === seat;
    if (id === 'erode') return game.regions[region].controller === opponent;
    if (id === 'veil') return game.board.some((item) => item.region === region && item.owner === opponent);
    if (id === 'break') return enemySynergy(game, region, opponent);
    return true;
  });
}

/** Whether this card can be played on the current projection, and which choices it still needs. */
export function cardPlay(game: Projection, seat: Seat, card: CardInstance): CardPlan {
  const def = CARD_BY_ID[card.card];
  if (!def || def.kind === 'event') return none('This card cannot be played from hand');
  if (game.phase !== 'deploy' && game.phase !== 'tactics') return none('Cards are played on your turn');
  const mine = game.players[seat];
  const cost = def.cost ?? 0;
  const funds = def.kind === 'species' ? mine.energy : mine.energy + mine.reserve;
  if (funds < cost) return none('Not enough energy');
  const opponent = (1 - seat) as Seat;

  if (def.kind === 'species') {
    if (def.id === 'guardian' && game.board.some((item) => item.owner === seat && item.card === 'guardian')) return none('A guardian is already in play');
    const regions = def.regions ?? [];
    const enemyControlled = REGION_ORDER.filter((region) => game.regions[region].controller === opponent);
    const needsTarget = def.id === 'algae' || (def.id === 'bison' && enemyControlled.length > 0);
    const immediate = regions.length === 1 && !needsTarget ? { uid: card.uid, region: regions[0] } : null;
    return { legal: regions.length > 0, reason: regions.length ? null : 'No legal region', immediate, regions, needsTarget, needsSpecies: false };
  }

  if (def.id === 'migrate') {
    const movers = game.board.filter((item) => item.owner === seat && (CARD_BY_ID[item.card].regions?.length ?? 0) > 1);
    if (!movers.length) return none('No species can migrate');
    return { legal: true, reason: null, immediate: null, regions: [], needsTarget: false, needsSpecies: true };
  }
  if (!REGION_SPELLS.has(def.id)) return { legal: true, reason: null, immediate: { uid: card.uid }, regions: [], needsTarget: false, needsSpecies: false };

  const regions = spellRegions(game, seat, def.id);
  if (!regions.length) return none('No legal region for this spell');
  return {
    legal: true,
    reason: null,
    immediate: regions.length === 1 ? { uid: card.uid, region: regions[0] } : null,
    regions,
    needsTarget: false,
    needsSpecies: false,
  };
}

export function anyLegalPlay(game: Projection, seat: Seat) {
  const hand = game.players[seat].hand ?? [];
  return hand.some((card) => cardPlay(game, seat, card).legal);
}
