// Usage: node --env-file=.env.local tools/s02-leak-check.mjs <match-id> <seat>:<responses.jsonl> [...]
// Rebuilds every authoritative state from the stored seed and commands, then checks that each captured
// response for a seat never contains a card uid that was hidden from that seat at the response's version.
import { readFileSync } from 'node:fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { applyCommand, openSnapshot } from '../lib/match-rules.ts';

neonConfig.webSocketConstructor = ws;
const [matchId, ...captures] = process.argv.slice(2);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const match = (await pool.query('SELECT version, private_snapshot FROM match WHERE id = $1', [matchId])).rows[0];
  const commands = (await pool.query('SELECT seat, payload_private FROM match_command WHERE match_id = $1 ORDER BY accepted_version', [matchId])).rows;
  const seed = match.private_snapshot.seed;
  const states = new Map();
  let game = openSnapshot(seed).game;
  states.set(game.version, game);
  for (const row of commands) {
    game = applyCommand(game, Number(row.seat), row.payload_private);
    states.set(game.version, game);
  }
  console.log(`match ${matchId}: ${commands.length} commands, rebuilt final version ${game.version}, stored version ${match.version}`);
  if (game.version !== Number(match.version)) throw new Error('rebuild does not reach the stored version');

  let failures = 0;
  for (const capture of captures) {
    const [seatText, file] = capture.split(/:(.+)/);
    const seat = Number(seatText);
    const lines = readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
    let checked = 0;
    let hiddenChecked = 0;
    for (const line of lines) {
      const parsed = JSON.parse(line);
      const body = parsed.game ? parsed : parsed.view;
      if (!body?.game) continue;
      const truth = states.get(body.game.version);
      if (!truth) throw new Error(`no rebuilt state for version ${body.game.version}`);
      const text = JSON.stringify(body);
      const hidden = [...truth.players[1 - seat].hand, ...truth.deck].map((card) => card.uid);
      const leaked = hidden.filter((uid) => text.includes(`"${uid}"`));
      const keys = ['"seed"', '"rng"', '"deck"', '"eventDeck"', '"private_snapshot"', '"accepted"'].filter((key) => text.includes(key));
      const opponentHand = body.game.players[1 - seat].hand !== undefined;
      const ownHandMatches = JSON.stringify(body.game.players[seat].hand) === JSON.stringify(truth.players[seat].hand);
      if (leaked.length || keys.length || opponentHand || !ownHandMatches) {
        failures += 1;
        console.log(`FAIL seat ${seat} v${body.game.version}: leaked=${leaked.join(',')} keys=${keys.join(',')} opponentHand=${opponentHand} ownHandMatches=${ownHandMatches}`);
      }
      checked += 1;
      hiddenChecked += hidden.length;
    }
    console.log(`seat ${seat} (${file}): ${checked} full responses checked against ${hiddenChecked} hidden card uids; seed ${String(seed).length}-digit value absent: ${!lines.some((line) => line.includes(String(seed)))}`);
    if (lines.some((line) => line.includes(String(seed)))) failures += 1;
  }
  console.log(failures === 0 ? 'RESULT: pass, no hidden information in any captured response' : `RESULT: fail (${failures})`);
  process.exitCode = failures === 0 ? 0 : 1;
} catch (error) {
  console.error('leak check could not run:', error.message);
  process.exitCode = 1;
} finally {
  pool.end().catch(() => {});
}
