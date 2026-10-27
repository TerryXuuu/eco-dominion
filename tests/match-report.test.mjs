import assert from 'node:assert/strict';
import test from 'node:test';
import { matchReport } from '../lib/match-report.ts';

const players = [
  { seat: 0, displayName: 'Ada' },
  { seat: 1, displayName: 'Bea' },
];

function finished(reason, winner, scores) {
  const regions = ['forest', 'water', 'wild', 'domain'];
  return {
    result: { winner, reason, ...(scores ? { scores } : {}) },
    players: [
      { turns: 8, max: 6, energy: 2, reserve: 4, handCount: 3 },
      { turns: 7, max: 5, energy: 1, reserve: 1, handCount: 5 },
    ],
    regions: Object.fromEntries(regions.map((region, index) => [region, {
      stability: index,
      power: [index + 1, index],
      controller: index < 3 ? 0 : 1,
      penalty: [index === 0 ? 2 : 0, 0],
    }])),
    board: [
      { uid: 'a', card: 'beetle', owner: 0, region: 'forest' },
      { uid: 'b', card: 'mouse', owner: 0, region: 'water' },
      { uid: 'c', card: 'frog', owner: 1, region: 'domain' },
    ],
  };
}

test('each seat gets its own ending and the same comparison', () => {
  const game = finished('concession', 0);
  const winner = matchReport(game, 0, players, [0, 1]);
  const loser = matchReport(game, 1, players, [0, 1]);
  assert.equal(winner.headline, 'Congratulations');
  assert.equal(winner.message, 'Your opponent surrendered.');
  assert.equal(loser.headline, 'Defeat');
  assert.equal(loser.message, 'You surrendered this match.');
  assert.equal(winner.you.regions, 3);
  assert.equal(winner.opponent.regions, 1);
  assert.equal(winner.you.species, 2);
  assert.equal(loser.you.species, 1);
  assert.equal(winner.you.power, 1 + 2 + 3 + 4);
  assert.equal(winner.opponent.name, 'Bea');
  assert.equal(loser.opponent.name, 'Ada');
  assert.equal(winner.you.timeouts, 0);
  assert.equal(loser.you.timeouts, 1);
  assert.equal(winner.scored, false);

  const scored = matchReport(finished('score', null, [4, 4]), 1, players, [0, 0]);
  assert.equal(scored.headline, 'Draw');
  assert.equal(scored.you.score, 4);
  assert.equal(scored.opponent.score, 4);
  assert.equal(matchReport({ result: null }, 0, players, [0, 0]), null);
});
