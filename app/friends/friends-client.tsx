'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { callApi } from '../components/call-api';
import { copy, type Lang } from '@/lib/i18n';

export type FriendPerson = { handle: string; displayName: string; online: boolean };
type Relation = 'none' | 'outgoing' | 'incoming' | 'friends';
type SearchPerson = { handle: string; displayName: string; relation: Relation };

export function FriendsBoard({
  lang,
  friends,
  incoming,
}: {
  lang: Lang;
  friends: FriendPerson[];
  incoming: FriendPerson[];
}) {
  const text = copy(lang).friends;
  const [requests, setRequests] = useState(incoming);
  const [people, setPeople] = useState(friends);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [results, setResults] = useState<SearchPerson[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const name = query.trim();
    if (!name) {
      setResults([]);
      setSearching(false);
      return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      setSearching(true);
      void callApi<{ players?: SearchPerson[]; error?: string }>(`/api/players/search?q=${encodeURIComponent(name)}`).then(({ ok, data }) => {
        if (stale) return;
        setSearching(false);
        if (!ok) {
          setError(data.error ?? copy(lang).play.failed);
          setResults([]);
          return;
        }
        setResults(data.players ?? []);
      });
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [lang, query]);

  async function act(handle: string, action: 'accept' | 'decline') {
    setError('');
    const { ok, data } = await callApi<{ error?: string }>(`/api/players/${handle}/relationship`, { method: 'POST', body: { action } });
    if (!ok) {
      setError(data.error ?? copy(lang).play.failed);
      return;
    }
    const person = requests.find((item) => item.handle === handle);
    setRequests((list) => list.filter((item) => item.handle !== handle));
    if (action === 'accept' && person) setPeople((list) => [...list, person].sort((a, b) => a.displayName.localeCompare(b.displayName)));
    setResults((list) => list.map((item) => item.handle === handle ? { ...item, relation: action === 'accept' ? 'friends' : 'none' } : item));
  }

  async function add(person: SearchPerson) {
    setError('');
    const action = person.relation === 'incoming' ? 'accept' : 'friend';
    const { ok, data } = await callApi<{ error?: string; friend?: string }>(`/api/players/${person.handle}/relationship`, { method: 'POST', body: { action } });
    if (!ok) {
      setError(data.error ?? copy(lang).play.failed);
      return;
    }
    const next = data.friend === 'friends' ? 'friends' : data.friend === 'incoming' ? 'incoming' : 'outgoing';
    setResults((list) => list.map((item) => item.handle === person.handle ? { ...item, relation: next } : item));
    if (next === 'friends') {
      setRequests((list) => list.filter((item) => item.handle !== person.handle));
      setPeople((list) => list.some((item) => item.handle === person.handle) ? list : [...list, { handle: person.handle, displayName: person.displayName, online: false }].sort((a, b) => a.displayName.localeCompare(b.displayName)));
    }
  }

  const needle = filter.trim().toLowerCase();
  const shown = needle
    ? people.filter((person) => person.displayName.toLowerCase().includes(needle) || person.handle.toLowerCase().includes(needle))
    : people;

  return (
    <div className="stack">
      <form className="friend-search" onSubmit={(event) => event.preventDefault()}>
        <label>
          {text.addFriend}
          <input value={query} placeholder={text.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </form>
      {query.trim() && (
        <section className="panel stack">
          {searching && <p className="note">{text.searching}</p>}
          {!searching && results.length === 0 && <p className="note">{text.noResults}</p>}
          {results.map((person) => (
            <div className="friend-row" key={person.handle}>
              <Link href={`/players/${person.handle}`}>{person.displayName}</Link>
              <span className="note">@{person.handle}</span>
              {person.relation === 'friends' && <span className="note">{text.already}</span>}
              {person.relation === 'outgoing' && <span className="note">{text.sent}</span>}
              {(person.relation === 'none' || person.relation === 'incoming') && (
                <button type="button" onClick={() => add(person)}>{person.relation === 'incoming' ? text.accept : text.add}</button>
              )}
            </div>
          ))}
        </section>
      )}
      <section className="panel stack friend-list">
        <label className="friend-find">
          {text.find}
          <input value={filter} onChange={(event) => setFilter(event.target.value)} />
        </label>
        {people.length === 0 && <p className="note">{text.none}</p>}
        {people.length > 0 && shown.length === 0 && <p className="note">{text.noMatch}</p>}
        {shown.map((person) => (
          <div className="friend-row" key={person.handle}>
            <span className={person.online ? 'presence on' : 'presence'} aria-hidden="true" />
            <Link href={`/players/${person.handle}`}>{person.displayName}</Link>
            <span className="note">@{person.handle} · {person.online ? text.online : text.offline}</span>
            <Link className="button secondary" href={`/players/${person.handle}`}>{text.home}</Link>
          </div>
        ))}
        <div className="friend-request-dock">
          {open && (
            <div className="friend-request-pop panel">
              {requests.length === 0 && <p className="note">{text.noIncoming}</p>}
              {requests.map((person) => (
                <div className="friend-row" key={person.handle}>
                  <Link href={`/players/${person.handle}`}>{person.displayName}</Link>
                  <button type="button" onClick={() => act(person.handle, 'accept')}>{text.accept}</button>
                  <button className="secondary" type="button" onClick={() => act(person.handle, 'decline')}>{text.decline}</button>
                </div>
              ))}
            </div>
          )}
          <button className="secondary friend-request-button" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {text.requests}
            {requests.length > 0 && <span className="count">{requests.length}</span>}
          </button>
        </div>
      </section>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
