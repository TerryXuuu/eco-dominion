export type Lang = 'en' | 'zh';

export const LANG_COOKIE = 'eco-lang';

type Dict = {
  nav: Record<'home' | 'rulings' | 'library' | 'leaderboard' | 'community' | 'play' | 'history' | 'moderation' | 'admin' | 'profile' | 'logout' | 'login' | 'register' | 'paused', string>;
  role: Record<'Admin' | 'Moderator' | 'Guest' | 'Player', string>;
  rank: Record<'Dominion' | 'Apex' | 'Keystone' | 'Elder' | 'Canopy' | 'Grove' | 'Sapling' | 'Seed', string>;
  blurb: Record<'Dominion' | 'Apex' | 'Keystone' | 'Elder' | 'Canopy' | 'Grove' | 'Sapling' | 'Seed', string>;
  region: Record<'forest' | 'water' | 'wild' | 'domain', string>;
  kind: Record<'species' | 'tactic' | 'interference' | 'event' | 'all', string>;
  landing: { eyebrow: string; title: string; lede: string; enter: string; create: string; rulings: string };
  home: Record<'profile' | 'play' | 'level' | 'rating' | 'ranking' | 'record' | 'streak' | 'days' | 'best' | 'hotspot' | 'activity' | 'achievements' | 'opponents' | 'recent' | 'openProfile' | 'ratedGames' | 'onBoard' | 'unranked' | 'wld' | 'bestStreak' | 'bestDays' | 'widest' | 'hotspotNote' | 'achieveNote' | 'noOpponents' | 'noRecent' | 'matches' | 'less' | 'more', string>;
  play: Record<'title' | 'lede' | 'inProgress' | 'finishFirst' | 'return' | 'casual' | 'waiting' | 'leave' | 'find' | 'practice' | 'practiceNote' | 'playGrove' | 'room' | 'share' | 'guest' | 'invite' | 'send' | 'cancel' | 'create' | 'joinLabel' | 'join' | 'failed', string>;
  library: Record<'title' | 'lede' | 'search' | 'count' | 'deck' | 'rules' | 'use' | 'with' | 'none' | 'cost' | 'power', string>;
  community: Record<'title' | 'guestLede' | 'memberLede' | 'search' | 'searchLabel' | 'guest' | 'everyone' | 'following' | 'people' | 'suspended' | 'guestsRead' | 'newPost' | 'tags' | 'images' | 'who' | 'public' | 'friends' | 'private' | 'publish' | 'publishing' | 'like' | 'unlike' | 'comments' | 'empty', string>;
  board: Record<'title' | 'note' | 'empty' | 'player' | 'rating' | 'games' | 'hidden', string>;
  history: Record<'title' | 'empty' | 'play' | 'when' | 'result' | 'opponent' | 'how' | 'score' | 'rating' | 'replay' | 'win' | 'loss' | 'draw' | 'casual' | 'private' | 'unrated' | 'scoreReason' | 'domination' | 'surrender' | 'timeouts', string>;
  profile: Record<'title' | 'upload' | 'uploading' | 'hint' | 'display' | 'handle' | 'visibility' | 'locale' | 'bio' | 'save' | 'saving' | 'saved' | 'avatarSaved' | 'moderation' | 'admin' | 'suspended', string>;
  login: Record<'title' | 'email' | 'password' | 'submit' | 'checking' | 'forgot' | 'create', string>;
  table: Record<'turn' | 'youTurn' | 'hand' | 'deck' | 'events' | 'discard' | 'empty' | 'noEvent' | 'neutral' | 'you' | 'opponent' | 'stability' | 'penalty' | 'leave' | 'practice' | 'casual' | 'private' | 'over' | 'yourChoice' | 'yourTurn' | 'groveChoosing' | 'opponentChoosing' | 'grovePlaying' | 'opponentTurn' | 'timeouts' | 'newGame' | 'summary' | 'closeSummary' | 'endDeploy' | 'settle' | 'surrender' | 'surrenderAsk' | 'pass' | 'noPlay' | 'choose' | 'enemyRegion' | 'region' | 'species' | 'moveTo' | 'skip' | 'rest' | 'invasion' | 'migration' | 'discardExactly' | 'discardSelected' | 'in', string>;
  footer: { rights: string };
};

const en: Dict = {
  nav: { home: 'Home', rulings: 'Rulings', library: 'Library', leaderboard: 'Leaderboard', community: 'Community', play: 'Play', history: 'History', moderation: 'Moderation', admin: 'Admin', profile: 'Profile', logout: 'Log out', login: 'Log in', register: 'Register', paused: 'Session paused' },
  role: { Admin: 'Admin', Moderator: 'Moderator', Guest: 'Guest', Player: 'Player' },
  rank: { Dominion: 'Dominion', Apex: 'Apex', Keystone: 'Keystone', Elder: 'Elder', Canopy: 'Canopy', Grove: 'Grove', Sapling: 'Sapling', Seed: 'Seed' },
  blurb: { Dominion: 'The table knows your name.', Apex: 'Few seats sit higher.', Keystone: 'The grove holds because of you.', Elder: 'A long season at the table.', Canopy: 'You shade the regions.', Grove: 'A stand of your own.', Sapling: 'Roots in the casual board.', Seed: 'The first season.' },
  region: { forest: 'Forest', water: 'Water', wild: 'Wild', domain: 'Domain' },
  kind: { species: 'Species', tactic: 'Tactic', interference: 'Interference', event: 'Event', all: 'All' },
  landing: { eyebrow: 'Four realms · eight turns', title: 'Hold the living dominion.', lede: 'Forest, water, wild, and domain. The land answers the one who keeps it.', enter: 'Enter the table', create: 'Create account', rulings: 'Read the rulings' },
  home: { profile: 'Profile', play: 'Play', level: 'Level', rating: 'Casual rating', ranking: 'Ranking', record: 'Record', streak: 'Win streak', days: 'Day streak', best: 'Best score', hotspot: 'Hotspot', activity: 'Activity', achievements: 'Achievements', opponents: 'Opponents', recent: 'Recent games', openProfile: 'Open your profile', ratedGames: 'rated games · peak', onBoard: 'On the casual board', unranked: 'Play a casual match to be ranked', wld: 'Wins, losses, draws', bestStreak: 'Best', bestDays: 'days in a row', widest: 'Widest win', hotspotNote: 'Finished matches in each of the last eight weeks.', achieveNote: 'Earned from finished matches. A dim seal is still ahead of you.', noOpponents: 'No finished matches yet.', noRecent: 'Your history will show up here.', matches: 'matches', less: 'Less', more: 'More' },
  play: { title: 'Play', lede: 'Casual matches are rated with a separate casual rating. Private rooms are unrated. Ranked play stays off until balance testing.', inProgress: 'You have a match in progress', finishFirst: 'Finish or concede it before starting another.', return: 'Return to your match', casual: 'Casual queue', waiting: 'Waiting for another player…', leave: 'Leave queue', find: 'Find a casual match', practice: 'Practice', practiceNote: 'Grove takes the other seat immediately. Practice is unrated, so your casual rating stays where it is.', playGrove: 'Play Grove', room: 'Private room', share: 'Share this code:', guest: 'Waiting for your guest to join…', invite: 'Invite a friend', send: 'Send invite', cancel: 'Cancel room', create: 'Create a private room', joinLabel: 'Join with a code', join: 'Join room', failed: 'Something went wrong; try again' },
  library: { title: 'Card library', lede: 'Every card in the deck, with its art, the rules text, and when it is actually worth playing.', search: 'Search the library', count: 'cards', deck: 'in the deck', rules: 'Rules.', use: 'How to use it.', with: 'Play it with.', none: 'No card matches that search.', cost: 'cost', power: 'power' },
  community: { title: 'Community', guestLede: 'Public posts are open to read. Register as a player to publish, like, or comment.', memberLede: 'Tag a card or a topic, attach up to three images, and choose who can see the post.', search: 'Search posts, names, or tags', searchLabel: 'Search the community', guest: 'You are browsing as a guest.', everyone: 'Everyone', following: 'Following', people: 'People', suspended: 'Your account is suspended; you can read but not make changes.', guestsRead: 'Guests can read posts. Playing, posting, likes, and comments are for players.', newPost: 'New post', tags: 'Tags', images: 'Images, up to three', who: 'Who can see it', public: 'Everyone', friends: 'Friends', private: 'Only me', publish: 'Publish', publishing: 'Publishing…', like: 'Like', unlike: 'Unlike', comments: 'comments', empty: 'No posts yet.' },
  board: { title: 'Casual rating', note: 'Elo from casual-queue matches only (K=32, everyone starts at 1000). Private rooms are unrated, and ranked play is not enabled. Players with non-public profiles are listed without their name. Click a heading to sort, or type in a column to filter.', empty: 'No rated matches yet.', player: 'Player', rating: 'Rating', games: 'Games', hidden: 'Hidden player' },
  history: { title: 'Match history', empty: 'No finished matches yet.', play: 'Play one', when: 'When', result: 'Result', opponent: 'Opponent', how: 'How', score: 'Score', rating: 'Rating', replay: 'Replay', win: 'Win', loss: 'Loss', draw: 'Draw', casual: 'Casual', private: 'Private', unrated: 'Unrated', scoreReason: 'final score', domination: 'domination', surrender: 'surrender', timeouts: 'timeouts' },
  profile: { title: 'Your profile', upload: 'Upload avatar', uploading: 'Uploading…', hint: 'JPEG, PNG, WebP, GIF · 1.5 MB', display: 'Display name', handle: 'Handle', visibility: 'Visibility', locale: 'Locale', bio: 'Bio', save: 'Save profile', saving: 'Saving…', saved: 'Profile saved.', avatarSaved: 'Avatar updated.', moderation: 'Moderation queue', admin: 'Admin console', suspended: 'Your account is suspended; you can read but not make changes.' },
  login: { title: 'Log in', email: 'Email', password: 'Password', submit: 'Log in', checking: 'Checking…', forgot: 'Forgot password', create: 'Create an account' },
  table: { turn: 'Turn', youTurn: 'You · turn', hand: 'Hand', deck: 'Deck', events: 'Events', discard: 'Discard', empty: 'Empty', noEvent: 'No event yet', neutral: 'Neutral', you: 'You', opponent: 'Opponent', stability: 'stability', penalty: 'penalty', leave: 'Leave', practice: 'Practice', casual: 'Casual', private: 'Private', over: 'Match over', yourChoice: 'Your choice', yourTurn: 'Your turn', groveChoosing: 'Grove is choosing', opponentChoosing: 'Opponent is choosing', grovePlaying: 'Grove is playing', opponentTurn: "Opponent's turn", timeouts: 'timeouts', newGame: 'New game', summary: 'Summary', closeSummary: 'Close summary', endDeploy: 'End deployment', settle: 'Settle', surrender: 'Surrender', surrenderAsk: 'Surrender this match? The other player wins.', pass: 'Pass', noPlay: 'No legal play this phase.', choose: 'Choose…', enemyRegion: 'Enemy region', region: 'Region', species: 'Species to move', moveTo: 'Move to', skip: 'Skip', rest: 'Rest: add 2 stability', invasion: 'Invasion: choose the region', migration: 'Migration', discardExactly: 'Discard exactly', discardSelected: 'Discard selected', in: 'in' },
  footer: { rights: '© Eco Dominion. All rights reserved.' },
};

const zh: Dict = {
  nav: { home: '首页', rulings: '裁定', library: '卡牌库', leaderboard: '排行榜', community: '社区', play: '对局', history: '战绩', moderation: '审核', admin: '管理', profile: '资料', logout: '退出', login: '登录', register: '注册', paused: '会话暂停' },
  role: { Admin: '管理员', Moderator: '版主', Guest: '访客', Player: '玩家' },
  rank: { Dominion: '主宰', Apex: '巅峰', Keystone: '拱心', Elder: '长老', Canopy: '林冠', Grove: '林苑', Sapling: '新苗', Seed: '种子' },
  blurb: { Dominion: '牌桌记得你的名字。', Apex: '很少有座位比你更高。', Keystone: '这片林地因你而立。', Elder: '你已在牌桌上度过很长的一季。', Canopy: '你的树冠遮住了区域。', Grove: '你有了自己的一片林。', Sapling: '根已经扎进休闲榜。', Seed: '第一个赛季。' },
  region: { forest: '森林', water: '水域', wild: '旷野', domain: '领地' },
  kind: { species: '物种', tactic: '战术', interference: '干扰', event: '事件', all: '全部' },
  landing: { eyebrow: '四境 · 八回合', title: '守住这片活着的领地。', lede: '森林、水域、旷野与领地。土地会回应守住它的人。', enter: '入座', create: '创建账号', rulings: '阅读裁定' },
  home: { profile: '资料', play: '对局', level: '等级', rating: '休闲积分', ranking: '排名', record: '战绩', streak: '连胜', days: '连续天数', best: '最高得分', hotspot: '热度', activity: '活跃', achievements: '成就', opponents: '对手', recent: '最近对局', openProfile: '打开你的资料', ratedGames: '场积分对局 · 最高', onBoard: '在休闲榜上', unranked: '打一场休闲对局后才会排名', wld: '胜、负、平', bestStreak: '最佳', bestDays: '天连续', widest: '最大分差', hotspotNote: '最近八周每周完成的对局。', achieveNote: '由已完成的对局获得。暗淡的印章还在前面。', noOpponents: '还没有完成的对局。', noRecent: '战绩会出现在这里。', matches: '场', less: '少', more: '多' },
  play: { title: '对局', lede: '休闲对局使用单独的休闲积分。私人房间不计分。排位在平衡测试完成前保持关闭。', inProgress: '你有一局进行中的对局', finishFirst: '先完成或认输，再开始下一局。', return: '返回对局', casual: '休闲队列', waiting: '正在等待另一位玩家…', leave: '离开队列', find: '寻找休闲对局', practice: '练习', practiceNote: '林苑会立刻坐到对面。练习不计分，休闲积分保持不变。', playGrove: '对战林苑', room: '私人房间', share: '把这个代码分享出去：', guest: '正在等待客人加入…', invite: '邀请朋友', send: '发送邀请', cancel: '取消房间', create: '创建私人房间', joinLabel: '用代码加入', join: '加入房间', failed: '出了点问题，请再试一次' },
  library: { title: '卡牌库', lede: '牌组里的每一张牌：卡图、规则原文，以及它真正值得打出的时候。', search: '搜索卡牌库', count: '张牌', deck: '张在牌组中', rules: '规则', use: '怎么用', with: '搭配', none: '没有符合的牌。', cost: '费用', power: '力量' },
  community: { title: '社区', guestLede: '公开帖可以阅读。注册为玩家后才能发布、点赞或评论。', memberLede: '给卡牌或话题加标签，最多附三张图片，并选择谁能看见。', search: '搜索帖子、名字或标签', searchLabel: '搜索社区', guest: '你正在以访客身份浏览。', everyone: '所有人', following: '关注', people: '玩家', suspended: '账号已封禁，可以阅读，但不能更改。', guestsRead: '访客可以阅读。对局、发帖、点赞和评论需要玩家身份。', newPost: '新帖子', tags: '标签', images: '图片，最多三张', who: '谁可以看见', public: '所有人', friends: '好友', private: '仅自己', publish: '发布', publishing: '发布中…', like: '点赞', unlike: '取消赞', comments: '条评论', empty: '还没有帖子。' },
  board: { title: '休闲积分', note: '只统计休闲队列的 Elo（K=32，所有人从 1000 开始）。私人房间不计分，排位尚未开启。非公开资料的玩家会隐去名字。点击表头排序，或在列里输入以筛选。', empty: '还没有积分对局。', player: '玩家', rating: '积分', games: '场次', hidden: '隐藏玩家' },
  history: { title: '对局记录', empty: '还没有完成的对局。', play: '去打一局', when: '时间', result: '结果', opponent: '对手', how: '方式', score: '比分', rating: '积分', replay: '回放', win: '胜', loss: '负', draw: '平', casual: '休闲', private: '私人', unrated: '未计分', scoreReason: '终局得分', domination: '支配', surrender: '认输', timeouts: '超时' },
  profile: { title: '你的资料', upload: '上传头像', uploading: '上传中…', hint: 'JPEG、PNG、WebP、GIF · 1.5 MB', display: '显示名', handle: '账号名', visibility: '可见范围', locale: '地区', bio: '简介', save: '保存资料', saving: '保存中…', saved: '资料已保存。', avatarSaved: '头像已更新。', moderation: '审核队列', admin: '管理后台', suspended: '账号已封禁，可以阅读，但不能更改。' },
  login: { title: '登录', email: '邮箱', password: '密码', submit: '登录', checking: '正在核对…', forgot: '忘记密码', create: '创建账号' },
  table: { turn: '回合', youTurn: '你 · 回合', hand: '手牌', deck: '牌库', events: '事件', discard: '弃牌', empty: '空', noEvent: '还没有事件', neutral: '中立', you: '你', opponent: '对手', stability: '稳定', penalty: '惩罚', leave: '离开', practice: '练习', casual: '休闲', private: '私人', over: '对局结束', yourChoice: '请你选择', yourTurn: '你的回合', groveChoosing: '林苑正在选择', opponentChoosing: '对手正在选择', grovePlaying: '林苑正在行动', opponentTurn: '对手的回合', timeouts: '超时', newGame: '新对局', summary: '结算', closeSummary: '关闭结算', endDeploy: '结束部署', settle: '结算', surrender: '认输', surrenderAsk: '认输这一局？对手获胜。', pass: '跳过', noPlay: '这个阶段没有合法行动。', choose: '选择…', enemyRegion: '敌方区域', region: '区域', species: '要移动的物种', moveTo: '移到', skip: '跳过', rest: '静息：稳定 +2', invasion: '入侵：选择区域', migration: '迁徙', discardExactly: '正好弃掉', discardSelected: '弃掉所选', in: '位于' },
  footer: { rights: '© Eco Dominion. 保留所有权利。' },
};

export function copy(lang: Lang): Dict {
  return lang === 'zh' ? zh : en;
}

export function parseLang(value: string | undefined | null): Lang {
  return value === 'zh' ? 'zh' : 'en';
}

const ACH_ZH: Record<string, { name: string; detail: string }> = {
  first: { name: '第一张桌子', detail: '完成一局' },
  win: { name: '第一次守住', detail: '赢下一局' },
  five: { name: '五次守住', detail: '赢下五局' },
  ten: { name: '常客', detail: '完成十局' },
  resident: { name: '住客', detail: '完成二十五局' },
  hot: { name: '手热', detail: '连赢三局' },
  unbroken: { name: '不败', detail: '连赢五局' },
  returning: { name: '回座', detail: '连续三天对局' },
  week: { name: '一周在桌', detail: '连续七天对局' },
  line: { name: '越过线', detail: '休闲积分达到 1100' },
  canopy: { name: '高林冠', detail: '休闲积分达到 1300' },
  apex: { name: '巅峰积分', detail: '休闲积分达到 1500' },
  harvest: { name: '满桌', detail: '单局得分 12 或更高' },
  heavy: { name: '重冠', detail: '在一场胜利中得分 24 或更高' },
  clear: { name: '干净的守住', detail: '以 8 分或更多获胜' },
  dominion: { name: '三境', detail: '以支配获胜' },
  left: { name: '他们离开了林地', detail: '对手认输而获胜' },
  clock: { name: '时钟上', detail: '对手超时而获胜' },
  shutout: { name: '安静的区域', detail: '计分对局中对手得 0 分而获胜' },
  rival: { name: '宿敌', detail: '击败同一对手三次' },
  both: { name: '两张桌子', detail: '赢下一场休闲对局和一场私人对局' },
};

export function achievementCopy(lang: Lang, id: string, name: string, detail: string) {
  if (lang !== 'zh') return { name, detail };
  return ACH_ZH[id] ?? { name, detail };
}

export function progressCopy(lang: Lang, progress: string) {
  if (lang !== 'zh') return progress;
  return progress
    .replaceAll('matches', '场')
    .replaceAll('wins', '胜')
    .replaceAll('in a row', '连胜')
    .replaceAll('days', '天')
    .replaceAll('Unrated', '未定级')
    .replaceAll('casual', '休闲')
    .replaceAll('private', '私人');
}
