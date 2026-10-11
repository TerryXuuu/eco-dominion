"""Exercise loopback HTTP bench through two independent seat requests."""
from pathlib import Path
import json,subprocess,time,urllib.request,urllib.error
root=Path(__file__).resolve().parents[1]
process=subprocess.Popen(['node','tools/demo-server.mjs'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
def request(path,data=None,origin=None):
 headers={'Content-Type':'application/json'}
 if origin:headers['Origin']=origin
 req=urllib.request.Request('http://127.0.0.1:8080'+path,data=json.dumps(data).encode() if data else None,headers=headers)
 try:
  with urllib.request.urlopen(req,timeout=2) as r:return r.status,r.read()
 except urllib.error.HTTPError as e:return e.code,e.read()
try:
 for _ in range(100):
  try:code,body=request('/state?seat=0');break
  except urllib.error.URLError:
   if process.poll() is not None:raise RuntimeError(process.stderr.read())
   time.sleep(.03)
 else:raise RuntimeError('Harness did not start')
 a=json.loads(body);b=json.loads(request('/state?seat=1')[1]);assert 'hand' in a['players'][0] and 'hand' not in a['players'][1];assert 'hand' in b['players'][1] and 'hand' not in b['players'][0];assert 'rng' not in a and 'deck' not in a
 active=a['pending']['owner'] if a['pending'] else a['active'];c={'id':'http-test','version':a['version'],'type':'pass'}
 assert request('/command',{'seat':1-active,'command':c})[0]==400
 assert request('/command',{'seat':active,'command':c},'https://untrusted.example')[0]==403
 if not a['pending']:
  first=json.loads(request('/command',{'seat':active,'command':c})[1]);second=json.loads(request('/command',{'seat':active,'command':c})[1]);assert first==second;assert first['version']==a['version']+1
 assert request('/state?seat=unknown')[0]==400;assert b'Eco Dominion' in request('/')[1]
 print('HTTP harness smoke passed: both seat projections, turn rejection, origin rejection, duplicate command, invalid seat and HTML entry.')
finally:
 process.terminate();process.wait(timeout=5)
