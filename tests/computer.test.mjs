import assert from 'node:assert/strict';
import test from 'node:test';
import { newGame } from '../src/engine.mjs';
import { chooseComputer } from '../lib/computer.ts';
import { applyCommand, clockOwner } from '../lib/match-rules.ts';

test('Grove spends an opening turn on legal commands and then leaves the clock', () => {
  let game = newGame(7);
  const seat = game.active;
  let steps = 0;
  while (!game.result && clockOwner(game) === seat && steps < 40) {
    const command = chooseComputer(game, seat);
    assert.ok(command, 'Grove has a command whenever the clock is theirs');
    const next = applyCommand(game, seat, command);
    assert.ok(next.version > game.version);
    game = next;
    steps += 1;
  }
  assert.ok(steps >= 1, 'Grove ends the turn with one pass');
  assert.ok(game.result || clockOwner(game) !== seat);
});
