/** Owner-approved in decisions/OWNER_RULES_APPROVAL.md. Ranked release was not approved. */
export const RULESET_ID = 'digital-1.0';
export const APPROVAL = {
  record: 'decisions/OWNER_RULES_APPROVAL.md',
  owners: 'Lynx & Terry',
  date: '2026-10-13',
  rankedEnabled: false,
} as const;

export const RULINGS: { id: string; summary: string }[] = [
  { id: 'R01', summary: 'Eight personal turns each, alternating, at most 16 settlements. Domination is checked at settlement, including the last turn; otherwise score after both counters reach 8.' },
  { id: 'R02', summary: 'Personal turn 1 refreshes to 3 energy. Each later personal turn adds 1, capped at 10.' },
  { id: 'R03', summary: 'The first player draws 0 on their first turn. The second player draws 2. Later turns draw 2. Opening hands stay at 5.' },
  { id: 'R04', summary: 'One event is revealed per personal turn, at most 16. The active player chooses before the opponent.' },
  { id: 'R05', summary: 'The owner discards the exact excess at the end of their own turn. During the turn the hand may exceed seven.' },
  { id: 'R06', summary: 'Targeting uses current derived power. Ties are neutral. Beaver refresh income uses the previous settlement controller.' },
  { id: 'R07', summary: 'Printed species power stays immutable. Regions keep a cumulative penalty ledger that does not move with migration.' },
  { id: 'R08', summary: 'Settlement income uses pre-penalty control. The penalty is applied once, then control is recomputed for victory.' },
  { id: 'R09', summary: 'Domination is checked only at settlement, not during deployment or the event.' },
  { id: 'R10', summary: 'Final scoring drops temporary modifiers, keeps continuous passives and permanent penalties, and ignores tied regions.' },
  { id: 'R11', summary: 'Deer contributes +2 stability while present. Each lizard contributes +3 while a same-owner fox is present. Neither stacks on refresh.' },
  { id: 'R12', summary: 'Pair bonuses are Boolean per recipient. Aura sources stack additively, including themselves when the card says all friendly species.' },
  { id: 'R13', summary: 'Nonpositive stability disables power auras, bison scaling, and synergies. Deer stability and beaver refresh income remain.' },
  { id: 'R14', summary: 'Targeted spell modifiers follow species UIDs. Heat is a dynamic cost filter. Invasion stays on the region side.' },
  { id: 'R15', summary: 'There is no interrupt stack. On your turn you may play species and spells in any order, then end the turn. Forced shared choices still pause play.' },
  { id: 'R16', summary: 'Snake immunity stops one unit-affecting interference per personal turn while ray synergy is enabled. It does not stop region or resource effects.' },
  { id: 'R17', summary: 'Break suppresses pair synergies only, not general power auras. Deer stability remains.' },
  { id: 'R18', summary: 'Bison targets an enemy-controlled region when one exists. Veil needs enemy species. Break needs an enabled enemy pair.' },
  { id: 'R19', summary: 'Terrain destruction blocks the enemy’s next beaver refresh and ordinary settlement income from that region.' },
  { id: 'R20', summary: 'Rest skips a player with no controlled regions. Migration is optional and does not draw or retrigger enter effects. Invasion ties grant nothing.' },
  { id: 'R21', summary: 'Nature balance lifts nonpositive effective stability to zero by adjusting base stability and keeping species offsets.' },
  { id: 'R22', summary: 'Species spend energy only. Spells may spend reserve energy, then energy. Energy cannot go below zero.' },
  { id: 'R23', summary: 'Deployed species stay on the board. Spells and forced discards go to the shared discard. There is no board slot limit.' },
  { id: 'R24', summary: 'A draw recycles the discard when the deck is empty; otherwise it draws fewer cards. An empty deck is not a loss.' },
  { id: 'R25', summary: 'Production shuffles use a server-side cryptographic seed stored privately with the match. The starter PRNG is only a test harness.' },
  { id: 'R26', summary: 'A personal turn has a 90-second action budget and forced choices have 30 seconds. Three consecutive timeouts forfeit. Concession is an authenticated command.' },
];

export type Spend = { energy: number; reserve: number };

/** Species ignore reserve. Spells spend reserve first, then energy. */
export function spendSpecies(energy: number, reserve: number, cost: number): Spend {
  if (!Number.isInteger(energy) || !Number.isInteger(reserve) || reserve < 0 || !Number.isInteger(cost) || energy < cost || cost < 0) {
    throw new Error('Insufficient energy');
  }
  return { energy: energy - cost, reserve };
}

export function spendSpell(energy: number, reserve: number, cost: number): Spend {
  if (!Number.isInteger(energy) || !Number.isInteger(reserve) || !Number.isInteger(cost) || cost < 0 || energy + reserve < cost) {
    throw new Error('Insufficient energy');
  }
  const fromReserve = Math.min(reserve, cost);
  return { energy: energy - (cost - fromReserve), reserve: reserve - fromReserve };
}

export const CORRECTED_ENERGY_EXAMPLE = {
  ruling: 'R22',
  illegal: 'Reserve energy 0 and energy 4 cannot pay deer (2) and then fortify (3), because the species leaves only 2 energy.',
  legal: {
    start: { energy: 4, reserve: 1 },
    afterDeer: spendSpecies(4, 1, 2),
    afterFortify: spendSpell(2, 1, 3),
  },
};
