import assert from 'node:assert/strict';
import test from 'node:test';
import { anyLegalPlay, cardPlay } from '../lib/hand-actions.ts';

const regions = () => ({
  forest: { stability: 0, power: [0, 0], controller: null, penalty: [0, 0] },
  water: { stability: 0, power: [0, 0], controller: null, penalty: [0, 0] },
  wild: { stability: 0, power: [0, 0], controller: null, penalty: [0, 0] },
  domain: { stability: 0, power: [0, 0], controller: null, penalty: [0, 0] },
});

function game(phase, hand, extra = {}) {
  return {
    phase,
    board: [],
    regions: regions(),
    players: [
      { turns: 1, max: 1, energy: 3, reserve: 0, handCount: hand.length, hand },
      { turns: 0, max: 0, energy: 0, reserve: 0, handCount: 0, hand: [] },
    ],
    ...extra,
  };
}

test('a lone affordable species plays straight to its only region, and an empty tactics hand can pass', () => {
  const deploy = game('deploy', [{ uid: 'c1', card: 'deer' }]);
  const plan = cardPlay(deploy, 0, deploy.players[0].hand[0]);
  assert.equal(plan.legal, true);
  assert.deepEqual(plan.immediate, { uid: 'c1', region: 'forest' });
  assert.equal(anyLegalPlay(deploy, 0), true);

  const broke = game('deploy', [{ uid: 'c1', card: 'deer' }], {
    players: [
      { turns: 1, max: 1, energy: 0, reserve: 3, handCount: 1, hand: [{ uid: 'c1', card: 'deer' }] },
      { turns: 0, max: 0, energy: 0, reserve: 0, handCount: 0, hand: [] },
    ],
  });
  assert.equal(cardPlay(broke, 0, broke.players[0].hand[0]).legal, false);
  assert.equal(anyLegalPlay(broke, 0), false);

  const tactics = game('tactics', [{ uid: 'c1', card: 'deer' }]);
  assert.equal(anyLegalPlay(tactics, 0), false);
});
