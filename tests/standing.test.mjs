import assert from 'node:assert/strict';
import test from 'node:test';
import { career, contributionGrid, rankOf } from '../lib/standing.ts';

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

test('rank seals step from Seed to Dominion', () => {
  assert.equal(rankOf(1).name, 'Seed');
  assert.equal(rankOf(5).name, 'Sapling');
  assert.equal(rankOf(10).name, 'Grove');
  assert.equal(rankOf(16).name, 'Canopy');
  assert.equal(rankOf(35).name, 'Dominion');
  assert.equal(rankOf(40).name, 'Dominion');
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
  assert.equal(summary.achievements.find((item) => item.id === 'line').owned, true);
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
