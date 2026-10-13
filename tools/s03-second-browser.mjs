// S03 evidence harness: independent headless Chrome for Bea. Logs in, comments/likes Ada's post, tries forbidden edits and moderation, reports, then blocks.
// Usage: PLAYER_EMAIL=... PLAYER_PASSWORD=... node tools/s03-second-browser.mjs [out-dir]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';

const out = process.argv[2] ?? 'evidence/S03';
const base = 'http://localhost:3000';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9334;
const log = (message) => console.log(`${new Date().toISOString()} ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = mkdtempSync(join(tmpdir(), 'eco-bea-s03-'));
const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,1600', 'about:blank'], { stdio: 'ignore' });
let socket;
try {
  let target;
  for (let i = 0; i < 40 && !target; i += 1) {
    await sleep(250);
    target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((list) => list.find((t) => t.type === 'page')).catch(() => undefined);
  }
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.once('open', resolve));
  let next = 0;
  const waiting = new Map();
  socket.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
  });
  const cdp = (method, params = {}) => new Promise((resolve) => { const id = ++next; waiting.set(id, resolve); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const until = async (expression, label, ms = 90_000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (await evaluate(expression)) return; await sleep(500); }
    throw new Error(`Timed out waiting for ${label}`);
  };

  await cdp('Network.enable');
  await cdp('Page.enable');
  const email = `s03-cy-${Date.now()}@ecodominion.test`;
  const password = `Cy-${Math.random().toString(36).slice(2)}-9A`;
  await cdp('Page.navigate', { url: `${base}/register` });
  await until(`!!document.querySelector('input[name=email]')`, 'register form');
  await evaluate(`(() => {
    const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    set(document.querySelector('input[name=name]'), 'Cy Grove');
    set(document.querySelector('input[name=email]'), ${JSON.stringify(email)});
    set(document.querySelector('input[name=password]'), ${JSON.stringify(password)});
    document.querySelector('form button[type=submit], form button').click();
  })()`);
  await until(`location.pathname === '/profile'`, 'register to /profile', 120_000);
  log(`signed in: ${await evaluate(`document.querySelector('main').innerText.split('\\n').slice(0, 3).join(' | ')`)}`);

  await cdp('Page.navigate', { url: `${base}/community` });
  await until(`location.pathname === '/community'`, 'community');
  const postId = await evaluate(`(async () => {
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const feed = await (await fetch('/api/feed')).json();
      const post = (feed.posts || []).find((item) => item.author && item.author.handle === 's01ada');
      if (post) return post.id;
      await new Promise((r) => setTimeout(r, 2000));
    }
    return null;
  })()`);
  if (!postId) throw new Error('Ada post never appeared on Bea feed');
  log(`found Ada post ${postId}`);
  writeFileSync(join(out, 'post-id.txt'), `${postId}\n`);

  await cdp('Page.navigate', { url: `${base}/community/${postId}` });
  await until(`!!document.querySelector('textarea')`, 'thread');
  const engaged = await evaluate(`(async (id) => {
    const like = await fetch('/api/posts/' + id + '/like', { method: 'POST' });
    const comment = await fetch('/api/posts/' + id + '/comments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: 'Hello from the second player.' }) });
    const thread = await (await fetch('/api/posts/' + id)).json();
    return { like: like.status, comment: comment.status, likes: thread.post && thread.post.likes, comments: (thread.comments || []).map((c) => c.body) };
  })(${JSON.stringify(postId)})`);
  log(`like/comment: ${JSON.stringify(engaged)}`);
  writeFileSync(join(out, 'second-player-engage.json'), `${JSON.stringify(engaged, null, 2)}\n`);

  const forbidden = await evaluate(`(async (id) => {
    const edit = await fetch('/api/posts/' + id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: 'Bea rewrote Ada' }) });
    const mod = await fetch('/api/moderation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'hide', reason: 'Bea is not a moderator', subjectType: 'post', subjectId: id }) });
    const report = await fetch('/api/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subjectType: 'post', subjectId: id, reason: 'Testing the report queue' }) });
    return { edit: edit.status, mod: mod.status, report: report.status, editBody: await edit.json(), modBody: await mod.json() };
  })(${JSON.stringify(postId)})`);
  log(`forbidden edit ${forbidden.edit} ${JSON.stringify(forbidden.editBody)}; moderation ${forbidden.mod} ${JSON.stringify(forbidden.modBody)}; report ${forbidden.report}`);
  writeFileSync(join(out, 'bea-forbidden.json'), `${JSON.stringify(forbidden, null, 2)}\n`);

  const blocked = await evaluate(`(async () => {
    const rel = await fetch('/api/players/s01ada/relationship', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'block' }) });
    const feed = await (await fetch('/api/feed')).json();
    const thread = await fetch(${JSON.stringify(`/api/posts/${postId}`)});
    return { relationship: rel.status, feedCount: (feed.posts || []).length, adaVisible: (feed.posts || []).some((p) => p.author && p.author.handle === 's01ada'), thread: thread.status };
  })()`);
  log(`after block: ${JSON.stringify(blocked)}`);
  writeFileSync(join(out, 'bea-after-block.json'), `${JSON.stringify(blocked, null, 2)}\n`);

  const shot = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'bea-community.png'), Buffer.from(shot.result.data, 'base64'));
  log('saved bea-community.png');
} finally {
  socket?.close();
  browser.kill();
}
