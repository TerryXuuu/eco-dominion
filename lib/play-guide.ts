import type { Lang } from './i18n';

export type GuideSection = { title: string; lines: string[] };

const ZH: GuideSection[] = [
  {
    title: '怎么赢',
    lines: [
      '你结算时，如果有至少 3 块区域由你控制，而且稳定都不低于 12，立刻以支配获胜。',
      '双方各打满 8 回合后：先看有没有人三支配；没有就比谁占领的区域多；区域数相同再比总权重。打平的区域谁都不占领。总权重把每块区域上你的权重都算进去。还是一样，就是平局。',
      '认输，或连续超时 3 次。每次行动 90 秒，必须做的选择 30 秒。',
    ],
  },
  {
    title: '场地',
    lines: ['四块区域：森林、水域、旷野、高地。物种只能进入牌面允许的区域。'],
  },
  {
    title: '一回合',
    lines: [
      '补能量。开局 3 点，之后每个自己的回合 +1，最多 10。除先手第一回合外，每回合抽 2 张。起手各 5 张。',
      '翻一张事件，按牌面结算。',
      '物种和技巧在同一个窗口里打。双击手牌，或拖到场上。打完点右上角的结束回合。没有牌可以打时，这个按钮的边框会闪。',
      '结束时手牌多于 7 张，先弃到 7 张。',
      '结算。你控制的每块区域 +1 储备能量。稳定低于 0 的区域，控制者再被扣掉当前权重的四分之一，记在这块区域上。',
    ],
  },
  {
    title: '稳定',
    lines: [
      '后手结束回合时，有物种的区域稳定 +1。空区域不加。一个来回只加这 1 点。',
      '稳定大于 0，光环和配对才生效。雄鹿只给它所在的森林 +2，这个一直算。',
      '稳定小于等于 0，光环和配对停掉。牌面上的权重还在。',
      '稳定回到 0 或以上，这块区域的惩罚消失。惩罚留在区域上，不跟着物种走。',
    ],
  },
  {
    title: '权重和能量',
    lines: [
      '同一块区域里，权重合计更高的一方控制它。两边一样，这块区域中立。',
      '物种只花当前能量。技巧先花储备能量，再花当前能量。储备能量上限 3。',
    ],
  },
  {
    title: '局外的两种分数',
    lines: [
      '等级只升不降，共 30 级，每级 50 点。天梯：胜 +40，平 +25，负 +15。休闲：胜 +25，平 +15，负 +10。练习和私人房间不加。',
      '天梯分只有天梯对局会变。赢 +30，输 −20，平局不变。新芽输了不扣。到过的段位不会再掉下去：新芽、幼树 300、盛树 600、古树 800、巨树 1000。',
    ],
  },
];

const EN: GuideSection[] = [
  {
    title: 'How to win',
    lines: [
      'At your settlement, if you control at least 3 regions and each has stability of 12 or more, you win by domination.',
      'After both players have taken 8 turns: domination wins if either player has it; otherwise whoever holds more regions wins; if the counts match, compare total weight. A tied region is held by nobody. Total weight adds your weight in every region. Equal weight is a draw.',
      'Surrender, or three timeouts in a row. An action has 90 seconds. A forced choice has 30.',
    ],
  },
  {
    title: 'The land',
    lines: ['Four regions: forest, water, wild, and highland. A species can enter only a region printed on its card.'],
  },
  {
    title: 'A turn',
    lines: [
      'Refill energy. It opens at 3, then rises by 1 on each of your turns, to a maximum of 10. Draw 2, except the first player on their first turn. Each player starts with 5 cards.',
      'Reveal one event and resolve it.',
      'Play species and tactics in the same window. Double-click a card, or drag it onto the board. Then press End turn at the top right. Its border flashes when nothing can be played.',
      'If you end the turn with more than 7 cards, discard down to 7.',
      'Settle. Each region you control gives 1 reserve energy. A region below 0 stability adds a quarter of its controller’s current weight to that region’s penalty.',
    ],
  },
  {
    title: 'Stability',
    lines: [
      'When the second player ends their turn, every region with a species gains 1 stability. Empty regions do not. A round adds only that 1.',
      'Auras and pairs work only while stability is above 0. A deer gives +2 stability to the forest it stands in, and that always counts.',
      'At 0 or below, auras and pairs stop. The weight printed on the card remains.',
      'When stability returns to 0 or above, that region’s penalty disappears. The penalty stays on the region when a species moves.',
    ],
  },
  {
    title: 'Weight and energy',
    lines: [
      'The higher total weight controls the region. An equal total leaves it neutral.',
      'Species spend current energy only. Tactics spend reserve energy first, then current energy. Reserve energy caps at 3.',
    ],
  },
  {
    title: 'Two scores outside the match',
    lines: [
      'Level only rises: 30 levels, 50 points each. Ladder: win +40, draw +25, loss +15. Casual: win +25, draw +15, loss +10. Practice and private rooms add none.',
      'Ladder score changes only in ladder matches. Win +30, loss −20, draw unchanged. Sprout does not lose points. A rank you have reached is not lost: Sprout, Sapling 300, Prime 600, Ancient 800, Giant 1000.',
    ],
  },
];

export function playGuide(lang: Lang) {
  return lang === 'zh' ? ZH : EN;
}
