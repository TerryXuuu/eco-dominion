# Eco Dominion Rule Conflicts and Digital Rulings

## Conclusion

Eco Dominion is technically feasible as an online two-player PvP game with registered accounts, concurrent matches and community features. Its current rules require clarification before a server can enforce them consistently.

This review distinguishes **direct contradictions** from **missing decisions**. Proposed rulings below are recommendations, not approved changes. Both original version 1.0 DOCX files remain unchanged.

Sources: **生态霸权_完整规则手册_v1.0.docx** and **生态霸权_全卡牌图鉴_v1.0.docx**.

## 1 Starting energy and personal turn numbering

**Direct contradiction.** The resource table starts energy maximum at 1 and adds 1 at every refresh. Applied literally, the first turn has 2 energy and the seventh turn has 8. The card book instead says 8-cost legends become playable on turn 8. The worked example calls a refresh from 3 to 4 the player's third turn, reinforcing the inconsistency with legend timing.

| Personal turn | Literal initial maximum 1 plus refresh | Proposed initial maximum 0 plus refresh |
|---|---:|---:|
| 1 | 2 | 1 |
| 2 | 3 | 2 |
| 3 | 4 | 3 |
| 7 | 8 | 7 |
| 8 | 9 | 8 |

**Proposed ruling:** initialize maximum energy at 0; first refresh raises it to 1. Personal turn number determines its energy maximum, subject to the stated cap. The cap of 10 remains but is unreachable in an ordinary eight-personal-turn game.

**Online consequence:** initialization, resource display, card legality and replay fixtures must use the same convention. Audit reference: R02.

## 2 The worked example spends energy it does not have

**Direct contradiction.** The example starts with 4 available energy, deploys a 2-cost deer and casts 3-cost fortification. It explicitly permits a negative balance before stopping:

\[
4-2-3=-1.
\]

Payment must be validated **before** a card is played. Stopping afterward does not repair an illegal action.

**Proposed correction:** the sequence requires at least 1 reserve energy. Deer spends 2 available energy; fortification spends 1 reserve plus the remaining 2 available energy. If reserve is zero, fortification is rejected. Audit reference: R22.

## 3 Permanent power cannot both only increase and suffer permanent penalties

**Direct contradiction.** The power explanation says species cannot be removed, therefore permanent power only increases. Settlement says a controller in a region with nonpositive stability permanently loses one quarter of its current regional power, rounded down.

The text also leaves these questions open:

- Does loss reduce individual species or a regional total?
- Does loss follow a species when it migrates?
- Does the quarter use base power or effective power including temporary bonuses?
- Can the penalty change control after control was initially determined?
- Does repeated settlement apply another penalty to an already weakened total?

**Proposed ruling:** keep species' printed base power unchanged and maintain a cumulative penalty ledger for each player in each region. That penalty stays in the region after migration. Calculate each settlement's penalty from current effective power, with disabled synergies already excluded. Apply it once, clamp effective power at zero, and recompute control afterward.

This preserves species identities but changes the claim that permanent power never decreases. It is a substantive interpretation requiring approval. Audit references: R07 and R08.

## 4 The endpoint has two meanings of turn 8

**Ambiguous endpoint wording.** The opening goal mentions winning before the end of turn 8. The victory table ends the game after both players have completed eight turns. Alternating turns make those potentially 8 total turns versus 16 total turns.

**Proposed ruling:** eight personal turns per player, up to 16 settlements. Domination is checked at the final settlement before final scoring. Audit reference: R01.

## 5 Immediate victory needs a precise checkpoint

**Timing ambiguity.** The opening description can suggest winning as soon as three controlled regions reach stability 12. The phase rules place the victory check in settlement.

Those interpretations differ if a player reaches the threshold during deployment but changes the position during tactics.

**Proposed ruling:** only settlement can trigger domination victory. Reaching the threshold earlier does not end the game. The active player must qualify at that checkpoint. Audit reference: R09.

## 6 Claimed defensive counterplay conflicts with available action windows

**Direct conflict between procedure and explanation.** The procedure prohibits the opponent from playing during your tactics phase. The explanations describe temporary debuffs as a way to stop an opponent about to win and discuss retaining reserve energy for counters.

Temporary effects clear at the next refresh. A debuff played during your own turn therefore ordinarily disappears before the opponent's next turn. It cannot be used as an immediate response to the opponent's winning play.

**Proposed ruling:** preserve the explicit no-interrupt system. Temporary effects help contest control during your own turn; permanent stability damage can obstruct a later opponent win. Correct the help text accordingly.

**Alternative requiring a design change:** add an opponent response window or carry specified effects through the opponent's turn. Either changes the phase machine and balance and must not be introduced silently. Audit reference: R15.

## 7 Passive stability lacks an application rule

**Missing decision.** Deer gives forest stability +2 as a passive. Lizard's fox synergy gives wild stability +3. Neither states whether the bonus is added once, added each turn, or continuously contributed while its requirements hold.

Migration makes the difference visible. If the contributing species leaves, should stability fall again?

**Proposed ruling:** continuous contributions that recompute when species move or synergy is disabled; they do not accumulate each refresh. Each deer contributes +2. Each lizard with a same-owner fox contributes +3 while enabled.

**Additional threshold problem:** nonpositive stability disables synergy, but lizard synergy itself increases stability. Decide whether that synergy can rescue a nonpositive region. The reference draft evaluates activation using base stability plus deer contributions, before the lizard contribution, to prevent circular calculations. Audit references: R11 and R13.

## 8 Cards require control before the rules formally establish it

**Missing decision.** Fortification requires your controlled region, erosion requires an enemy-controlled region, and bison requires an enemy-controlled target. Control is formally determined in settlement.

After deploying enough power to overtake a region, may a player immediately fortify it, or must they wait?

**Proposed ruling:** targeting uses current derived power and control. Previous settlement control is retained separately for effects such as beaver's refresh income. Equal power means neutral. Audit reference: R06.

## 9 Final scoring does not fully define permanent power

**Missing decision.** Temporary bonuses are excluded, but the text does not establish whether final control is recalculated without those bonuses or whether enduring auras and synergies count.

A temporary bonus could otherwise win control of a region containing substantial opposing permanent power, then disappear for scoring while its ownership remains frozen.

**Proposed ruling:** remove temporary effects, including temporary synergy suppression; recalculate control; score each player's enduring effective power in their controlled regions. Include enabled continuous effects and permanent penalties. Neutral regions contribute nothing. Do not apply an extra settlement penalty. Audit reference: R10.

## 10 Snake immunity has no defined scope

**Missing decision.** Immunity to one interference effect could protect the snake from a power reduction, protect a region from stability loss, block regional synergy suppression, or prevent resource theft from its owner.

The rules do not explain how a single species absorbs a region-wide or player-wide effect. They also list synergy break as a counter to the snake/ray combination.

**Proposed ruling:** protect the snake against one species-affecting interference effect per personal turn while its ray synergy is enabled. Currently that applies to veil's power reduction. It does not protect regional stability, player resources or the entire region's synergies. Audit reference: R16.

## 11 Synergies and ordinary passives have inconsistent boundaries

**Conflict between rule wording and commentary.** Nonpositive stability explicitly disables synergies. The card-book commentary says guardian's aura also fails there, although its card labels that effect a passive rather than a pair synergy.

**Decisions required:** does nonpositive stability disable only species-pair synergies, or also power auras and bison scaling? Does synergy break disable pairs only, or all passive effects?

**Reference draft:** nonpositive stability suppresses pair synergies and power passives, while retaining deer's intrinsic stability contribution. Synergy break suppresses pairs only. Beaver's refresh-income passive uses historical control. These distinctions require approval, rather than being treated as obvious original rules. Audit references: R13 and R17.

## 12 Duplicate species and migration need effect-stacking rules

**Missing decisions.** Ordinary species have three copies each. The texts do not say whether two deer multiply one mouse's pair bonus, whether aura sources stack, or whether an aura includes its own source.

Migration also leaves unclear whether a temporary bonus follows a species, remains in the original region, or affects creatures arriving after the spell was cast.

**Proposed ruling:** pair bonuses depend on partner presence, not partner count. Each aura source stacks and includes itself where its wording says all friendly species. Cast-time species bonuses attach to the affected species UIDs and follow migration; later arrivals do not inherit them. Heat uses a dynamic cost filter, while invasion's aggregate bonus stays on its region and side. Audit references: R12 and R14.

## 13 Additional rulings required for online implementation

| Topic | Missing decision | Draft recommendation | Audit ID |
|---|---|---|---|
| First-turn draw | Second player's first draw not explicitly distinguished | Opening player draws zero on first turn; second draws two; both later draw two | R03 |
| Event cadence | One event per personal turn or paired round | One event per personal turn, up to 16 | R04 |
| Hand overflow | Who chooses discards and at what checkpoint | Owner chooses exact excess; pause play immediately; draw overflow before event reveal | R05 |
| Shared choice order | Both players choose simultaneously or sequentially | Freeze a deterministic order; draft shared-event choices are active then opponent, while reference overflow queue resolves opponent then active when both overflow | R05, R20 |
| Bison without a target | No enemy-controlled region exists | Enter effect does nothing; cannot invent a target | R18 |
| Veil target | Enemy control or enemy occupation | Require enemy species present, regardless of controller | R18 |
| Terrain denial | Which reserve gains and when it expires | Block targeted-region beaver refresh and settlement income on enemy's next turn; then expire | R19 |
| Optional event migration | Skip allowed, and enter/draw retrigger? | May skip; one legal movement; no enter effect or draw | R20 |
| Invasion | Who selects region, tie result, +4 to each species or total? | Active player selects; greater species count gets +4 regional total; tie gives zero | R20 |
| Nature balance | Reset base or effective stability? | Adjust base so effective nonpositive stability becomes zero | R21 |
| Played species destination | General discard wording conflicts with deployed species remaining | Species remain on board; spells and forced discards enter main discard | R23 |
| Truly empty draw supply | Both deck and recyclable discard empty | Draw fewer cards; no deck-out loss | R24 |
| Randomness | Who shuffles or chooses random discard online? | Server-only random stream; deterministic replay; private seed and deck order | R25 |
| Disconnect and inactivity | Original tabletop rules have no network policy | Approve deadlines, deterministic timeout choices, reconnect, concession and outage rules as digital additions | R26 |

The proposed timeout numbers in the project pack—90 seconds per personal turn, 30 seconds per forced choice and forfeit after three consecutive timeouts—are **product proposals**, not requirements found in the original files.

## 14 Balance is a separate question from rule consistency

Making rules deterministic does not prove fairness. The no-removal board, eight-turn limit, shared events and threshold of three regions at stability 12 need controlled testing. A starter termination smoke completed 200 games with a simple first-legal-card policy and produced no domination wins. That observation motivates investigation; it does not establish what skilled human play can achieve.

Use paired-seed strategy simulations and human mirrored rematches before changing values or enabling ranked play. Preserve the original baseline and publish any approved revision as a distinct ruleset.

## 15 Required next step

Resolve these rulings in Eco Dominion session S01. Record explicit owner choices, update executable fixtures and publish a versioned rule specification. Continue implementation against that frozen specification. Do not silently interpret an unresolved rule differently in the frontend, backend and replay engine.
