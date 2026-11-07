export type Lang = 'en' | 'zh';

export const LANG_COOKIE = 'eco-lang';

type Dict = {
  nav: Record<'home' | 'rulings' | 'library' | 'leaderboard' | 'community' | 'friends' | 'play' | 'history' | 'moderation' | 'admin' | 'profile' | 'settings' | 'logout' | 'login' | 'register' | 'paused', string>;
  role: Record<'Admin' | 'Moderator' | 'Guest' | 'Player', string>;
  rank: Record<'Sprout' | 'Sapling' | 'Tree' | 'Forest' | 'Ecosystem', string>;
  region: Record<'forest' | 'water' | 'wild' | 'domain', string>;
  kind: Record<'species' | 'tactic' | 'interference' | 'event' | 'all', string>;
  landing: { eyebrow: string; title: string; lede: string; enter: string; create: string; rulings: string };
  home: Record<'profile' | 'play' | 'level' | 'xpNote' | 'ladderNote' | 'lastGain' | 'nextRank' | 'rating' | 'ranking' | 'record' | 'streak' | 'days' | 'best' | 'hotspot' | 'activity' | 'achievements' | 'opponents' | 'recent' | 'openProfile' | 'ratedGames' | 'onBoard' | 'unranked' | 'wld' | 'bestStreak' | 'bestDays' | 'widest' | 'hotspotNote' | 'achieveNote' | 'noOpponents' | 'noRecent' | 'matches' | 'less' | 'more', string>;
  play: Record<'title' | 'lede' | 'inProgress' | 'finishFirst' | 'return' | 'casual' | 'casualNote' | 'waiting' | 'leave' | 'find' | 'ranked' | 'rankedNote' | 'findRanked' | 'practice' | 'practiceNote' | 'playGrove' | 'room' | 'roomNote' | 'share' | 'guest' | 'invite' | 'send' | 'cancel' | 'create' | 'joinLabel' | 'join' | 'failed' | 'waitingFriend' | 'pickFriend' | 'noFriends' | 'invited' | 'incoming' | 'joinFriend', string>;
  library: Record<'title' | 'lede' | 'search' | 'count' | 'deck' | 'rules' | 'use' | 'with' | 'none' | 'cost' | 'power', string>;
  community: Record<'title' | 'guestLede' | 'memberLede' | 'search' | 'searchLabel' | 'guest' | 'everyone' | 'following' | 'people' | 'suspended' | 'guestsRead' | 'newPost' | 'tags' | 'images' | 'who' | 'public' | 'friends' | 'private' | 'publish' | 'publishing' | 'like' | 'unlike' | 'comments' | 'empty', string>;
  board: Record<'title' | 'note' | 'empty' | 'player' | 'rating' | 'games' | 'hidden', string>;
  history: Record<'title' | 'empty' | 'play' | 'when' | 'result' | 'opponent' | 'how' | 'score' | 'rating' | 'replay' | 'win' | 'loss' | 'draw' | 'ranked' | 'casual' | 'practice' | 'private' | 'unrated' | 'scoreReason' | 'domination' | 'surrender' | 'timeouts', string>;
  profile: Record<'title' | 'upload' | 'uploading' | 'hint' | 'display' | 'handle' | 'visibility' | 'locale' | 'bio' | 'save' | 'saving' | 'saved' | 'avatarSaved' | 'moderation' | 'admin' | 'suspended', string>;
  settings: Record<'title' | 'game' | 'textFree' | 'on' | 'off' | 'privacy' | 'saved' | 'profile', string>;
  friends: Record<'title' | 'lede' | 'online' | 'offline' | 'none' | 'incoming' | 'noIncoming' | 'home' | 'hiddenRecord' | 'hiddenAchievements' | 'hiddenHotspot' | 'hiddenActivity' | 'accept' | 'decline' | 'addFriend' | 'searchPlaceholder' | 'searching' | 'noResults' | 'find' | 'noMatch' | 'add' | 'sent' | 'already' | 'requests', string>;
  login: Record<'title' | 'email' | 'password' | 'submit' | 'checking' | 'forgot' | 'create', string>;
  table: Record<'turn' | 'youTurn' | 'hand' | 'deck' | 'events' | 'discard' | 'empty' | 'noEvent' | 'neutral' | 'you' | 'opponent' | 'stability' | 'penalty' | 'leave' | 'practice' | 'ranked' | 'casual' | 'private' | 'over' | 'yourChoice' | 'yourTurn' | 'groveChoosing' | 'opponentChoosing' | 'grovePlaying' | 'opponentTurn' | 'timeouts' | 'newGame' | 'summary' | 'closeSummary' | 'endDeploy' | 'endTurn' | 'backToLobby' | 'replayLater' | 'settle' | 'surrender' | 'surrenderAsk' | 'pass' | 'backToGame' | 'resumeChoice' | 'cancelCard' | 'playHow' | 'noPlay' | 'choose' | 'enemyRegion' | 'region' | 'species' | 'moveTo' | 'skip' | 'rest' | 'invasion' | 'migration' | 'discardExactly' | 'discardSelected' | 'discardAsk' | 'discardYes' | 'discardNo' | 'discardHow' | 'in', string>;
  footer: { rights: string };
};

const en: Dict = {
  nav: { home: 'Home', rulings: 'Rulings', library: 'Library', leaderboard: 'Leaderboard', community: 'Community', friends: 'Friends', play: 'Play', history: 'History', moderation: 'Moderation', admin: 'Admin', profile: 'Profile', settings: 'Settings', logout: 'Log out', login: 'Log in', register: 'Register', paused: 'Session paused' },
  role: { Admin: 'Admin', Moderator: 'Moderator', Guest: 'Guest', Player: 'Player' },
  rank: { Sprout: 'Sprout', Sapling: 'Sapling', Tree: 'Prime', Forest: 'Ancient', Ecosystem: 'Giant' },
  region: { forest: 'Forest', water: 'Water', wild: 'Wild', domain: 'Highland' },
  kind: { species: 'Species', tactic: 'Tactic', interference: 'Interference', event: 'Event', all: 'All' },
  landing: { eyebrow: 'Four realms · eight turns', title: 'Life spreads,\neach to its own ground', lede: 'Forest, water, wild, and highland. The land answers the one who keeps it.', enter: 'Start game', create: 'Create account', rulings: 'Read the rulings' },
  home: { profile: 'Profile', play: 'Play', level: 'Level', xpNote: 'Level points only go up. Ladder: win +40, draw +25, loss +15. Casual: win +25, draw +15, loss +10. Practice and private rooms add none.', ladderNote: 'Ladder matches only. Win +30, loss −20. Sprout never loses points. A tier you have reached cannot be left.', lastGain: 'Last match', nextRank: 'Next rank', rating: 'Ladder score', ranking: 'Ranking', record: 'Record', streak: 'Win streak', days: 'Day streak', best: 'Best score', hotspot: 'Hotspot', activity: 'Activity', achievements: 'Achievements', opponents: 'Opponents', recent: 'Recent games', openProfile: 'Open your profile', ratedGames: 'ladder games · peak', onBoard: 'On the ladder', unranked: 'Play a ladder match to score', wld: 'Wins, losses, draws · ladder and casual', bestStreak: 'Best', bestDays: 'days in a row', widest: 'Widest win', hotspotNote: 'Finished matches in each of the last eight weeks.', achieveNote: 'Earned from finished matches. A dim seal is still ahead of you.', noOpponents: 'No finished matches yet.', noRecent: 'Your history will show up here.', matches: 'matches', less: 'Less', more: 'More' },
  play: { title: 'Play', lede: 'Win +30, loss −20.', inProgress: 'You have a match in progress', finishFirst: 'Finish or concede it before starting another.', return: 'Return to your match', casual: 'Casual', casualNote: 'Not on the ladder.', waiting: 'Waiting for another player…', leave: 'Leave queue', find: 'Find a casual match', ranked: 'Ladder', rankedNote: 'Win +30, loss −20.', findRanked: 'Find a ladder match', practice: 'Practice', practiceNote: 'Robot takes the other seat immediately. Practice is unrated and stays off your home record.', playGrove: 'Play Robot', room: 'Private room', roomNote: 'Open a room and invite a friend. They join from Play.', share: 'Share this code:', guest: 'Waiting for your guest to join…', invite: 'Invite a friend', send: 'Send invite', cancel: 'Cancel room', create: 'Create a private room', joinLabel: 'Join with a code', join: 'Join room', failed: 'Something went wrong; try again', waitingFriend: 'Waiting for a friend to join…', pickFriend: 'Invite a friend', noFriends: 'Add a friend first.', invited: 'Invite sent.', incoming: 'Invitations', joinFriend: 'Join' },
  library: { title: 'Card library', lede: 'Every card in the deck, with its art, the rules text, and when it is actually worth playing.', search: 'Search the library', count: 'cards', deck: 'in the deck', rules: 'Rules.', use: 'How to use it.', with: 'Play it with.', none: 'No card matches that search.', cost: 'cost', power: 'power' },
  community: { title: 'Community', guestLede: 'Public posts are open to read. Register as a player to publish, like, or comment.', memberLede: 'Tag a card or a topic, attach up to three images, and choose who can see the post.', search: 'Search posts, names, or tags', searchLabel: 'Search the community', guest: 'You are browsing as a guest.', everyone: 'Everyone', following: 'Following', people: 'People', suspended: 'Your account is suspended; you can read but not make changes.', guestsRead: 'Guests can read posts. Playing, posting, likes, and comments are for players.', newPost: 'New post', tags: 'Tags', images: 'Images, up to three', who: 'Who can see it', public: 'Everyone', friends: 'Friends', private: 'Only me', publish: 'Publish', publishing: 'Publishing…', like: 'Like', unlike: 'Unlike', comments: 'comments', empty: 'No posts yet.' },
  board: { title: 'Ladder', note: 'Win +30, loss −20. Players with non-public profiles are listed without their name. Click a heading to sort, or type in a column to filter.', empty: 'No ladder points yet.', player: 'Player', rating: 'Score', games: 'Games', hidden: 'Hidden player' },
  history: { title: 'Match history', empty: 'No finished matches yet.', play: 'Play one', when: 'When', result: 'Result', opponent: 'Opponent', how: 'How', score: 'Score', rating: 'Ladder score', replay: 'Replay', win: 'Win', loss: 'Loss', draw: 'Draw', ranked: 'Ladder', casual: 'Casual', practice: 'Practice', private: 'Private', unrated: 'Unrated', scoreReason: 'final score', domination: 'domination', surrender: 'surrender', timeouts: 'timeouts' },
  profile: { title: 'Your profile', upload: 'Upload avatar', uploading: 'Uploading…', hint: 'JPEG, PNG, WebP, GIF · 1.5 MB', display: 'Display name', handle: 'Handle', visibility: 'Visibility', locale: 'Locale', bio: 'Bio', save: 'Save profile', saving: 'Saving…', saved: 'Profile saved.', avatarSaved: 'Avatar updated.', moderation: 'Moderation queue', admin: 'Admin console', suspended: 'Your account is suspended; you can read but not make changes.' },
  settings: { title: 'Settings', game: 'Game', textFree: 'Text-free cards', on: 'On', off: 'Off', privacy: 'Privacy', saved: 'Privacy saved.', profile: 'Profile' },
  friends: { title: 'Friends', lede: 'Friends can open your home page, except the parts you hide in Settings.', online: 'Online', offline: 'Offline', none: 'No friends yet.', incoming: 'Requests', noIncoming: 'No requests.', home: 'Home', hiddenRecord: 'This friend hides their record.', hiddenAchievements: 'This friend hides their achievements.', hiddenHotspot: 'This friend hides their hotspot.', hiddenActivity: 'This friend hides their activity.', accept: 'Accept', decline: 'Decline', addFriend: 'Add a friend', searchPlaceholder: 'Terry', searching: 'Searching…', noResults: 'No one by that name.', find: 'Search friends', noMatch: 'No friend by that name.', add: 'Add', sent: 'Sent', already: 'Friends', requests: 'Requests' },
  login: { title: 'Log in', email: 'Email', password: 'Password', submit: 'Log in', checking: 'Checking…', forgot: 'Forgot password', create: 'Create an account' },
  table: { turn: 'Turn', youTurn: 'You · turn', hand: 'Hand', deck: 'Deck', events: 'Events', discard: 'Discard', empty: 'Empty', noEvent: 'No event yet', neutral: 'Neutral', you: 'You', opponent: 'Opponent', stability: 'stability', penalty: 'penalty', leave: 'Leave', practice: 'Practice', ranked: 'Ladder', casual: 'Casual', private: 'Private', over: 'Match over', yourChoice: 'Your choice', yourTurn: 'Your turn', groveChoosing: 'Robot is choosing', opponentChoosing: 'Opponent is choosing', grovePlaying: 'Robot is playing', opponentTurn: "Opponent's turn", timeouts: 'timeouts', newGame: 'New game', summary: 'Summary', closeSummary: 'Close summary', endDeploy: 'End deployment', endTurn: 'End turn', backToLobby: 'Back to the lobby', replayLater: 'The replay is in your history.', settle: 'Settle', surrender: 'Surrender', surrenderAsk: 'Surrender this match? The other player wins.', pass: 'Pass', backToGame: 'Back to the game', resumeChoice: 'Return to the choice', cancelCard: 'Cancel this card', playHow: 'Double-click a card, or drag it onto the board.', noPlay: 'No legal play this phase.', choose: 'Choose…', enemyRegion: 'Enemy region', region: 'Region', species: 'Species to move', moveTo: 'Move to', skip: 'Skip', rest: 'Rest: add 2 stability', invasion: 'Invasion: choose the region', migration: 'Migration', discardExactly: 'Discard exactly', discardSelected: 'Discard selected', discardAsk: 'Discard this card?', discardYes: 'Discard it', discardNo: 'Cancel', discardHow: 'End of turn. Double-click the card to discard.', in: 'in' },
  footer: { rights: '© Eco Dominion. All rights reserved.' },
};

const zh: Dict = {
  nav: { home: '首页', rulings: '规则', library: '卡牌库', leaderboard: '排行榜', community: '社区', friends: '好友', play: '对战', history: '战绩', moderation: '审核', admin: '管理', profile: '资料', settings: '设置', logout: '退出登录', login: '登录', register: '注册', paused: '会话暂停' },
  role: { Admin: '管理员', Moderator: '版主', Guest: '访客', Player: '玩家' },
  rank: { Sprout: '新芽', Sapling: '幼树', Tree: '盛树', Forest: '古树', Ecosystem: '巨树' },
  region: { forest: '森林', water: '水域', wild: '旷野', domain: '高地' },
  kind: { species: '物种', tactic: '战术', interference: '干扰', event: '事件', all: '全部' },
  landing: { eyebrow: '四境 · 八回合', title: '生生蔓延，\n各栖一方', lede: '森林、水域、旷野与高地。土地会回应守住它的人。', enter: '开始游戏', create: '创建账号', rulings: '阅读规则' },
  home: { profile: '资料', play: '对局', level: '等级', xpNote: '等级分只增不减。天梯：胜 +40，平 +25，负 +15。休闲：胜 +25，平 +15，负 +10。练习和私人房间不加。', ladderNote: '只有天梯对局会变。赢 +30，输 -20。新芽是新手期，输了不扣分。到过的段位不会再掉下去。', lastGain: '上一局', nextRank: '下一段', rating: '天梯分', ranking: '排名', record: '战绩', streak: '连胜', days: '连续天数', best: '最高得分', hotspot: '热度', activity: '活跃', achievements: '成就', opponents: '对手', recent: '最近对局', openProfile: '打开你的资料', ratedGames: '场天梯对局 · 最高', onBoard: '在天梯上', unranked: '打一场天梯对局后才会有天梯分', wld: '胜、负、平 · 天梯与休闲', bestStreak: '最佳', bestDays: '天连续', widest: '最大分差', hotspotNote: '最近八周每周完成的对局。', achieveNote: '由已完成的对局获得。暗淡的印章还在前面。', noOpponents: '还没有完成的对局。', noRecent: '战绩会出现在这里。', matches: '场', less: '少', more: '多' },
  play: { title: '对局', lede: '赢 +30，输 -20。', inProgress: '你有一局进行中的对局', finishFirst: '先完成或认输，再开始下一局。', return: '返回对局', casual: '休闲', casualNote: '不计天梯分。', waiting: '正在等待另一位玩家…', leave: '离开队列', find: '寻找休闲对局', ranked: '天梯', rankedNote: '赢 +30，输 -20。', findRanked: '寻找天梯对局', practice: '练习', practiceNote: '机器人会立刻坐到对面。练习不计分，也不计入首页胜负。', playGrove: '对战机器人', room: '私人房间', roomNote: '开一间房，再邀请好友。对方在对战页加入。', share: '把这个代码分享出去：', guest: '正在等待客人加入…', invite: '邀请朋友', send: '发送邀请', cancel: '取消房间', create: '创建私人房间', joinLabel: '用代码加入', join: '加入房间', failed: '出了点问题，请再试一次', waitingFriend: '正在等待好友加入…', pickFriend: '邀请好友', noFriends: '先加一位好友。', invited: '邀请已送出。', incoming: '收到的邀请', joinFriend: '加入' },
  library: { title: '卡牌库', lede: '牌组里的每一张牌：卡图、规则原文，以及它真正值得打出的时候。', search: '搜索卡牌库', count: '张牌', deck: '张在牌组中', rules: '规则', use: '怎么用', with: '搭配', none: '没有符合的牌。', cost: '费用', power: '权重' },
  community: { title: '社区', guestLede: '公开帖可以阅读。注册为玩家后才能发布、点赞或评论。', memberLede: '给卡牌或话题加标签，最多附三张图片，并选择谁能看见。', search: '搜索帖子、名字或标签', searchLabel: '搜索社区', guest: '你正在以访客身份浏览。', everyone: '所有人', following: '关注', people: '玩家', suspended: '账号已封禁，可以阅读，但不能更改。', guestsRead: '访客可以阅读。对局、发帖、点赞和评论需要玩家身份。', newPost: '新帖子', tags: '标签', images: '图片，最多三张', who: '谁可以看见', public: '所有人', friends: '好友', private: '仅自己', publish: '发布', publishing: '发布中…', like: '点赞', unlike: '取消赞', comments: '条评论', empty: '还没有帖子。' },
  board: { title: '天梯', note: '赢 +30，输 -20。非公开资料的玩家会隐去名字。点击表头排序，或在列里输入以筛选。', empty: '还没有天梯分。', player: '玩家', rating: '天梯分', games: '场次', hidden: '隐藏玩家' },
  history: { title: '对局记录', empty: '还没有完成的对局。', play: '去打一局', when: '时间', result: '结果', opponent: '对手', how: '方式', score: '比分', rating: '天梯分', replay: '回放', win: '胜', loss: '负', draw: '平', ranked: '天梯', casual: '休闲', practice: '练习', private: '私人', unrated: '未计分', scoreReason: '终局得分', domination: '支配', surrender: '认输', timeouts: '超时' },
  profile: { title: '你的资料', upload: '上传头像', uploading: '上传中…', hint: 'JPEG、PNG、WebP、GIF · 1.5 MB', display: '显示名', handle: '账号名', visibility: '可见范围', locale: '地区', bio: '简介', save: '保存资料', saving: '保存中…', saved: '资料已保存。', avatarSaved: '头像已更新。', moderation: '审核队列', admin: '管理后台', suspended: '账号已封禁，可以阅读，但不能更改。' },
  settings: { title: '设置', game: '游戏设置', textFree: '无文字卡牌', on: '开', off: '关', privacy: '隐私设置', saved: '隐私已保存。', profile: '资料设置' },
  friends: { title: '好友', lede: '好友可以打开你的首页，设置里藏起的部分除外。', online: '在线', offline: '离线', none: '还没有好友。', incoming: '申请', noIncoming: '没有申请。', home: '首页', hiddenRecord: '这位好友隐藏了战绩。', hiddenAchievements: '这位好友隐藏了成就。', hiddenHotspot: '这位好友隐藏了热度。', hiddenActivity: '这位好友隐藏了活跃。', accept: '接受', decline: '拒绝', addFriend: '添加好友', searchPlaceholder: 'Terry', searching: '搜索中…', noResults: '没有找到这个名字。', find: '搜索好友', noMatch: '没有这位好友。', add: '添加', sent: '已发送', already: '已是好友', requests: '申请' },
  login: { title: '登录', email: '邮箱', password: '密码', submit: '登录', checking: '正在核对…', forgot: '忘记密码', create: '创建账号' },
  table: { turn: '回合', youTurn: '你 · 回合', hand: '手牌', deck: '牌库', events: '事件', discard: '弃牌', empty: '空', noEvent: '还没有事件', neutral: '中立', you: '你', opponent: '对手', stability: '稳定', penalty: '惩罚', leave: '离开', practice: '练习', ranked: '天梯', casual: '休闲', private: '私人', over: '对局结束', yourChoice: '请你选择', yourTurn: '你的回合', groveChoosing: '机器人正在选择', opponentChoosing: '对手正在选择', grovePlaying: '机器人正在行动', opponentTurn: '对手的回合', timeouts: '超时', newGame: '新对局', summary: '结算', closeSummary: '关闭结算', endDeploy: '结束部署', endTurn: '结束回合', backToLobby: '返回对战大厅', replayLater: '回放可以在战绩里看。', settle: '结算', surrender: '认输', surrenderAsk: '认输这一局？对手获胜。', pass: '跳过', backToGame: '返回游戏', resumeChoice: '返回选择', cancelCard: '取消这张牌', playHow: '双击手牌，或拖到战场上打出。', noPlay: '这个阶段没有合法行动。', choose: '选择…', enemyRegion: '敌方区域', region: '区域', species: '要移动的物种', moveTo: '移到', skip: '跳过', rest: '静息：稳定 +2', invasion: '入侵：选择区域', migration: '迁徙', discardExactly: '正好弃掉', discardSelected: '弃掉所选', discardAsk: '确认丢弃这张牌？', discardYes: '确认丢弃', discardNo: '取消', discardHow: '回合结束。双击要弃掉的牌。', in: '位于' },
  footer: { rights: '© Eco Dominion. 保留所有权利。' },
};

export function copy(lang: Lang): Dict {
  return lang === 'zh' ? zh : en;
}

export function parseLang(value: string | undefined | null): Lang {
  return value === 'zh' ? 'zh' : 'en';
}

const ACH_ZH: Record<string, { name: string; detail: string }> = {
  first: { name: '初临', detail: '完成一局' },
  win: { name: '首胜', detail: '赢下一局' },
  five: { name: '五胜', detail: '赢下五局' },
  ten: { name: '熟手', detail: '完成十局' },
  resident: { name: '老手', detail: '完成二十五局' },
  hot: { name: '三连', detail: '连赢三局' },
  unbroken: { name: '五连', detail: '连赢五局' },
  returning: { name: '三日', detail: '连续三天对局' },
  week: { name: '七日', detail: '连续七天对局' },
  line: { name: '幼树', detail: '天梯分达到 300' },
  prime: { name: '盛树', detail: '天梯分达到 600' },
  canopy: { name: '古树', detail: '天梯分达到 800' },
  apex: { name: '巨树', detail: '天梯分达到 1000' },
  harvest: { name: '丰收', detail: '单局得分 12' },
  heavy: { name: '高分', detail: '胜场得分 24' },
  clear: { name: '横扫', detail: '净胜 8 分' },
  dominion: { name: '支配', detail: '以支配获胜' },
  left: { name: '受降', detail: '对手认输' },
  clock: { name: '守时', detail: '对手超时' },
  shutout: { name: '零封', detail: '对手得 0 分' },
  rival: { name: '宿敌', detail: '同一对手三胜' },
  both: { name: '双栖', detail: '休闲与私人各胜一局' },
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
