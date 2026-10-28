'use client';

import { useState } from 'react';
import type { AdminAudit, AdminMatch, AdminOverview, AdminPerson } from '@/lib/admin-service';
import { callApi } from '../components/call-api';
import { DataTable } from '../components/data-table';

type Payload = AdminOverview & { message?: string; error?: string };

function when(value: string) {
  return value.slice(0, 16).replace('T', ' ');
}

export function AdminConsole({ initial, footer }: { initial: AdminOverview; footer: { copyright: string; contacts: string } }) {
  const [people, setPeople] = useState<AdminPerson[]>(initial.people);
  const [matches, setMatches] = useState<AdminMatch[]>(initial.matches);
  const [actions, setActions] = useState<AdminAudit[]>(initial.actions);
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('Owner adjustment');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

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
    else setError(data.error ?? 'Could not load accounts');
  }

  async function act(body: Record<string, unknown>) {
    setPending(true);
    setError('');
    setMessage('');
    const { ok, data } = await callApi<Payload>('/api/admin', { method: 'POST', body: { ...body, reason } });
    setPending(false);
    if (ok) apply(data);
    else setError(data.error ?? 'Could not apply that change');
  }

  return (
    <div className="stack">
      <label>
        Reason recorded with the next change
        <input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={500} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <section className="stack">
        <h2>Footer</h2>
        <p className="note">Copyright and contacts stay on the fixed footer. Admin, player, and guest are the three account roles. A guest can read the leaderboard and community, and cannot play or post.</p>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void act({ kind: 'site', copyright: form.get('copyright'), contacts: form.get('contacts') });
          }}
        >
          <label>Copyright<input name="copyright" defaultValue={footer.copyright} maxLength={200} required /></label>
          <label>Contacts<input name="contacts" defaultValue={footer.contacts} maxLength={300} required /></label>
          <button disabled={pending} type="submit">Save footer</button>
        </form>
      </section>

      <section className="stack">
        <h2>People and registrations</h2>
        <p className="note">Every account that has signed in. New players register themselves. Suspend stops play and posting; it does not delete the account or its matches.</p>
        <form className="row" onSubmit={search}>
          <label className="grow">
            Search handle, email or display name
            <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} />
          </label>
          <button disabled={pending} type="submit">Search</button>
        </form>
        <DataTable
          rowKey={(person) => person.id}
          rows={people}
          columns={[
            {
              id: 'account',
              label: 'Account',
              value: (person) => `${person.displayName} @${person.handle} ${person.email}`,
              render: (person) => (
                <>
                  <strong>{person.displayName}</strong>
                  <div>@{person.handle}</div>
                  <div className="note">{person.email}{person.verified ? '' : ' · email not verified'}</div>
                </>
              ),
            },
            { id: 'registered', label: 'Registered', value: (person) => person.createdAt, render: (person) => `${when(person.createdAt)} UTC` },
            { id: 'status', label: 'Status', value: (person) => person.status },
            { id: 'roles', label: 'Roles', value: (person) => person.roles.join(', ') },
            { id: 'rating', label: 'Casual rating', value: (person) => person.rating, render: (person) => <>{person.rating} <span className="note">/ {person.games} games</span></> },
            {
              id: 'manage',
              label: 'Manage',
              value: (person) => person.handle,
              render: (person) => (
                <details>
                  <summary>Manage</summary>
                  <div className="manage">
                    {person.status !== 'deleted' && person.id !== initial.viewerId && (
                      <button
                        disabled={pending}
                        type="button"
                        onClick={() => act({ kind: 'account', handle: person.handle, action: person.status === 'suspended' ? 'unsuspend' : 'suspend' })}
                      >
                        {person.status === 'suspended' ? 'Restore account' : 'Suspend'}
                      </button>
                    )}
                    {person.status !== 'deleted' && (
                      <>
                        <button disabled={pending} type="button" className="secondary" onClick={() => act({ kind: 'role', handle: person.handle, role: person.roles.includes('guest') && !person.roles.includes('player') ? 'player' : 'guest' })}>
                          {person.roles.includes('guest') && !person.roles.includes('player') ? 'Make player' : 'Make guest'}
                        </button>
                        <button disabled={pending} type="button" className="secondary" onClick={() => act({ kind: 'role', handle: person.handle, role: 'moderator', revoke: person.roles.includes('moderator') })}>
                          {person.roles.includes('moderator') ? 'Revoke moderator' : 'Grant moderator'}
                        </button>
                        <button
                          disabled={pending || (person.roles.includes('admin') && person.id === initial.viewerId)}
                          type="button"
                          className="secondary"
                          onClick={() => act({ kind: 'role', handle: person.handle, role: 'admin', revoke: person.roles.includes('admin') })}
                        >
                          {person.roles.includes('admin') ? 'Revoke admin' : 'Grant admin'}
                        </button>
                        <form
                          className="row"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const rating = Number(new FormData(event.currentTarget).get('rating'));
                            void act({ kind: 'rating', handle: person.handle, rating });
                          }}
                        >
                          <input name="rating" type="number" min={0} max={4000} step={1} defaultValue={person.rating} aria-label={`Casual rating for ${person.handle}`} />
                          <button disabled={pending} type="submit">Set rating</button>
                        </form>
                      </>
                    )}
                  </div>
                </details>
              ),
            },
          ]}
        />
        {people.length === 0 && <p className="note">No accounts match that search.</p>}
      </section>

      <section className="stack">
        <h2>Matches</h2>
        <p className="note">Results are read-only. The board and each player’s cards stay on the match page for the two participants.</p>
        {matches.length === 0 && <p className="note">No matches yet.</p>}
        {matches.length > 0 && (
          <DataTable
            rowKey={(match) => match.id}
            rows={matches}
            columns={[
              { id: 'when', label: 'When', value: (match) => match.finishedAt ?? match.createdAt, render: (match) => `${when(match.finishedAt ?? match.createdAt)} UTC` },
              { id: 'mode', label: 'Mode', value: (match) => `${match.mode} ${match.status}`, render: (match) => <>{match.mode}<div className="note">{match.status}</div></> },
              { id: 'players', label: 'Players', value: (match) => match.players.join(' ') , render: (match) => `@${match.players[0] ?? '—'} vs @${match.players[1] ?? '—'}` },
              {
                id: 'result',
                label: 'Result',
                value: (match) => match.winner ?? match.status,
                render: (match) => (
                  <>
                    {match.status !== 'finished' && 'In progress'}
                    {match.status === 'finished' && (match.winner ? `@${match.winner}` : 'Draw')}
                    {match.scores && <div className="note">{match.scores[0]}–{match.scores[1]}{match.reason ? ` · ${match.reason}` : ''}</div>}
                  </>
                ),
              },
              {
                id: 'rating',
                label: 'Rating',
                value: (match) => match.ratings[0]?.after ?? 0,
                render: (match) => (
                  <>
                    {match.ratings[0] ? `${match.ratings[0].before} → ${match.ratings[0].after}` : '—'}
                    <div className="note">{match.ratings[1] ? `${match.ratings[1].before} → ${match.ratings[1].after}` : 'Unrated'}</div>
                  </>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="stack">
        <h2>Recorded changes</h2>
        {actions.length === 0 && <p className="note">No role, rating or moderation changes yet.</p>}
        {actions.length > 0 && (
          <DataTable
            rowKey={(entry) => entry.id}
            rows={actions}
            columns={[
              { id: 'when', label: 'When', value: (entry) => entry.createdAt, render: (entry) => `${when(entry.createdAt)} UTC` },
              { id: 'action', label: 'Action', value: (entry) => entry.action },
              { id: 'actor', label: 'Actor', value: (entry) => entry.actor },
              { id: 'subject', label: 'Subject', value: (entry) => entry.subject },
              { id: 'detail', label: 'Detail', value: (entry) => entry.detail ?? '' },
            ]}
          />
        )}
      </section>
    </div>
  );
}
