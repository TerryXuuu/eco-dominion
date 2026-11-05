/** How to play each card. The rules sentence stays in data/cards.json; this is the table advice. */
export const CARD_GUIDE: Record<string, { play: string; pair: string }> = {
  mouse: {
    play: 'Open with it. One energy buys a body and one point of reserve energy, which is how you afford the next species.',
    pair: 'Park it in a forest that already has, or is about to have, a deer. The mouse grows, and the deer likes the mouse back.',
  },
  beetle: {
    play: 'Use it to put a body in a region your deck is not built for. Two power will not win a region alone.',
    pair: 'The bonus needs a ray in the same region. Without one, treat the beetle as a cheap claim, not a threat.',
  },
  deer: {
    play: 'This is a forest anchor, not a lone attacker. Each deer adds stability for as long as it stays, so a second deer is how you hold the region.',
    pair: 'A mouse in that forest is the payoff. Play the mouse first if you need the reserve energy to afford the deer.',
  },
  fox: {
    play: 'Play it when a card in hand is worth more than raw power. It draws on entry and can sit in forest or wild.',
    pair: 'A lizard in the same region is the power plan. The fox without a lizard is a cantrip that happens to have a body.',
  },
  lizard: {
    play: 'A wild draw that also props the region up. Play it when wild is the region you intend to keep, not as a throwaway.',
    pair: 'It wants a fox. The fox draws and grows; the lizard keeps paying stability for every copy in wild.',
  },
  beaver: {
    play: 'Invest in water. The stability on entry is what lets you take the region, and each beaver then refunds one reserve energy when you refresh, once you control it.',
    pair: 'Heron and the water finishers want this region to already be yours. Do not wait until turn six to start the dam.',
  },
  heron: {
    play: 'A flexible draw for a water or forest board that is already underway. Seven power is real, but the card is better as a follow-up than as your first claim.',
    pair: 'Drop it on a beaver. The heron draws and picks up three power from that neighbor.',
  },
  snake: {
    play: 'Save it for a water region worth locking. Four stability on entry is a swing, and the ray makes each snake shrug off one interference that turn.',
    pair: 'Ray first or alongside. A snake with no ray is a large body; a snake with a ray is the region you defend.',
  },
  ray: {
    play: 'Play it to draw and to set up the snake, not to win water by itself. Ten power matters once the partner is there.',
    pair: 'The snake is the partner. Order them so the ray is already in the water when the snake arrives.',
  },
  bison: {
    play: 'Aim it at a wild region the opponent holds. It cuts their stability on the way in, then grows for each other friendly wild species already there.',
    pair: 'Do not play it into an empty wild. A panther beside it, or any earlier wild bodies, is what makes the power line worth the cost.',
  },
  falcon: {
    play: 'A closer for a crowded forest or highland. It banks two reserve energy on entry, then lifts every friendly species in that region, itself included.',
    pair: 'Fill the region first. An empty forest makes the aura a self-buff and wastes the five energy.',
  },
  panther: {
    play: 'Play it on the turn you are counting power. The cut to enemy species lasts only this turn, so a panther played "for later" gives them the turn back.',
    pair: 'A bison in the same wild region adds four power. The bison also wants company, so build the wild pack before this turn.',
  },
  oak: {
    play: 'The forest lock. Six stability on entry is the point; the aura then lifts every forest-capable friend there, including the oak.',
    pair: 'Deer and mouse should already be in that forest. The oak makes their region very hard to erode and very large to count.',
  },
  guardian: {
    play: 'One copy, any region, late. It draws two and gives every friend there, itself included, three power. You cannot keep a second one.',
    pair: 'Put it where you already have bodies. An empty region turns the anthem into a single 20-power creature and nothing else.',
  },
  algae: {
    play: 'A late water or wild swing. Six stability is immediate; the extra power turns on only once that region is at 10 or more.',
    pair: 'If the region is short of 10, fortify, infuse, or a beaver before you count on the aura. Otherwise you paid eight for the stability alone.',
  },
  fortify: {
    play: 'Cast it on a region you already control, when five stability changes who holds it or sets up a payoff that cares about a high number.',
    pair: 'It does nothing in a region you do not hold. Algae is the card most often waiting on this one.',
  },
  bloom: {
    play: 'A combat trick. Every friendly species in the chosen region gets four power, and only this turn, so cast it when power is about to be counted.',
    pair: 'It wants a crowd. One creature makes this a costly buff; three creatures make it the turn.',
  },
  migrate: {
    play: 'Move one friend to a different region it is allowed to enter, then draw. The move does not replay its enter effect.',
    pair: 'Use it to fix a position, not to re-trigger oak, snake, or beaver. Those bonuses do not happen again.',
  },
  charge: {
    play: 'The cheap way to fill reserve energy, and it stops at three. Play it the turn before a four-cost or larger card, while your reserve energy is low.',
    pair: 'Skip it when you are already at three. The card would do nothing, and reinforce draws you real options instead.',
  },
  infuse: {
    play: 'A smaller fortify and a smaller bloom on a region you control. Choose it when you need to hold the region and count power on the same turn.',
    pair: 'A region with several friends gets more from the power half. A region you barely hold gets more from the stability half.',
  },
  reinforce: {
    play: 'Draw two. Play it when your hand cannot answer the board and you are not the one who must spend energy on a threat this turn.',
    pair: 'It finds the partner your board is missing: the mouse for a deer, the ray for a snake, the second body for a bison.',
  },
  erode: {
    play: 'The direct answer to a region they have fortified. Six stability is enough to flip many holds, and it only works on a region they control.',
    pair: 'Follow it with a body of your own if you want the region, not just a ruined number. Erode does not give you control by itself.',
  },
  break: {
    play: 'Turn their synergies off for this turn. It asks that an enemy synergy actually be active, so do not spend it on a region of unrelated bodies.',
    pair: 'Hold it for deer and mouse, snake and ray, or an aura turn from oak, falcon, or guardian.',
  },
  veil: {
    play: 'A wide power cut against a region they occupy. Five power off each species there, this turn only, so play it when the count matters.',
    pair: 'Best into a crowd. One enemy creature is often cheaper to ignore than to tax with a five-cost spell.',
  },
  steal: {
    play: 'Punish a stocked reserve energy. If they have none, it discards a random card from their hand instead, so an empty reserve energy is not a blank.',
    pair: 'Play it before their charge pays off, or after you have seen them sit on three reserve energy for a finisher.',
  },
  destroy: {
    play: 'Cut four stability in any region, and they gain no reserve energy from that region on their next settlement. Aim it at the region they were about to score from.',
    pair: 'It is the flexible erode: it does not require them to control the region, and the reserve energy denial is the part that lasts past this turn.',
  },
  heat: {
    play: 'Every species that cost three or less loses three power this turn, yours included. Welcome it when your board is the expensive one.',
    pair: 'A mouse, beetle, fox, or lizard deck should fear this. A snake, falcon, or oak deck should press on the turn it resolves.',
  },
  monsoon: {
    play: 'Water gains seven stability and every other region loses three. If you hold water, this is the turn to count it.',
    pair: 'A beaver or snake already in water turns the event into your score. If water is theirs, you are the one paying the other regions.',
  },
  rest: {
    play: 'Each player may add two stability to one region they control, or skip. Put yours on the region closest to flipping.',
    pair: 'Skip if you control nothing worth saving. The event does not let you buff a region you do not hold.',
  },
  quake: {
    play: 'Three stability comes off every region. It helps the player who was behind and hurts a board that was already locked down.',
    pair: 'If you are the one with the fortified forest, this is the event you did not want. Have an erode or a body ready either way.',
  },
  migration: {
    play: 'Each player may move one species to a legal different region. There is no enter bonus and no draw.',
    pair: 'Use the move to correct a region, not to replay an enter effect. Migrate, the tactic, is the version that also draws.',
  },
  revival: {
    play: 'Both players gain one reserve energy, still capped at three. You come out ahead only if you can spend the point and they cannot.',
    pair: 'A hand with a four-cost card and an empty reserve energy likes this. A hand that is already at three reserve energy gains nothing.',
  },
  drought: {
    play: 'Water loses five stability and nothing else does. If their hold depends on water, this is the event you want to see.',
    pair: 'Your own beaver or snake is in the way of celebrating it. Drought does not check whose water it is.',
  },
  storm: {
    play: 'Both players draw one. Take it when your hand has more room to use an extra card than theirs does.',
    pair: 'A full hand and a developing board makes the extra card theirs more than yours. Reinforce is the draw you choose; storm is the draw you share.',
  },
  invasion: {
    play: 'The active player picks a region. The side with more species there gets four aggregate power this turn. A tie pays nothing.',
    pair: 'Stack a region, then choose it. Do not pick a region where you are merely tied; the event will do nothing.',
  },
  balance: {
    play: 'Regions that have fallen to zero or below are reset so their effective stability is zero. It digs a collapsing region out of a hole. It does not hand you a lead.',
    pair: 'Useful after quake, drought, or a heavy erode. Worthless on a board where every region is already healthy.',
  },
};
