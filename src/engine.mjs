import { readFileSync } from 'node:fs';
export const CARDS = JSON.parse(readFileSync(new URL('../data/cards.json', import.meta.url)));
const C = Object.fromEntries(CARDS.map(c => [c.id, c]));
export const REGIONS = ['forest','water','wild','domain'];
const assert = (v, message) => { if (!v) throw new Error(message); };
const other = p => 1-p;
function random(s) { s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0; return s.rng/4294967296; }
function shuffle(s, a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
const reserve=(s,p,n)=>s.players[p].reserve=Math.min(3,Math.max(0,s.players[p].reserve+n));
function draw(s,p,n){for(let i=0;i<n;i++){if(!s.deck.length)s.deck=shuffle(s,s.discard.splice(0));if(!s.deck.length)break;s.players[p].hand.push(s.deck.pop());}}
const here=(s,r,p)=>s.board.filter(x=>x.region===r&&x.owner===p);
const has=(xs,id)=>xs.some(x=>x.card===id);
const blocked=(s,r,p)=>s.regions[r].broken.includes(p);
export function stability(s,r){
 const xs=s.board.filter(x=>x.region===r);let n=s.regions[r].base+xs.filter(x=>x.card==='deer').length*2;
 // Non-recursive threshold: lizard synergy is enabled by base plus deer alone.
 if(n>0)for(let p=0;p<2;p++){const a=here(s,r,p);if(!blocked(s,r,p)&&has(a,'fox'))n+=a.filter(x=>x.card==='lizard').length*3;}
 return n;
}
function synergy(s,r,p){if(stability(s,r)<=0||blocked(s,r,p))return false;const a=here(s,r,p);return [['mouse','deer'],['beetle','ray'],['fox','lizard'],['heron','beaver'],['snake','ray'],['panther','bison']].some(pair=>pair.every(x=>has(a,x)));}
export function power(s,r,p,temporary=true){
 const a=here(s,r,p);const enabled=stability(s,r)>0;let total=0;
 for(const x of a){let n=C[x.card].power;
  if(enabled){
   for(const aura of a){if(aura.card==='falcon')n+=2;if(aura.card==='guardian')n+=3;if(aura.card==='oak'&&C[x.card].regions.includes('forest'))n+=2;if(aura.card==='algae'&&stability(s,r)>=10)n+=4;}
   if(x.card==='bison')n+=2*a.filter(y=>y.uid!==x.uid&&C[y.card].regions.includes('wild')).length;
   if(!blocked(s,r,p)){
    if(x.card==='mouse'&&has(a,'deer'))n+=2;
    if(x.card==='deer'&&has(a,'mouse'))n+=4;
    if(x.card==='beetle'&&has(a,'ray'))n+=2;
    if(x.card==='fox'&&has(a,'lizard'))n+=3;
    if(x.card==='heron'&&has(a,'beaver'))n+=3;
    if(x.card==='ray'&&has(a,'snake'))n+=5;
    if(x.card==='panther'&&has(a,'bison'))n+=4;
   }
  }
  if(temporary)for(const m of s.modifiers){if(m.kind==='unit'&&m.uids.includes(x.uid))n+=m.amount;if(m.kind==='heat'&&C[x.card].cost<=3)n-=3;}
  total+=Math.max(0,n);
 }
 if(temporary)for(const m of s.modifiers)if(m.kind==='aggregate'&&m.region===r&&m.owner===p)total+=m.amount;
 return Math.max(0,total-s.regions[r].penalty[p]);
}
export function controller(s,r,temporary=true){const a=power(s,r,0,temporary),b=power(s,r,1,temporary);return a===b?null:a>b?0:1;}
function region(s,r){assert(REGIONS.includes(r),'Invalid region');return s.regions[r];}
function mark(s,r,p,amount,interference=false){let a=here(s,r,p);
 if(interference)a=a.filter(x=>{if(x.card==='snake'&&synergy(s,r,p)&&has(here(s,r,p),'ray')&&!s.immunityUsed.includes(x.uid)){s.immunityUsed.push(x.uid);return false;}return true;});
 s.modifiers.push({kind:'unit',uids:a.map(x=>x.uid),amount});
}
function move(s,p,uid,r){region(s,r);const x=s.board.find(x=>x.uid===uid);assert(x&&x.owner===p,'Not your species');assert(x.region!==r&&C[x.card].regions.includes(r),'Illegal migration');x.region=r;}
function event(s,id){s.event=id;const p=s.active,q=other(p);
 switch(id){
  case 'heat':s.modifiers.push({kind:'heat'});break;
  case 'monsoon':for(const r of REGIONS)s.regions[r].base+=r==='water'?7:-3;break;
  case 'quake':for(const r of REGIONS)s.regions[r].base-=3;break;
  case 'revival':reserve(s,0,1);reserve(s,1,1);break;
  case 'drought':s.regions.water.base-=5;break;
  case 'storm':draw(s,p,1);draw(s,q,1);break;
  case 'balance':for(const r of REGIONS)if(stability(s,r)<=0)s.regions[r].base-=stability(s,r);break;
  case 'rest':for(const owner of [p,q]){const options=REGIONS.filter(r=>controller(s,r)===owner);if(options.length)s.choices.push({kind:'rest',owner,options});}break;
  case 'migration':for(const owner of [p,q])if(s.board.some(x=>x.owner===owner&&C[x.card].regions.length>1))s.choices.push({kind:'migration',owner});break;
  case 'invasion':s.choices.push({kind:'invasion',owner:p,options:REGIONS});break;
  default:throw new Error('Unknown event');
 }
 s.eventDiscard.push(id);
}
function overflow(s){for(const owner of [s.active,other(s.active)]){const n=s.players[owner].hand.length-7;if(n>0&&!s.choices.some(c=>c.kind==='discard'&&c.owner===owner))s.choices.unshift({kind:'discard',owner,count:n});}}
function start(s){
 s.phase='refresh';s.modifiers=[];s.immunityUsed=[];s.choices=[];for(const r of REGIONS)s.regions[r].broken=[];
 const p=s.active,ps=s.players[p];ps.turns++;ps.max=Math.min(10,ps.turns+2);ps.energy=ps.max;
 if(s.regions.water.lastController===p&&!s.regions.water.denied.includes(p))reserve(s,p,here(s,'water',p).filter(x=>x.card==='beaver').length);
 s.phase='draw';if(!(p===s.first&&ps.turns===1))draw(s,p,2);
 overflow(s);s.afterChoices='event';if(!s.choices.length)advance(s);
}
function advance(s){if(s.choices.length)return;if(s.afterChoices==='event'){
 s.phase='event';if(!s.eventDeck.length)s.eventDeck=shuffle(s,s.eventDiscard.splice(0));event(s,s.eventDeck.pop());s.afterChoices='deploy';overflow(s);
 }if(!s.choices.length){s.phase='deploy';s.afterChoices=null;}}
export function newGame(seed=1){
 assert(Number.isInteger(seed),'Integer seed required');const s={rules:'digital-1.0-draft',version:0,rng:seed>>>0,first:0,active:0,phase:'refresh',players:[0,1].map(()=>({hand:[],turns:0,max:0,energy:0,reserve:0})),regions:Object.fromEntries(REGIONS.map(r=>[r,{base:0,penalty:[0,0],broken:[],denied:[],lastController:null}])),board:[],modifiers:[],choices:[],immunityUsed:[],discard:[],eventDiscard:[],deck:[],eventDeck:[],event:null,afterChoices:null,result:null,nextUid:0,accepted:[]};
 s.first=Math.floor(random(s)*2);s.active=s.first;
 for(const c of CARDS)for(let i=0;i<c.copies;i++)(c.kind==='event'?s.eventDeck:s.deck).push(c.kind==='event'?c.id:{uid:`c${s.nextUid++}`,card:c.id});
 shuffle(s,s.deck);shuffle(s,s.eventDeck);draw(s,s.first,5);draw(s,other(s.first),5);start(s);return s;
}
function pay(s,p,cost,species){const ps=s.players[p];assert(ps.energy+(species?0:ps.reserve)>=cost,'Insufficient energy');const fromReserve=species?0:Math.min(ps.reserve,cost);ps.reserve-=fromReserve;ps.energy-=cost-fromReserve;}
function play(s,p,cmd){const ps=s.players[p],i=ps.hand.findIndex(x=>x.uid===cmd.uid);assert(i>=0,'Card not in your hand');const item=ps.hand[i],c=C[item.card],q=other(p),r=cmd.region;
 assert(c.kind==='species'?s.phase==='deploy':s.phase==='tactics','Wrong phase');
 if(c.kind==='species'){
  region(s,r);assert(c.regions.includes(r),'Illegal region');if(c.id==='guardian')assert(!s.board.some(x=>x.owner===p&&x.card==='guardian'),'Guardian limit');
  if(c.id==='bison'){const options=REGIONS.filter(r=>controller(s,r)===q);if(options.length)assert(options.includes(cmd.target),'Choose enemy controlled target');else assert(cmd.target===undefined,'No enemy controlled target exists');}
  if(c.id==='algae')region(s,cmd.target);
  pay(s,p,c.cost,true);ps.hand.splice(i,1);s.board.push({...item,owner:p,region:r});
  if(['mouse','falcon'].includes(c.id))reserve(s,p,c.id==='mouse'?1:2);
  if(['fox','lizard','heron','ray','guardian'].includes(c.id))draw(s,p,c.id==='guardian'?2:1);
  if(['beetle','beaver','snake','oak'].includes(c.id))s.regions[r].base+=({beetle:1,beaver:3,snake:4,oak:6})[c.id];
  if(c.id==='bison'&&cmd.target)s.regions[cmd.target].base-=2;
  if(c.id==='panther')mark(s,r,q,-3);
  if(c.id==='algae')s.regions[cmd.target].base+=6;
 }else{
  if(['fortify','bloom','infuse','erode','break','veil','destroy','migrate'].includes(c.id))region(s,r);
  if(['fortify','infuse'].includes(c.id))assert(controller(s,r)===p,'Requires own control');
  if(c.id==='erode')assert(controller(s,r)===q,'Requires enemy control');
  if(c.id==='veil')assert(here(s,r,q).length,'Requires enemy occupation');
  if(c.id==='break')assert(synergy(s,r,q),'Requires active enemy synergy');
  pay(s,p,c.cost,false);ps.hand.splice(i,1);s.discard.push(item);
  switch(c.id){
   case 'fortify':s.regions[r].base+=5;break;
   case 'bloom':mark(s,r,p,4);break;
   case 'infuse':s.regions[r].base+=2;mark(s,r,p,3);break;
   case 'charge':reserve(s,p,2);break;
   case 'reinforce':draw(s,p,2);break;
   case 'migrate':move(s,p,cmd.species,r);draw(s,p,1);break;
   case 'erode':s.regions[r].base-=6;break;
   case 'break':s.regions[r].broken.push(q);break;
   case 'veil':mark(s,r,q,-5,true);break;
   case 'destroy':s.regions[r].base-=4;if(!s.regions[r].denied.includes(q))s.regions[r].denied.push(q);break;
   case 'steal':if(s.players[q].reserve>0)reserve(s,q,-2);else if(s.players[q].hand.length){const j=Math.floor(random(s)*s.players[q].hand.length);s.discard.push(s.players[q].hand.splice(j,1)[0]);}break;
   default:throw new Error('Unsupported action');
  }
 }
 overflow(s);
}
function settlement(s){
 const p=s.active;const owners=Object.fromEntries(REGIONS.map(r=>[r,controller(s,r)]));
 for(const r of REGIONS){const z=s.regions[r],owner=owners[r];z.lastController=owner;
  if(owner===p&&!z.denied.includes(p))reserve(s,p,1);
  if(owner!==null&&stability(s,r)<=0)z.penalty[owner]+=Math.floor(power(s,r,owner)/4);
  z.denied=z.denied.filter(x=>x!==p);
 }
 const post=REGIONS.filter(r=>controller(s,r)===p&&stability(s,r)>=12);
 if(post.length>=3){s.result={winner:p,reason:'domination'};s.phase='finished';return;}
 s.players[p].energy=0;
 if(s.players.every(x=>x.turns>=8)){
  s.modifiers=[];s.immunityUsed=[];for(const r of REGIONS)s.regions[r].broken=[];
  const scores=[0,0];for(const r of REGIONS){const owner=controller(s,r,false);if(owner!==null)scores[owner]+=power(s,r,owner,false);}
  s.result={winner:scores[0]===scores[1]?null:scores[0]>scores[1]?0:1,reason:'score',scores};s.phase='finished';return;
 }
 s.active=other(p);start(s);
}
export function apply(state,seat,cmd){
 assert(seat===0||seat===1,'Seat required');assert(cmd&&typeof cmd.id==='string'&&cmd.id.length>0&&cmd.id.length<=100,'Command ID required');
 // Transport must return cached historical receipt; engine duplicate is a no-op.
 if(state.accepted.some(x=>x.id===cmd.id&&x.seat===seat))return structuredClone(state);
 assert(cmd.version===state.version,'Stale version');assert(!state.result,'Game finished');const s=structuredClone(state);
 if(s.choices.length){
  const choice=s.choices[0];assert(choice.owner===seat&&cmd.type==='choose','Pending choice must be resolved');
  if(choice.kind==='discard'){assert(Array.isArray(cmd.uids)&&cmd.uids.length===choice.count&&new Set(cmd.uids).size===choice.count,'Exact discard count required');const ps=s.players[seat];assert(cmd.uids.every(uid=>ps.hand.some(x=>x.uid===uid)),'Invalid discard');for(const uid of cmd.uids)s.discard.push(ps.hand.splice(ps.hand.findIndex(x=>x.uid===uid),1)[0]);}
  if(choice.kind==='rest'){assert(choice.options.includes(cmd.region),'Invalid rest target');s.regions[cmd.region].base+=2;}
  if(choice.kind==='migration'&&!cmd.skip)move(s,seat,cmd.species,cmd.region);
  if(choice.kind==='invasion'){region(s,cmd.region);const a=here(s,cmd.region,0).length,b=here(s,cmd.region,1).length;if(a!==b)s.modifiers.push({kind:'aggregate',region:cmd.region,owner:a>b?0:1,amount:4});}
  s.choices.shift();if(!s.choices.length&&s.afterChoices)advance(s);
 }else{
  assert(seat===s.active,'Not your turn');
  if(cmd.type==='play')play(s,seat,cmd);
  else if(cmd.type==='pass'){if(s.phase==='deploy')s.phase='tactics';else if(s.phase==='tactics'){s.phase='settle';settlement(s);}else throw new Error('Cannot pass now');}
  else if(cmd.type==='concede'){s.result={winner:other(seat),reason:'concession'};s.phase='finished';}
  else throw new Error('Unknown command');
 }
 s.version++;s.accepted.push({id:cmd.id,seat,version:s.version});return s;
}
export function project(s,seat=null){
 assert(seat===null||seat===0||seat===1,'Invalid projection');return {
  rules:s.rules,version:s.version,active:s.active,first:s.first,phase:s.phase,event:s.event,result:s.result,
  players:s.players.map((p,i)=>({turns:p.turns,max:p.max,energy:p.energy,reserve:p.reserve,handCount:p.hand.length,...(i===seat?{hand:p.hand}: {})})),
  board:s.board,regions:Object.fromEntries(REGIONS.map(r=>[r,{stability:stability(s,r),power:[power(s,r,0),power(s,r,1)],controller:controller(s,r),penalty:s.regions[r].penalty}])),
  deckCount:s.deck.length,eventDeckCount:s.eventDeck.length,
  discard:s.discard,eventDiscard:s.eventDiscard,
  pending:s.choices.length?{owner:s.choices[0].owner,kind:s.choices[0].kind,...(s.choices[0].owner===seat?s.choices[0]:{})}:null
 };
}
