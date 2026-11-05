'use client';

import { useState } from 'react';
import type { AdminAudit, AdminMatch, AdminOverview, AdminPerson } from '@/lib/admin-service';
import { copy, type Lang } from '@/lib/i18n';
import { say } from '@/lib/locale-text';
import { callApi } from '../components/call-api';
import { DataTable } from '../components/data-table';

type Payload = AdminOverview & { message?: string; error?: string };

function when(value: string) {
  return value.slice(0, 16).replace('T', ' ');
}

function roleLabel(lang: Lang, role: string) {
  const key = `${role.slice(0, 1).toUpperCase()}${role.slice(1)}` as keyof ReturnType<typeof copy>['role'];
  return copy(lang).role[key] ?? role;
}

function accountStatus(lang: Lang, status: string) {
  if (lang !== 'zh') return status;
  if (status === 'suspended') return '已封禁';
  if (status === 'deleted') return '已删除';
  if (status === 'active') return '正常';
  if (status === 'finished') return '已结束';
  return status;
}

export function AdminConsole({ initial, footer, lang }: { initial: AdminOverview; footer: { copyright: string; contacts: string }; lang: Lang }) {
  const [people, setPeople] = useState<AdminPerson[]>(initial.people);
  const [matches, setMatches] = useState<AdminMatch[]>(initial.matches);
  const [actions, setActions] = useState<AdminAudit[]>(initial.actions);
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState(say(lang, 'Owner adjustment', '站长调整'));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const modes = copy(lang).table;

  function apply(data: Payload) {
    setPeople(data.people);
    setMatches(data.matches);
    setActions(data.actions);
    setMessage(data.message ?? '');
    setError('');
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const { ok, data } = await callApi<Payload>(`/api/admin?q=${encodeURIComponent(query)}`);
    setPending(false);
    if (ok) apply(data);
    else setError(data.error ?? say(lang, 'Could not load accounts', '无法加载账号'));
  }

  async function act(body: Record<string, unknown>) {
    setPending(true);
    setError('');
    setMessage('');
    const { ok, data } = await callApi<Payload>('/api/admin', { method: 'POST', body: { ...body, reason } });
    setPending(false);
    if (ok) apply(data);
    else setError(data.error ?? say(lang, 'Could not apply that change', '无法应用这次更改'));
  }

  return (
    <div className="stack">
      <label>
        {say(lang, 'Reason recorded with the next change', '下次更改会记下的原因')}
        <input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={500} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <section className="stack">
        <h2>{say(lang, 'Footer', '页脚')}</h2>
        <p className="note">{say(lang, 'Copyright and contacts stay on the fixed footer. Admin, player, and guest are the three account roles. A guest can read the leaderboard and community, and cannot play or post.', '版权和联系方式显示在固定页脚。管理员、玩家和访客是三种账号角色。访客可以阅读排行榜和社区，不能对局或发帖。')}</p>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void act({ kind: 'site', copyright: form.get('copyright'), contacts: form.get('contacts') });
          }}
        >
          <label>{say(lang, 'Copyright', '版权')}<input name="copyright" defaultValue={footer.copyright} maxLength={200} required /></label>
          <label>{say(lang, 'Contacts', '联系方式')}<input name="contacts" defaultValue={footer.contacts} maxLength={300} required /></label>
          <button disabled={pending} type="submit">{say(lang, 'Save footer', '保存页脚')}</button>
        </form>
      </section>

      <section className="stack">
        <h2>{say(lang, 'People and registrations', '玩家与注册')}</h2>
        <p className="note">{say(lang, 'Every account that has signed in. New players register themselves. Suspend stops play and posting; it does not delete the account or its matches.', '每一个登录过的账号。新玩家自行注册。封禁会停止对局和发帖，不会删除账号或对局。')}</p>
        <form className="row" onSubmit={search}>
          <label className="grow">
            {say(lang, 'Search handle, email or display name', '搜索账号名、邮箱或显示名')}
            <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} />
          </label>
          <button disabled={pending} type="submit">{say(lang, 'Search', '搜索')}</button>
        </form>
        <DataTable
          lang={lang}
          rowKey={(person) => person.id}
          rows={people}
          columns={[
            {
              id: 'account',
              label: say(lang, 'Account', '账号'),
              value: (person) => `${person.displayName} @${person.handle} ${person.email}`,
              render: (person) => (
                <>
                  <strong>{person.displayName}</strong>
                  <div>@{person.handle}</div>
                  <div className="note">{person.email}{person.verified ? '' : say(lang, ' · email not verified', ' · 邮箱未验证')}</div>
                </>
              ),
            },
            { id: 'registered', label: say(lang, 'Registered', '注册时间'), value: (person) => person.createdAt, render: (person) => `${when(person.createdAt)} UTC` },
            { id: 'status', label: say(lang, 'Status', '状态'), value: (person) => accountStatus(lang, person.status), render: (person) => accountStatus(lang, person.status) },
            { id: 'roles', label: say(lang, 'Roles', '角色'), value: (person) => person.roles.map((role) => roleLabel(lang, role)).join(', ') },
            { id: 'rating', label: say(lang, 'Casual rating', '休闲积分'), value: (person) => person.rating, render: (person) => <>{person.rating} <span className="note">/ {person.games} {say(lang, 'games', '场')}</span></> },
            {
              id: 'manage',
              label: say(lang, 'Manage', '管理'),
              value: (person) => person.handle,
              render: (person) => (
                <details>
                  <summary>{say(lang, 'Manage', '管理')}</summary>
                  <div className="manage">
                    {person.status !== 'deleted' && person.id !== initial.viewerId && (
                      <button
                        disabled={pending}
                        type="button"
                        onClick={() => act({ kind: 'account', handle: person.handle, action: person.status === 'suspended' ? 'unsuspend' : 'suspend' })}
                      >
                        {person.status === 'suspended' ? say(lang, 'Restore account', '恢复账号') : say(lang, 'Suspend', '封禁')}
                      </button>
                    )}
                    {person.status !== 'deleted' && (
                      <>
                        <button disabled={pending} type="button" className="secondary" onClick={() => act({ kind: 'role', handle: person.handle, role: person.roles.includes('guest') && !person.roles.includes('player') ? 'player' : 'guest' })}>
                          {person.roles.includes('guest') && !person.roles.includes('player') ? say(lang, 'Make player', '设为玩家') : say(lang, 'Make guest', '设为访客')}
                        </button>
                        <button disabled={pending} type="button" className="secondary" onClick={() => act({ kind: 'role', handle: person.handle, role: 'moderator', revoke: person.roles.includes('moderator') })}>
                          {person.roles.includes('moderator') ? say(lang, 'Revoke moderator', '撤销版主') : say(lang, 'Grant moderator', '授予版主')}
                        </button>
                        <button
                          disabled={pending || (person.roles.includes('admin') && person.id === initial.viewerId)}
                          type="button"
                          className="secondary"
                          onClick={() => act({ kind: 'role', handle: person.handle, role: 'admin', revoke: person.roles.includes('admin') })}
                        >
                          {person.roles.includes('admin') ? say(lang, 'Revoke admin', '撤销管理员') : say(lang, 'Grant admin', '授予管理员')}
                        </button>
                        <form
                          className="row"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const rating = Number(new FormData(event.currentTarget).get('rating'));
                            void act({ kind: 'rating', handle: person.handle, rating });
                          }}
                        >
                          <input name="rating" type="number" min={0} max={4000} step={1} defaultValue={person.rating} aria-label={say(lang, `Casual rating for ${person.handle}`, `${person.handle} 的休闲积分`)} />
                          <button disabled={pending} type="submit">{say(lang, 'Set rating', '设置积分')}</button>
                        </form>
                      </>
                    )}
                  </div>
                </details>
              ),
            },
          ]}
        />
        {people.length === 0 && <p className="note">{say(lang, 'No accounts match that search.', '没有符合的账号。')}</p>}
      </section>

      <section className="stack">
        <h2>{say(lang, 'Matches', '对局')}</h2>
        <p className="note">{say(lang, 'Results are read-only. The board and each player’s cards stay on the match page for the two participants.', '结果只读。棋盘和双方的牌留在对局页，仅两名参与者可见。')}</p>
        {matches.length === 0 && <p className="note">{say(lang, 'No matches yet.', '还没有对局。')}</p>}
        {matches.length > 0 && (
          <DataTable
            lang={lang}
            rowKey={(match) => match.id}
            rows={matches}
            columns={[
              { id: 'when', label: say(lang, 'When', '时间'), value: (match) => match.finishedAt ?? match.createdAt, render: (match) => `${when(match.finishedAt ?? match.createdAt)} UTC` },
              {
                id: 'mode',
                label: say(lang, 'Mode', '模式'),
                value: (match) => `${match.mode} ${match.status}`,
                render: (match) => <>{modes[match.mode as 'practice' | 'casual' | 'private'] ?? match.mode}<div className="note">{accountStatus(lang, match.status === 'finished' ? 'finished' : match.status)}</div></>,
              },
              { id: 'players', label: say(lang, 'Players', '玩家'), value: (match) => match.players.join(' '), render: (match) => `@${match.players[0] ?? '—'} vs @${match.players[1] ?? '—'}` },
              {
                id: 'result',
                label: say(lang, 'Result', '结果'),
                value: (match) => match.winner ?? match.status,
                render: (match) => (
                  <>
                    {match.status !== 'finished' && say(lang, 'In progress', '进行中')}
                    {match.status === 'finished' && (match.winner ? `@${match.winner}` : say(lang, 'Draw', '平局'))}
                    {match.scores && <div className="note">{match.scores[0]}–{match.scores[1]}{match.reason ? ` · ${match.reason}` : ''}</div>}
                  </>
                ),
              },
              {
                id: 'rating',
                label: say(lang, 'Rating', '积分'),
                value: (match) => match.ratings[0]?.after ?? 0,
                render: (match) => (
                  <>
                    {match.ratings[0] ? `${match.ratings[0].before} → ${match.ratings[0].after}` : '—'}
                    <div className="note">{match.ratings[1] ? `${match.ratings[1].before} → ${match.ratings[1].after}` : say(lang, 'Unrated', '未计分')}</div>
                  </>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="stack">
        <h2>{say(lang, 'Recorded changes', '已记录的更改')}</h2>
        {actions.length === 0 && <p className="note">{say(lang, 'No role, rating or moderation changes yet.', '还没有角色、积分或审核方面的更改。')}</p>}
        {actions.length > 0 && (
          <DataTable
            lang={lang}
            rowKey={(entry) => entry.id}
            rows={actions}
            columns={[
              { id: 'when', label: say(lang, 'When', '时间'), value: (entry) => entry.createdAt, render: (entry) => `${when(entry.createdAt)} UTC` },
              { id: 'action', label: say(lang, 'Action', '操作'), value: (entry) => entry.action },
              { id: 'actor', label: say(lang, 'Actor', '执行人'), value: (entry) => entry.actor },
              { id: 'subject', label: say(lang, 'Subject', '对象'), value: (entry) => entry.subject },
              { id: 'detail', label: say(lang, 'Detail', '详情'), value: (entry) => entry.detail ?? '' },
            ]}
          />
        )}
      </section>
    </div>
  );
}
