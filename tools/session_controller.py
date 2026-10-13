#!/usr/bin/env python3
"""One bounded unit at a time; explicit evidence and per-unit commit governance."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,shlex,shutil,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
M=ROOT/'orchestration/manifest.json';S=ROOT/'orchestration/state.json'
def execute(args,check=True):
 # Windows cannot spawn npm/npx (.cmd shims) by bare name without PATHEXT resolution.
 args=[shutil.which(args[0]) or args[0],*args[1:]]
 return subprocess.run(args,cwd=ROOT,text=True,capture_output=True,check=check,encoding='utf-8',errors='replace')
def git(*args):return execute(['git',*args]).stdout.strip()
def read(p):return json.loads(p.read_text())
def die(message):raise RuntimeError(message)
def stamp():return datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
def ledgers(m,s):
 lines=['# TASKS durable session ledger','','Architecture '+s['architecture_version']+' | Active '+str(s['active']),'','| Unit | Status | Acceptance | Implementation commit | Rollback checkpoint |','|---|---|---|---|---|']
 for e in m['sessions']:
  x=s['sessions'][e['id']];lines.append(f"| {e['id']} {e['title']} | {x['status']} | {e['acceptance']} | {x['implementation_commit'] or 'not accepted'} | {x['checkpoint'] or 'not checkpointed'} |")
 lines+=['','## Evidence changed files and blockers','']
 for e in m['sessions']:
  x=s['sessions'][e['id']];lines+=['### '+e['id'],f"Evidence: evidence/{e['id']}/. Changed files: {', '.join(x.get('changed_files',[])) or 'no accepted change recorded'}. Blocker: {x.get('blocker') or 'none recorded'}. Next action: {x.get('next_action') or 'await prerequisite'}. Tests: {x.get('test_receipt') or 'not accepted'}. Commit: {x.get('implementation_commit') or 'none'}." ]
 (ROOT/'TASKS.md').write_text('\n'.join(lines)+'\n')
 active=s['active'];x=s['sessions'].get(active,{})
 summary=f"# Current status\n\nActive session: {active or 'all accepted'}.\nStatus: {x.get('status','finished')}.\nBlocker: {x.get('blocker') or 'none recorded'}.\nNext action: {x.get('next_action') or 'review release evidence'}.\nRollback: {x.get('checkpoint') or 'create checkpoint before implementation'}.\n\nNo session is complete without its implementation hash, evidence and ledger transition commit. Failed evidence is retained.\n"
 (ROOT/'STATUS.md').write_text(summary)
 (ROOT/'SESSION_STATE.md').write_text(summary.replace('# Current status','# Resume checkpoint')+'\nOn resume inspect git status and log, TASKS, active prompt, global contract, decisions, co-build log and existing evidence. Preserve uncommitted files and continue this session only.\n')
 S.write_text(json.dumps(s,indent=2)+'\n')
def validate(m,s):
 h=hashlib.sha256((ROOT/'docs/ARCHITECTURE_FREEZE.md').read_bytes()).hexdigest()
 if h!=m['architecture_sha256'] or h!=s['architecture_sha256']:die('Architecture drift: regenerate affected artifacts under a recorded decision')
 ids=[e['id'] for e in m['sessions']]
 if ids!=list(s['sessions']):die('Manifest/state units disagree')
 active=[i for i in ids if s['sessions'][i]['status'] in ['active','blocked']]
 if active!=([s['active']] if s['active'] else []):die('Exactly one active or blocked unit required')
 for e in m['sessions']:
  if not (ROOT/e['prompt']).is_file():die('Missing prompt '+e['id'])
  if s['sessions'][e['id']]['status'] in ['active','blocked']:
   for p in e['requires']:
    if s['sessions'][p]['status']!='accepted':die('Prerequisite not accepted '+p)
  if s['sessions'][e['id']]['status']=='accepted' and not s['sessions'][e['id']]['implementation_commit']:die('Accepted unit lacks commit')
 text=(ROOT/'TASKS.md').read_text()
 if f"Active {s['active']}" not in text:die('TASKS active unit disagrees with state')
 for e in m['sessions']:
  if f"| {e['id']} {e['title']} | {s['sessions'][e['id']]['status']} |" not in text:die('TASKS status drift '+e['id'])
 return True
def active_entry(m,s):
 if not s['active']:die('All sessions accepted')
 return next(e for e in m['sessions'] if e['id']==s['active'])
def checks(e):
 folder=ROOT/'evidence'/e['id'];folder.mkdir(exist_ok=True,parents=True);runs=[]
 for command in [['node','--test','tests/engine.test.mjs','tests/invariants.test.mjs'],e['test']]+e.get('checks',[]):
  result=execute(command,False);log=folder/(stamp()+'.log');log.write_text('$ '+' '.join(command)+'\n'+result.stdout+result.stderr)
  runs.append({'command':command,'exit_code':result.returncode,'log':str(log.relative_to(ROOT))})
 receipt=folder/(stamp()+'.checks.json');receipt.write_text(json.dumps({'session':e['id'],'runs':runs},indent=2)+'\n')
 if any(x['exit_code'] for x in runs):die('Required checks failed; logs preserved in '+str(folder.relative_to(ROOT)))
 return str(receipt.relative_to(ROOT))
def acceptance(e,m):
 p=ROOT/'evidence'/e['id']/'acceptance.json'
 if not p.exists():die('Observed acceptance.json required')
 a=read(p)
 if a.get('session')!=e['id'] or a.get('architecture_version')!=m['architecture_version']:die('Evidence session/architecture mismatch')
 if a.get('blockers')!=[]:die('Acceptance evidence contains blockers or lacks blockers list')
 for field in ['summary','changed_files','automated_checks','manual_checks']:
  if not a.get(field):die('Missing acceptance field '+field)
 for field in ['automated_checks','manual_checks']:
  for check in a[field]:
   evidence=(ROOT/check.get('evidence','')).resolve()
   if check.get('status')!='pass' or ROOT not in evidence.parents or not evidence.is_file():die('Unobserved/unsafe evidence '+field)
 if e['id']=='S01' and not (ROOT/'decisions/OWNER_RULES_APPROVAL.md').is_file():die('Real owner rule approval missing')
 return a
def main():
 parser=argparse.ArgumentParser();parser.add_argument('action',choices=['init','validate','active','checkpoint','check','run','accept','block','resume','render-ledgers']);parser.add_argument('message',nargs='?');parser.add_argument('--print-prompt',action='store_true');args=parser.parse_args();m=read(M);s=read(S)
 if args.action=='render-ledgers':ledgers(m,s);return
 validate(m,s)
 if args.action=='validate':print('Architecture, manifest, state, prompts and TASKS agree.');return
 if args.action=='init':
  if (ROOT/'.git').exists():die('Git already initialized; inspect existing repository')
  execute(['git','init']);execute(['git','config','user.name','Eco Dominion Starter']);execute(['git','config','user.email','starter@localhost']);execute(['git','add','.']);execute(['git','commit','-m','Baseline: prepared Eco Dominion starter']);print('Baseline '+git('rev-parse','HEAD')+'; set your Git name/email before session commits.');return
 e=active_entry(m,s);x=s['sessions'][e['id']]
 if args.action=='active':print((ROOT/e['prompt']).read_text() if args.print_prompt else e['id']+' '+e['title']+'\n'+str(ROOT/e['prompt']));return
 if args.action=='checkpoint':
  if x['status']=='blocked':die('Resume blocked unit before checkpoint')
  if x['checkpoint']:die('Checkpoint already exists; resume unit rather than overwrite rollback')
  if git('status','--porcelain'):die('Clean committed tree required before checkpoint')
  x['checkpoint']=git('rev-parse','HEAD');x['next_action']='Implement '+e['id']+' prompt; commit checkpoint metadata with implementation.';ledgers(m,s);print('Rollback checkpoint '+x['checkpoint']);return
 if args.action in ['check','run']:
  if x['status']=='blocked':die('Blocked: '+str(x['blocker']))
  if not x['checkpoint']:die('Checkpoint required')
  if args.action=='run':
   agent=os.environ.get('ECO_AI_COMMAND');
   if not agent:die('ECO_AI_COMMAND must identify an installed CLI that reads prompt stdin')
   result=subprocess.run(shlex.split(agent),cwd=ROOT,input=(ROOT/e['prompt']).read_text(),text=True)
   if result.returncode:die('Agent failed; preserve work and block or resume')
  print('Passed receipt '+checks(e));return
 if args.action=='block':
  if not args.message:die('Block reason and exact next action required')
  x['status']='blocked';x['blocker']=args.message;x['next_action']=args.message;ledgers(m,s);print('Blocked; preserve uncommitted work and record pause checkpoint.');return
 if args.action=='resume':
  if x['status']=='blocked':x['status']='active';x['blocker']=None;ledgers(m,s)
  print(e['id']+' continues; inspect Git and existing evidence. Next: '+str(x['next_action']));return
 if args.action=='accept':
  if x['status']=='blocked' or not x['checkpoint']:die('Active checkpointed session required')
  if git('status','--porcelain'):die('Commit implementation and evidence before acceptance')
  head=git('rev-parse','HEAD')
  if head==x['checkpoint']:die('No implementation commit since checkpoint')
  if execute(['git','merge-base','--is-ancestor',x['checkpoint'],head],False).returncode:die('Rollback checkpoint is not ancestor')
  if not git('log','-1','--format=%s').startswith(e['id']+':'):die('Implementation commit subject must start '+e['id']+':')
  a=acceptance(e,m);receipt=checks(e);x.update(status='accepted',implementation_commit=head,test_receipt=receipt,changed_files=a['changed_files'],next_action='Accepted; review evidence before next session.')
  index=m['sessions'].index(e);s['active']=m['sessions'][index+1]['id'] if index+1<len(m['sessions']) else None
  if s['active']:s['sessions'][s['active']].update(status='active',next_action='Read active prompt and create pre-session checkpoint.')
  ledgers(m,s);execute(['git','add','TASKS.md','STATUS.md','SESSION_STATE.md','orchestration/state.json','evidence/'+e['id']]);execute(['git','commit','-m',e['id']+': record accepted implementation '+head]);print('Accepted '+e['id']+' implementation '+head+'; audit '+git('rev-parse','HEAD')+'; next '+str(s['active'])+'; STOP.');return
if __name__=='__main__':
 try:main()
 except (RuntimeError,subprocess.CalledProcessError,ValueError,OSError) as error:print('BLOCKED: '+str(error),file=sys.stderr);sys.exit(1)
