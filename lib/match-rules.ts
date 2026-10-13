import type { EngineCommand, GameState, Seat } from '../src/engine.mjs';
import { REGIONS, apply, newGame } from './engine.ts';

/** R26 transport policy as frozen in decisions/DECISIONS.md (owner decision, 13 October 2026). */
export const TURN_MS = 90_000;
export const CHOICE_MS = 30_000;
export const MAX_TIMEOUTS = 3;
export const ELO_K = 32;
export const ELO_START = 1000;
export const CASUAL_SEASON_ID = '00000000-0000-4000-8000-000000000001';

/** Stored in match.private_snapshot; never sent to clients. */
export type Snapshot = { seed: number; game: GameState; timeouts: [number, number] };

export type AppliedCommand = { seat: Seat; command: EngineCommand; auto: boolean };

export function openSnapshot(seed: number): Snapshot {
  return { seed, game: newGame(seed), timeouts: [0, 0] };
}

const otherSeat = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

/** Engine commands plus the lifecycle commands the engine does not own: concede off turn and timeout forfeit. */
export function applyCommand(game: GameState, seat: Seat, command: EngineCommand): GameState {
  if (command.type !== 'concede' && command.type !== 'forfeit') return apply(game, seat, command);
  if (game.accepted.some((item) => item.id === command.id && item.seat === seat)) return structuredClone(game);
  if (command.version !== game.version) throw new Error('Stale version');
  if (game.result) throw new Error('Game finished');
  const next = structuredClone(game);
  next.result = { winner: otherSeat(seat), reason: command.type === 'forfeit' ? 'timeout' : 'concession' };
  next.phase = 'finished';
  next.choices = [];
  next.version += 1;
  next.accepted.push({ id: command.id, seat, version: next.version });
  return next;
}

/** The seat whose clock is running, or null once the game is over. */
export function clockOwner(game: GameState): Seat | null {
  if (game.result) return null;
  return game.choices.length ? game.choices[0].owner : game.active;
}

const turnKey = (game: GameState) => `${game.active}:${game.players[game.active].turns}`;

/** Deadline after a transition, measured from `base` (the commit time, or the expired deadline during catch-up). */
export function nextDeadline(previous: GameState | null, next: GameState, previousDeadline: number | null, base: number): number | null {
  if (next.result) return null;
  if (next.choices.length) return base + CHOICE_MS;
  const turnStarted = !previous || previous.choices.length > 0 || turnKey(previous) !== turnKey(next) || previousDeadline === null;
  return turnStarted ? base + TURN_MS : previousDeadline;
}

/** Deterministic action for an expired forced choice. */
export function timeoutChoice(game: GameState, id: string): EngineCommand {
  const choice = game.choices[0];
  const base = { id, version: game.version, type: 'choose' };
  switch (choice.kind) {
    case 'discard':
      return { ...base, uids: game.players[choice.owner].hand.slice(-choice.count).map((card) => card.uid) };
    case 'rest':
      return { ...base, region: REGIONS.find((region) => choice.options.includes(region)) };
    case 'migration':
      return { ...base, skip: true };
    case 'invasion':
      return { ...base, region: 'forest' };
  }
}

/**
 * Applies every deadline that has expired by `now`. Each expiry counts one timeout for the overdue seat;
 * the third consecutive one forfeits instead of acting.
 */
export function expire(snapshot: Snapshot, deadline: number | null, now: number, newId: () => string) {
  let game = snapshot.game;
  const timeouts: [number, number] = [...snapshot.timeouts];
  const applied: AppliedCommand[] = [];
  let current = deadline;
  while (current !== null && current <= now && !game.result) {
    const seat = clockOwner(game) as Seat;
    const before = game;
    timeouts[seat] += 1;
    if (timeouts[seat] >= MAX_TIMEOUTS) {
      const command = { id: newId(), version: game.version, type: 'forfeit' };
      game = applyCommand(game, seat, command);
      applied.push({ seat, command, auto: true });
    } else if (game.choices.length) {
      const command = timeoutChoice(game, newId());
      game = applyCommand(game, seat, command);
      applied.push({ seat, command, auto: true });
    } else {
      const key = turnKey(game);
      do {
        const command = { id: newId(), version: game.version, type: 'pass' };
        game = applyCommand(game, seat, command);
        applied.push({ seat, command, auto: true });
      } while (!game.result && !game.choices.length && turnKey(game) === key);
    }
    current = nextDeadline(before, game, current, current);
  }
  return { snapshot: { ...snapshot, game, timeouts }, deadline: current, applied };
}

/** Symmetric Elo update; `scoreA` is 1 for an A win, 0.5 for a draw, 0 for a loss. */
export function elo(ratingA: number, ratingB: number, scoreA: number): [number, number] {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const delta = Math.round(ELO_K * (scoreA - expectedA));
  return [ratingA + delta, ratingB - delta];
}
