import type { Projection, Seat } from '../src/engine.mjs';
import { REGION_LABEL, REGION_ORDER } from './cards.ts';

export type ReportPlayer = { seat: Seat; displayName: string };

export type ReportSide = {
  name: string;
  score: number | null;
  turns: number;
  regions: number;
  regionNames: string;
  power: number;
  species: number;
  reserve: number;
  energy: string;
  hand: number;
  penalty: number;
  timeouts: number;
};

export type MatchReport = {
  outcome: 'win' | 'loss' | 'draw';
  headline: string;
  message: string;
  you: ReportSide;
  opponent: ReportSide;
  scored: boolean;
};

const ENDING: Record<string, { win: string; loss: string; draw: string }> = {
  score: {
    win: 'You won on the final score.',
    loss: 'You lost on the final score.',
    draw: 'The final score was level.',
  },
  domination: {
    win: 'You won by domination.',
    loss: 'Your opponent won by domination.',
    draw: 'The match ended level.',
  },
  concession: {
    win: 'Your opponent surrendered.',
    loss: 'You surrendered this match.',
    draw: 'The match ended level.',
  },
  timeout: {
    win: 'You won because your opponent timed out.',
    loss: 'You lost on timeouts.',
    draw: 'The match ended level.',
  },
};

function sideOf(game: Projection, seat: Seat, name: string, timeouts: number): ReportSide {
  const player = game.players[seat];
  const held = REGION_ORDER.filter((region) => game.regions[region].controller === seat);
  return {
    name,
    score: game.result?.scores ? game.result.scores[seat] : null,
    turns: player.turns,
    regions: held.length,
    regionNames: held.map((region) => REGION_LABEL[region]).join(', ') || '—',
    power: REGION_ORDER.reduce((sum, region) => sum + game.regions[region].power[seat], 0),
    species: game.board.filter((card) => card.owner === seat).length,
    reserve: player.reserve,
    energy: `${player.energy}/${player.max}`,
    hand: player.handCount,
    penalty: REGION_ORDER.reduce((sum, region) => sum + game.regions[region].penalty[seat], 0),
    timeouts,
  };
}

/** Seat-specific ending: the winner sees congratulations, the loser sees defeat, and both get the same comparison. */
export function matchReport(game: Projection, seat: Seat, players: ReportPlayer[], timeouts: [number, number]): MatchReport | null {
  if (!game.result) return null;
  const opponent = (1 - seat) as Seat;
  const outcome = game.result.winner === null ? 'draw' : game.result.winner === seat ? 'win' : 'loss';
  const ending = ENDING[game.result.reason] ?? {
    win: 'You won this match.',
    loss: 'You lost this match.',
    draw: 'The match ended level.',
  };
  return {
    outcome,
    headline: outcome === 'win' ? 'Congratulations' : outcome === 'loss' ? 'Defeat' : 'Draw',
    message: ending[outcome],
    you: sideOf(game, seat, 'You', timeouts[seat]),
    opponent: sideOf(game, opponent, players.find((player) => player.seat === opponent)?.displayName ?? 'Opponent', timeouts[opponent]),
    scored: Boolean(game.result.scores),
  };
}
