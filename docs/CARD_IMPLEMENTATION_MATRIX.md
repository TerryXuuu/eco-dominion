# Card implementation matrix

All 36 definitions are transcribed. Main deck 74, event deck 20. Chinese text remains in the immutable source; machine effects below use proposed draft rulings. Each card requires a regression fixture and online verification in S02/S04.

| ID | Name | Kind | Copies | Draft semantics |
|---|---|---|---:|---|
| mouse | 草地啮鼠 | species | 3 | Enter reserve +1; same-owner deer in region adds +2 power. |
| beetle | 苔藓甲虫 | species | 3 | Enter stability +1; same-owner ray adds +2 power. |
| deer | 林冠雄鹿 | species | 3 | Continuous forest stability +2 per deer; mouse adds +4 power. |
| fox | 灌丛狐 | species | 3 | Enter draw 1; lizard adds +3 power. |
| lizard | 岩地蜥蜴 | species | 3 | Enter draw 1; fox provides continuous wild stability +3 per lizard. |
| beaver | 河狸工程师 | species | 3 | Enter stability +3; controlling water grants reserve +1 on own refresh, once per beaver. |
| heron | 苍鹭 | species | 3 | Enter draw 1; beaver adds +3 power. |
| snake | 潮汐巨蛇 | species | 3 | Enter stability +4; ray grants one interference immunity per snake per personal turn. |
| ray | 礁蝠鳐 | species | 3 | Enter draw 1; snake adds +5 power. |
| bison | 荒野野牛 | species | 3 | Enter enemy-controlled target stability -2; power +2 per other friendly wild species in region. |
| falcon | 高地巨隼 | species | 3 | Enter reserve +2; continuous +2 power to all friendly species here including self. |
| panther | 峡谷豹 | species | 3 | Enter enemy species here power -3 this turn; bison adds +4 power. |
| oak | 远古橡树 | species | 3 | Enter stability +6; continuous +2 power to friendly forest-capable species here including self. |
| guardian | 原初守望者 | species | 1 | Enter draw 2; continuous +3 power to friendly species here including self; max one on own board. |
| algae | 深渊母藻 | species | 1 | Enter target stability +6; stability >=10 gives friendly species here +4 power including self. |
| fortify | 领域稳固 | tactic | 3 | Own controlled region stability +5. |
| bloom | 生物爆发 | tactic | 3 | Friendly species in target region +4 power this turn. |
| migrate | 区域迁移 | tactic | 3 | Move one friendly species to a different permitted region then draw 1; no enter retrigger. |
| charge | 储备蓄能 | tactic | 3 | Reserve +2 capped 3. |
| infuse | 生态灌注 | tactic | 3 | Own controlled region stability +2 and friendly species +3 power this turn. |
| reinforce | 增援召唤 | tactic | 3 | Draw 2. |
| erode | 侵蚀 | interference | 3 | Enemy controlled region stability -6. |
| break | 联动断裂 | interference | 3 | Disable all enemy synergies in target region this turn; requires active enemy synergy. |
| veil | 污化帷幕 | interference | 3 | Enemy occupied region species -5 power this turn. |
| steal | 资源掠夺 | interference | 3 | Enemy reserve -2; if initially zero randomly discard one enemy hand card. |
| destroy | 地形破坏 | interference | 3 | Any region stability -4; enemy gains no reserve from this region on their next settlement. |
| heat | 热浪 | event | 2 | All species cost <=3 power -3 this turn. |
| monsoon | 季风狂潮 | event | 2 | Water stability +7; others -3. |
| rest | 静息盛放 | event | 2 | Each player chooses one own controlled region stability +2, or skips if none. |
| quake | 地壳震颤 | event | 2 | All stability -3. |
| migration | 迁徙潮 | event | 2 | Each player may move one own species to a legal different region without enter/draw. |
| revival | 生态复兴 | event | 2 | Both reserve +1 capped 3. |
| drought | 干旱期 | event | 2 | Water stability -5. |
| storm | 风暴过境 | event | 2 | Both draw 1. |
| invasion | 物种入侵 | event | 2 | Active player selects region; side with more species gets +4 aggregate power this turn; tie no bonus. |
| balance | 自然平衡 | event | 2 | Base stability reset so effective stability becomes 0 in regions currently <=0. |
