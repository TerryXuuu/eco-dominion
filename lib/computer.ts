import { randomUUID } from 'node:crypto';
import type { EngineCommand, GameState, Seat } from '../src/engine.mjs';
import { CARD_BY_ID, REGION_ORDER } from './cards.ts';
import { project } from './engine.ts';
import { cardPlay } from './hand-actions.ts';
import { applyCommand } from './match-rules.ts';

/** Fixed app_user for the unrated practice opponent. Not a sign-in account. */
export const COMPUTER_USER_ID = '00000000-0000-4000-8000-0000000000c0';
export const COMPUTER_HANDLE = 'grove';

const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

/** One legal command for Grove, or null when the clock belongs to the human. */
export function chooseComputer(game: GameState, seat: Seat): EngineCommand | null {
  if (game.result) return null;
  const clock = game.choices.length ? game.choices[0].owner : game.active;
  if (clock !== seat) return null;
  const id = randomUUID();
  if (game.choices.length) return choiceFor(game, id);
  if (game.phase !== 'deploy' && game.phase !== 'tactics') return null;
  return playOrPass(game, seat, id);
}

function choiceFor(game: GameState, id: string): EngineCommand {
  const choice = game.choices[0];
  const command: EngineCommand = { id, version: game.version, type: 'choose' };
  if (choice.kind === 'discard') {
    const ranked = [...game.players[choice.owner].hand].sort(
      (a, b) => (CARD_BY_ID[a.card]?.cost ?? 0) - (CARD_BY_ID[b.card]?.cost ?? 0),
    );
    return { ...command, uids: ranked.slice(0, choice.count).map((card) => card.uid) };
  }
  if (choice.kind === 'rest') return { ...command, region: choice.options[0] };
  if (choice.kind === 'migration') return { ...command, skip: true };
  return { ...command, region: choice.kind === 'invasion' ? choice.options[0] : 'forest' };
}

function playOrPass(game: GameState, seat: Seat, id: string): EngineCommand {
  const view = project(game, seat);
  const hand = view.players[seat].hand ?? [];
  const ranked = hand
    .map((card) => ({ card, plan: cardPlay(view, seat, card), def: CARD_BY_ID[card.card] }))
    .filter((item) => item.plan.legal)
    .sort((a, b) => (b.def?.power ?? b.def?.cost ?? 0) - (a.def?.power ?? a.def?.cost ?? 0));
  for (const item of ranked) {
    const command = toPlay(game, seat, item.card.uid, item.card.card, item.plan, id);
    if (!command) continue;
    try {
      applyCommand(game, seat, command);
      return command;
    } catch {
      /* The projection can only approximate some spells; try the next card. */
    }
  }
  return { id, version: game.version, type: 'pass' };
}

function toPlay(
  game: GameState,
  seat: Seat,
  uid: string,
  cardId: string,
  plan: ReturnType<typeof cardPlay>,
  id: string,
): EngineCommand | null {
  const command: EngineCommand = { id, version: game.version, type: 'play', uid };
  if (plan.needsSpecies) {
    const mover = game.board.find((item) => item.owner === seat && (CARD_BY_ID[item.card]?.regions?.length ?? 0) > 1);
    const region = mover ? CARD_BY_ID[mover.card]?.regions?.find((item) => item !== mover.region) : undefined;
    if (!mover || !region) return null;
    return { ...command, species: mover.uid, region };
  }
  const region = plan.immediate?.region ?? plan.regions[0];
  if (region) command.region = region;
  if (plan.needsTarget) {
    const view = project(game, seat);
    const enemy = REGION_ORDER.find((item) => view.regions[item].controller === other(seat));
    if (cardId === 'bison') {
      if (!enemy) return { ...command, region };
      command.target = enemy;
    } else {
      command.target = region ?? 'forest';
    }
  }
  return command;
}
