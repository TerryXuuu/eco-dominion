import http from 'node:http';
import {readFileSync} from 'node:fs';
import {newGame,apply,project} from '../src/engine.mjs';
let state=newGame(42);
// Loopback-only development harness. Seat selector is not account authentication.
const html=readFileSync(new URL('../web/harness.html',import.meta.url));
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const end=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
 if(req.method==='GET'&&url.pathname==='/state'){const seat=Number(url.searchParams.get('seat'));if(seat!==0&&seat!==1)return end(400,{error:'Invalid seat'});return end(200,project(state,seat));}
 if(req.method==='POST'&&url.pathname==='/command'){
  if(req.headers.origin&&!['http://127.0.0.1:8080','http://localhost:8080'].includes(req.headers.origin))return end(403,{error:'Origin denied'});
  let body='';for await(const chunk of req){body+=chunk;if(body.length>16000)return end(413,{error:'Too large'});}
  try{const {seat,command}=JSON.parse(body);state=apply(state,seat,command);return end(200,project(state,seat));}catch(e){return end(400,{error:e.message});}
 }
 end(404,{error:'Not found'});
}).listen(8080,'127.0.0.1',()=>console.log('Development tabletop harness http://127.0.0.1:8080; use two browser windows. No accounts or persistence.'));
