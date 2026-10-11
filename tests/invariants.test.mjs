import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,apply,project} from '../src/engine.mjs';
test('100 seeded pass-only games conserve all cards, finish, and preserve projection privacy',()=>{
 for(let seed=1;seed<=100;seed++){
  let s=newGame(seed),steps=0;
  while(!s.result){
   const all=[...s.deck,...s.discard,...s.board,...s.players.flatMap(p=>p.hand)];assert.equal(all.length,74);assert.equal(new Set(all.map(x=>x.uid)).size,74);assert.equal(s.eventDeck.length+s.eventDiscard.length,20);for(const p of s.players){assert.ok(p.energy>=0&&p.reserve>=0&&p.reserve<=3);}
   const q=s.choices[0];const seat=q?q.owner:s.active;const c={id:`i${steps++}`,version:s.version,type:q?'choose':'pass'};
   if(q?.kind==='discard')c.uids=s.players[seat].hand.slice(0,q.count).map(x=>x.uid);if(q?.options)c.region=q.options[0];if(q?.kind==='migration')c.skip=true;
   const input=JSON.stringify(s);const next=apply(s,seat,c);assert.equal(JSON.stringify(s),input);s=next;
   for(const viewer of [0,1,null]){const v=project(s,viewer);assert.equal(v.players.filter(p=>'hand'in p).length,viewer===null?0:1);assert.equal('rng'in v,false);}
   assert.ok(steps<200);
  }
  assert.deepEqual(s.players.map(p=>p.turns),[8,8]);assert.equal(s.result.reason,'score');
 }
});
