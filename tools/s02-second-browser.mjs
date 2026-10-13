// S02 evidence harness: drives a second, independent headless Chrome (own profile and cookie jar) through the real UI.
// Usage: PLAYER=bea PLAYER_EMAIL=... PLAYER_PASSWORD=... node tools/s02-second-browser.mjs <out-dir> [debug-port]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';

const out = process.argv[2] ?? 'evidence/S02';
const base = 'http://localhost:3000';
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const who = process.env.PLAYER ?? 'player';
const port = Number(process.argv[3] ?? 9333);
const log = (message) => console.log(`${new Date().toISOString()} ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const profile = mkdtempSync(join(tmpdir(), `eco-${who}-`));
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
  const matchResponses = [];
  socket.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
    if (msg.method === 'Network.responseReceived' && /\/api\/matches\/[^/?]+(\?|$|\/commands)/.test(msg.params.response.url)) matchResponses.push(msg.params.requestId);
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

  await cdp('Page.navigate', { url: `${base}/login` });
  await until(`!!document.querySelector('input[name=email]')`, 'login form');
  await evaluate(`(() => {
    const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    set(document.querySelector('input[name=email]'), ${JSON.stringify(process.env.PLAYER_EMAIL)});
    set(document.querySelector('input[name=password]'), ${JSON.stringify(process.env.PLAYER_PASSWORD)});
    document.querySelector('form button[type=submit], form button').click();
  })()`);
  await until(`location.pathname === '/profile'`, 'login to /profile');
  log(`second browser signed in: ${await evaluate(`document.querySelector('main').innerText.split('\\n').slice(0,3).join(' | ')`)}`);

  await cdp('Page.navigate', { url: `${base}/play` });
  await until(`[...document.querySelectorAll('button')].some(b => /Find a casual match|Return to your match/.test(b.textContent) || false) || !!document.querySelector('a.button')`, 'play lobby');
  await evaluate(`(() => { const a = document.querySelector('a.button[href^="/matches/"]'); if (a) return a.click(); [...document.querySelectorAll('button')].find(b => b.textContent.includes('Find a casual match')).click(); })()`);
  await until(`location.pathname.startsWith('/matches/')`, 'match page', 120_000);
  const matchId = await evaluate(`location.pathname.split('/')[2]`);
  log(`second browser joined match ${matchId}`);
  writeFileSync(join(out, `${who}-match-id.txt`), `${matchId}\n`);

  await evaluate(`(${autoplay.toString()})()`);
  const end = Date.now() + 25 * 60_000;
  let printed = 0;
  while (Date.now() < end) {
    await sleep(2000);
    const state = await evaluate(`({ log: window.__autoLog || [], done: !!document.querySelector('.result') })`);
    for (const line of state.log.slice(printed)) log(`${who}: ${line}`);
    printed = state.log.length;
    if (state.done) break;
  }
  log(`final page: ${await evaluate(`document.querySelector('.status').innerText.replace(/\\n+/g, ' | ')`)}`);
  const shot = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, `${who}-browser-final.png`), Buffer.from(shot.result.data, 'base64'));
  const bodies = [];
  for (const requestId of matchResponses.slice(-40)) {
    const body = await cdp('Network.getResponseBody', { requestId });
    if (body.result) bodies.push(body.result.body);
  }
  writeFileSync(join(out, `${who}-browser-network.jsonl`), bodies.join('\n') + '\n');
  log(`saved ${bodies.length} match API response bodies from ${who}'s browser`);
} finally {
  socket?.close();
  browser.kill();
}

/** Runs in the page: plays through the real UI controls, preferring one species per turn, else passes. */
function autoplay() {
  window.__autoLog = [];
  const log = (m) => window.__autoLog.push(m);
  window.__auto = setInterval(() => {
    const buttons = [...document.querySelectorAll('button')].filter((b) => !b.disabled);
    const find = (text) => buttons.find((b) => b.textContent.trim().startsWith(text));
    if (document.querySelector('.result')) { clearInterval(window.__auto); log('finished: ' + document.querySelector('.result strong').textContent); return; }
    const choice = document.querySelector('[aria-label="Your choice"]');
    if (choice) {
      const heading = choice.querySelector('h3')?.textContent ?? '';
      const own = [...choice.querySelectorAll('button')].filter((b) => !b.disabled);
      const discard = heading.match(/Discard exactly (\d+)/);
      if (discard) {
        const cards = [...choice.querySelectorAll('button.card')];
        const picked = cards.filter((c) => c.getAttribute('aria-pressed') === 'true').length;
        if (picked < Number(discard[1])) { cards[cards.length - 1 - picked].click(); return; }
        const confirm = own.find((b) => b.textContent.startsWith('Discard selected'));
        if (confirm) { confirm.click(); log('discard ' + discard[1]); }
        return;
      }
      const skip = own.find((b) => b.textContent === 'Skip');
      if (skip) { skip.click(); log('migration: skip'); return; }
      if (own[0]) { own[0].click(); log(heading.split(':')[0] + ': ' + own[0].textContent); }
      return;
    }
    const status = document.querySelector('.status div')?.textContent ?? '';
    const endDeploy = find('End deployment');
    if (endDeploy) {
      if (window.__tried !== status) {
        window.__tried = status;
        const card = document.querySelector('[aria-label="Your hand"] button.card.species:not(:disabled)');
        if (card) {
          card.click();
          setTimeout(() => {
            const play = [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Play to') && !b.disabled);
            if (play) { log('play ' + card.querySelector('strong').textContent + ' ' + play.textContent.toLowerCase()); play.click(); }
          }, 300);
          return;
        }
      }
      endDeploy.click(); log('end deployment'); return;
    }
    const endTurn = find('End turn and settle');
    if (endTurn) { endTurn.click(); log('end turn'); }
  }, 1500);
}
