#!/usr/bin/env python3
"""Automatic bounded-session orchestration. Never implements acceptance evidence."""
from pathlib import Path
import argparse,contextlib,datetime,json,os,shutil,subprocess,sys,time
import session_controller as ctl
ROOT=ctl.ROOT;LOCAL=ROOT/'.local';CLOCK=ROOT/'orchestration/clock.json'
def now():return time.time()
def clock():return json.loads(CLOCK.read_text()) if CLOCK.exists() else {}
def saveclock(c):CLOCK.write_text(json.dumps(c,indent=2)+'\n')
def model():
 m=ctl.read(ctl.M);s=ctl.read(ctl.S);ctl.validate(m,s);return m,s
@contextlib.contextmanager
def lock():
 LOCAL.mkdir(exist_ok=True);p=LOCAL/'automatic.lock'
 try:fd=os.open(p,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
 except FileExistsError:raise RuntimeError('Another automation operation holds .local/automatic.lock; do not run a second agent. If the prior process died, verify it is stopped before removing this ignored lock.')
 try:
  os.write(fd,str(os.getpid()).encode());os.close(fd);yield
 finally:p.unlink(missing_ok=True)
def command(*args):
 r=subprocess.run([sys.executable,str(ROOT/'tools/session_controller.py'),*args],cwd=ROOT,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr.strip() or r.stdout.strip())
 return r.stdout

def pause(reason):
 m,s=model()
 if not s['active']:return
 sid=s['active'];folder=ROOT/'evidence'/sid;folder.mkdir(exist_ok=True,parents=True)
 git=ctl.execute(['git','status','--porcelain'],False)
 (folder/(ctl.stamp()+'.pause.json')).write_text(json.dumps({'reason_and_next_action':reason,'session':sid,'checkpoint':s['sessions'][sid]['checkpoint'],'git_changes':git.stdout,'time':now()},indent=2)+'\n')
 c=clock()
 if sid in c and 'paused_at' not in c[sid]:c[sid]['paused_at']=now();saveclock(c)
 command('block',reason)

def deadline(sid,hours):
 c=clock()
 if sid not in c:c[sid]={'started':now(),'deadline':now()+hours*3600,'planned_hours':hours,'extensions':[]};saveclock(c)
 if now()>=c[sid]['deadline']:raise RuntimeError('Four-hour block budget exhausted; work preserved. Record overrun and use resume --extend-hours only when explicitly requested.')
 return c[sid]['deadline']

def prepare():
 m,s=model()
 if not s['active']:return {'status':'complete','next':None}
 e=ctl.active_entry(m,s);sid=e['id'];x=s['sessions'][sid]
 if x['status']=='blocked':raise RuntimeError('Blocked: '+str(x['blocker'])+'; resolve and resume explicitly.')
 if not (ROOT/'.git').exists():
  # Never initialize into an enclosing user repository.
  enclosing=ctl.execute(['git','rev-parse','--show-toplevel'],False)
  if enclosing.returncode==0:raise RuntimeError('eco-dominion is inside another Git repository; use a separate checkout and preserve its history.')
  command('init')
 if not x['checkpoint']:
  if ctl.git('status','--porcelain'):raise RuntimeError('Uncommitted pre-session work detected; preserve and attribute it before the new checkpoint.')
  command('checkpoint')
 end=deadline(sid,e['hours'])
 prompt='AUTOMATIC ACTIVE SESSION '+sid+'\nArchitecture '+m['architecture_version']+'\nDeadline UTC '+datetime.datetime.fromtimestamp(end,datetime.timezone.utc).isoformat()+'\nRead AGENTS.md, TASKS.md, SESSION_STATE.md, decisions and prior evidence.\n\n'+(ROOT/e['prompt']).read_text()
 return {'status':'active','session':sid,'deadline':end,'prompt':prompt}

def safechanges():
 names=ctl.git('ls-files','--cached','--others','--exclude-standard').splitlines()
 for n in names:
  p=Path(n)
  if ((p.name.startswith('.env') and p.name!='.env.example') or p.suffix in ['.pem','.key','.p12'] or p.name in ['credentials.json','secrets.json']):raise RuntimeError('Secret-like file must not enter automatic commit: '+n)

def finish():
 m,s=model()
 if not s['active']:return {'status':'complete','next':None}
 e=ctl.active_entry(m,s);sid=e['id'];x=s['sessions'][sid]
 if x['status']!='active' or not x['checkpoint']:raise RuntimeError('Active checkpointed block required')
 deadline(sid,e['hours'])
 # Validate evidence and rerun tests before staging anything.
 ctl.acceptance(e,m);ctl.checks(e);deadline(sid,e['hours']);safechanges()
 changes=ctl.git('status','--porcelain')
 if changes:
  ctl.execute(['git','add','-A']);ctl.execute(['git','commit','-m',sid+': automatic implementation and observed evidence'])
 else:raise RuntimeError('No new implementation/evidence to commit; cannot automatically accept')
 receipt=command('accept');m,s=model()
 return {'status':'accepted','session':sid,'next':s['active'],'receipt':receipt}

def resume(extension=0):
 m,s=model()
 if not s['active']:return
 if extension<0:raise RuntimeError('Extension must be positive')
 c=clock();sid=s['active']
 if sid in c and 'paused_at' in c[sid]:
  c[sid]['deadline']+=now()-c[sid].pop('paused_at');saveclock(c)
 if extension:
  e=ctl.active_entry(m,s)
  if sid not in c:raise RuntimeError('No started clock to extend')
  c[sid]['extensions'].append({'at':now(),'hours':extension,'reason':'explicit overrun extension'});c[sid]['deadline']=max(now(),c[sid]['deadline'])+extension*3600;saveclock(c)
 command('resume')

def terminate(p):
 # Kill the worker and its child commands on interruption/timeout.
 if os.name=='nt':subprocess.run(['taskkill','/PID',str(p.pid),'/T','/F'],capture_output=True)
 else:
  import signal
  try:os.killpg(p.pid,signal.SIGTERM)
  except ProcessLookupError:pass
 try:p.wait(timeout=5)
 except subprocess.TimeoutExpired:
  if os.name!='nt':
   import signal
   try:os.killpg(p.pid,signal.SIGKILL)
   except ProcessLookupError:pass
  p.wait()

def run(agent=None):
 if agent is None:
  binary=shutil.which('agent') or shutil.which('cursor-agent')
  if not binary:raise RuntimeError('Authenticated Cursor CLI not found. Use /Eco Dominion in Cursor IDE, or prepare CLI access outside the course budget.')
  agent=[binary,'-p','--force','--output-format','text']
 for _ in range(len(model()[0]['sessions'])):
  packet=prepare()
  if packet['status']=='complete':return {'status':'complete'}
  sid=packet['session'];folder=ROOT/'evidence'/sid;folder.mkdir(exist_ok=True,parents=True)
  log=folder/(ctl.stamp()+'.agent.log');env=os.environ.copy();env['ECO_AUTOMATION_WORKER']='1'
  with log.open('w') as out:
   p=subprocess.Popen(agent+[packet['prompt']],cwd=ROOT,env=env,stdout=out,stderr=subprocess.STDOUT,start_new_session=os.name!='nt')
   try:code=p.wait(timeout=max(.01,packet['deadline']-now()))
   except (subprocess.TimeoutExpired,KeyboardInterrupt):terminate(p);raise RuntimeError('Worker interrupted or time budget exhausted; see '+str(log.relative_to(ROOT)))
  if code:raise RuntimeError('Agent exited '+str(code)+'; observed log '+str(log.relative_to(ROOT)))
  result=finish();print(json.dumps({k:v for k,v in result.items() if k!='receipt'}),flush=True)
  # This worker ended at its commit boundary; prepare the next bounded worker.
 return {'status':'complete' if model()[1]['active'] is None else 'stopped'}

def main():
 p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','finish','run','pause','resume','status']);p.add_argument('reason',nargs='?');p.add_argument('--extend-hours',type=float,default=0);a=p.parse_args()
 try:
  with lock():
   if a.action=='prepare':result=prepare()
   elif a.action=='finish':result=finish()
   elif a.action=='run':result=run()
   elif a.action=='pause':pause(a.reason or 'User paused; inspect saved changes before resuming.');result={'status':'blocked'}
   elif a.action=='resume':resume(a.extend_hours);result={'status':'resumed'}
   else:
    m,s=model();result={'architecture':m['architecture_version'],'active':s['active'],'sessions':s['sessions'],'clock':clock()}
  print(json.dumps(result,indent=2))
 except (RuntimeError,OSError,ValueError,subprocess.CalledProcessError) as e:
  # Do not mutate state after losing the operation lock.
  if 'holds .local/automatic.lock' not in str(e):
   try:
    with lock():pause(str(e)+'; inspect existing evidence and resolve before resume.')
   except Exception:pass
  print('BLOCKED: '+str(e),file=sys.stderr);return 1
 return 0
if __name__=='__main__':sys.exit(main())
