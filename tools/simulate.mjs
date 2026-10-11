import {newGame,apply,CARDS,REGIONS,controller} from '../src/engine.mjs';
const catalog=Object.fromEntries(CARDS.map(x=>[x.id,x]));
let finished=0,draws=0,dominations=0;
for(let seed=1;seed<=200;seed++){
 let s=newGame(seed),steps=0;
 while(!s.result&&steps<2000){
  const choice=s.choices[0],p=choice?choice.owner:s.active;
  let c={id:`sim-${steps++}`,version:s.version,type:'pass'};
  if(choice){c.type='choose';if(choice.kind==='discard')c.uids=s.players[p].hand.slice(0,choice.count).map(x=>x.uid);if(choice.kind==='rest'||choice.kind==='invasion')c.region=choice.options[0];if(choice.kind==='migration')c.skip=true;}
  else {let accepted=false;
   for(const item of s.players[p].hand){const card=catalog[item.card];if((s.phase==='deploy')!==(card.kind==='species'))continue;
    for(const r of card.regions||REGIONS){for(const target of [undefined,...REGIONS]){const attempt={...c,type:'play',uid:item.uid,region:r,target};if(card.id==='migrate')attempt.species=s.board.find(x=>x.owner===p&&catalog[x.card].regions.includes(r)&&x.region!==r)?.uid;
     try{s=apply(s,p,attempt);accepted=true;break;}catch{} }
     if(accepted)break;
    }if(accepted)break;
   }if(accepted)continue;
  }
  s=apply(s,p,c);
 }
 if(!s.result)throw new Error(`Simulation did not finish ${seed}`);
 finished++;if(s.result.winner===null)draws++;if(s.result.reason==='domination')dominations++;
}
console.log(JSON.stringify({games:finished,draws,dominations,policy:'first legal card; target enumeration; event migration skipped',warning:'Termination smoke only. Not evidence of balance or optimal play.'},null,2));
