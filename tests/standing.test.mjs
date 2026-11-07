import assert from 'node:assert/strict';
import test from 'node:test';
import { applyLadder, career, contributionGrid, experienceGain, levelProgress, progressOf, rankOf } from '../lib/standing.ts';

const now = new Date('2026-10-28T12:00:00.000Z');
const match = (finishedAt, outcome, extra = {}) => ({
  finishedAt,
  mode: 'casual',
  outcome,
  reason: 'score',
  ownScore: 10,
  theirScore: 8,
  ratingAfter: 1000,
  opponent: 'grove',
  ...extra,
});

test('five ranks follow experience and stay at the highest gate', () => {
  assert.equal(rankOf(0).name, 'Sprout');
  assert.equal(rankOf(299).name, 'Sprout');
  assert.equal(rankOf(300).name, 'Sapling');
  assert.equal(rankOf(600).name, 'Tree');
  assert.equal(rankOf(800).name, 'Forest');
  assert.equal(rankOf(1000).name, 'Ecosystem');
  assert.equal(rankOf(2400).name, 'Ecosystem');
  assert.equal(progressOf(420).next, 600);
  assert.equal(progressOf(1000).percent, 100);
  assert.equal(levelProgress(0).level, 1);
  assert.equal(levelProgress(25).level, 1);
  assert.equal(levelProgress(25).into, 25);
  assert.equal(levelProgress(50).level, 2);
  assert.equal(levelProgress(1499).level, 30);
  assert.equal(levelProgress(1600).level, 30);
  assert.equal(levelProgress(1600).percent, 100);
});

test('ladder points rise on a win and fall on a loss, but not out of a tier already reached', () => {
  assert.equal(applyLadder(0, 0, 'loss').delta, 0);
  assert.equal(applyLadder(60, 60, 'loss').score, 60);
  const reached = applyLadder(270, 270, 'win');
  assert.equal(reached.score, 300);
  assert.equal(applyLadder(reached.score, reached.peak, 'loss').score, 300);
  assert.equal(applyLadder(340, 360, 'loss').score, 320);
  assert.equal(applyLadder(310, 360, 'loss').score, 300);
  assert.equal(applyLadder(600, 600, 'loss').score, 600);
  assert.equal(applyLadder(640, 640, 'draw').score, 640);
});

test('a finished match adds experience and a loss does not remove it', () => {
  assert.equal(experienceGain({ mode: 'ranked', outcome: 'win' }), 40);
  assert.equal(experienceGain({ mode: 'ranked', outcome: 'draw' }), 25);
  assert.equal(experienceGain({ mode: 'ranked', outcome: 'loss' }), 15);
  assert.equal(experienceGain({ mode: 'casual', outcome: 'win' }), 25);
  assert.equal(experienceGain({ mode: 'casual', outcome: 'loss' }), 10);
  assert.equal(experienceGain({ mode: 'practice', outcome: 'win' }), 0);
  assert.equal(experienceGain({ mode: 'private', outcome: 'win' }), 0);
  const afterLoss = 40 + experienceGain({ mode: 'ranked', outcome: 'loss' });
  assert.equal(afterLoss, 55);
  assert.ok(afterLoss > 40);
});

test('win streak and day streak follow the latest matches', () => {
  const summary = career([
    match('2026-10-26T01:00:00.000Z', 'win'),
    match('2026-10-26T05:00:00.000Z', 'win'),
    match('2026-10-27T01:00:00.000Z', 'loss', { ownScore: 4, theirScore: 9 }),
    match('2026-10-28T01:00:00.000Z', 'win', { ownScore: 24, theirScore: 10, ratingAfter: 1120, reason: 'domination' }),
  ], 1120, 4, now);
  assert.equal(summary.winStreak, 1);
  assert.equal(summary.bestWinStreak, 2);
  assert.equal(summary.dayStreak, 3);
  assert.equal(summary.bestDayStreak, 3);
  assert.equal(summary.bestScore, 24);
  assert.equal(summary.bestMargin, 14);
  assert.equal(summary.peakRating, 1120);
  assert.equal(summary.achievements.find((item) => item.id === 'hot').owned, false);
  assert.equal(summary.achievements.find((item) => item.id === 'heavy').owned, true);
  assert.equal(summary.achievements.find((item) => item.id === 'line').owned, false);
});

test('a day streak still counts when today has no match yet', () => {
  const summary = career([
    match('2026-10-26T01:00:00.000Z', 'win'),
    match('2026-10-27T01:00:00.000Z', 'win'),
  ], 1000, 2, now);
  assert.equal(summary.dayStreak, 2);
  assert.equal(summary.winStreak, 2);
});

test('the activity grid is a year of weeks ending today', () => {
  const weeks = contributionGrid([{ finishedAt: '2026-10-28T01:00:00.000Z' }, { finishedAt: '2026-10-28T08:00:00.000Z' }], now);
  assert.equal(weeks.length, 53);
  const last = weeks.at(-1).days.find((day) => day?.date === '2026-10-28');
  assert.equal(last.count, 2);
  assert.equal(last.level, 2);
  assert.equal(weeks.at(-1).days.at(-1), null);
});
