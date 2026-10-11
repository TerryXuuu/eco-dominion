import unittest,tempfile,shutil,subprocess,json,sys,time
from pathlib import Path
SOURCE=Path(__file__).resolve().parents[1]
class Automatic(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)/'repo';shutil.copytree(SOURCE,self.root,ignore=shutil.ignore_patterns('.git','__pycache__','.local'))
  mp=self.root/'orchestration/manifest.json';sp=self.root/'orchestration/state.json';m=json.loads(mp.read_text());s=json.loads(sp.read_text());m['sessions']=m['sessions'][:2]
  for i,e in enumerate(m['sessions']):e.update(id=f'T{i+1:02d}',requires=[] if i==0 else ['T01'],checks=[],test=['node','--test','tests/engine.test.mjs'])
  s['active']='T01';s['sessions']={e['id']:{'status':'active' if i==0 else 'pending','implementation_commit':None,'checkpoint':None,'blocker':None,'next_action':'test'} for i,e in enumerate(m['sessions'])};mp.write_text(json.dumps(m));sp.write_text(json.dumps(s));self.call('session_controller','render-ledgers')
 def tearDown(self):self.tmp.cleanup()
 def call(self,tool,*args):return subprocess.run([sys.executable,str(self.root/f'tools/{tool}.py'),*args],cwd=self.root,text=True,capture_output=True)
 def auto(self,*args):return self.call('auto_run',*args)
 def state(self):return json.loads((self.root/'orchestration/state.json').read_text())
 def evidence(self,sid):
  p=self.root/'evidence'/sid;p.mkdir(exist_ok=True,parents=True);(p/'observed.txt').write_text('Isolated synthetic fixture, not game acceptance');(p/'acceptance.json').write_text(json.dumps({'session':sid,'architecture_version':'2.3','summary':'Synthetic controller fixture','changed_files':[f'evidence/{sid}/observed.txt'],'automated_checks':[{'status':'pass','evidence':f'evidence/{sid}/observed.txt'}],'manual_checks':[{'status':'pass','evidence':f'evidence/{sid}/observed.txt'}],'blockers':[]}))
 def test_prepare_discovers_prompt_and_initializes_checkpoint(self):
  a=self.auto('prepare');self.assertEqual(a.returncode,0,a.stderr);o=json.loads(a.stdout);self.assertEqual(o['session'],'T01');self.assertIn('Objective',o['prompt']);self.assertTrue(self.state()['sessions']['T01']['checkpoint'])
 def test_success_has_separate_commits_and_next_prompt(self):
  self.auto('prepare');self.evidence('T01');a=self.auto('finish');self.assertEqual(a.returncode,0,a.stderr);s=self.state();self.assertEqual(s['active'],'T02');self.assertTrue(s['sessions']['T01']['implementation_commit']);log=subprocess.check_output(['git','log','--format=%s','-2'],cwd=self.root,text=True);self.assertIn('automatic implementation',log);self.assertIn('record accepted',log);self.assertEqual(self.auto('prepare').returncode,0)
 def test_missing_evidence_blocks_preserving_work(self):
  self.auto('prepare');(self.root/'work.txt').write_text('preserve');self.assertNotEqual(self.auto('finish').returncode,0);self.assertEqual(self.state()['sessions']['T01']['status'],'blocked');self.assertEqual((self.root/'work.txt').read_text(),'preserve');self.assertFalse(self.state()['sessions']['T01']['implementation_commit'])
 def test_failed_test_never_advances(self):
  p=self.root/'orchestration/manifest.json';m=json.loads(p.read_text());m['sessions'][0]['test']=['node','--test','tests/not-created.test.mjs'];p.write_text(json.dumps(m));self.auto('prepare');self.evidence('T01');self.assertNotEqual(self.auto('finish').returncode,0);self.assertEqual(self.state()['active'],'T01');self.assertFalse(self.state()['sessions']['T01']['implementation_commit']);self.assertTrue(list((self.root/'evidence/T01').glob('*.log')))
 def test_dirty_preexisting_files_never_reset(self):
  self.call('session_controller','init');(self.root/'user.txt').write_text('existing');self.assertNotEqual(self.auto('prepare').returncode,0);self.assertEqual((self.root/'user.txt').read_text(),'existing');self.assertFalse(self.state()['sessions']['T01']['checkpoint'])
 def test_resume_preserves_clock_and_checkpoint(self):
  self.auto('prepare');before=self.state()['sessions']['T01']['checkpoint'];c=(self.root/'orchestration/clock.json').read_text();(self.root/'draft.txt').write_text('draft');self.assertEqual(self.auto('pause','Await owner decision').returncode,0);self.assertEqual(self.auto('resume').returncode,0);self.assertEqual(self.state()['sessions']['T01']['checkpoint'],before);after=json.loads((self.root/'orchestration/clock.json').read_text());self.assertEqual(after['T01']['started'],json.loads(c)['T01']['started']);self.assertGreaterEqual(after['T01']['deadline'],json.loads(c)['T01']['deadline']);self.assertTrue((self.root/'draft.txt').exists())
 def test_budget_requires_explicit_recorded_extension(self):
  self.auto('prepare');p=self.root/'orchestration/clock.json';c=json.loads(p.read_text());c['T01']['deadline']=time.time()-1;p.write_text(json.dumps(c));self.assertNotEqual(self.auto('prepare').returncode,0);self.assertEqual(self.auto('resume','--extend-hours','1').returncode,0);self.assertEqual(len(json.loads(p.read_text())['T01']['extensions']),1);self.assertEqual(self.auto('prepare').returncode,0)
 def test_exclusive_lock_prevents_second_writer(self):
  (self.root/'.local').mkdir();(self.root/'.local/automatic.lock').write_text('fixture');self.assertNotEqual(self.auto('prepare').returncode,0);self.assertEqual(self.state()['sessions']['T01']['status'],'active');self.assertFalse((self.root/'.git').exists())
 def test_headless_fresh_worker_loop(self):
  fake=self.root/'.local/fake.py';fake.parent.mkdir();fake.write_text('''import json,os\nfrom pathlib import Path\nr=Path.cwd();assert os.environ['ECO_AUTOMATION_WORKER']=='1'\nsid=json.loads((r/'orchestration/state.json').read_text())['active'];p=r/'evidence'/sid;p.mkdir(exist_ok=True,parents=True);(p/'synthetic.txt').write_text('Synthetic worker in isolated test')\na={'session':sid,'architecture_version':'2.3','summary':'Synthetic test','changed_files':[f'evidence/{sid}/synthetic.txt'],'automated_checks':[{'status':'pass','evidence':f'evidence/{sid}/synthetic.txt'}],'manual_checks':[{'status':'pass','evidence':f'evidence/{sid}/synthetic.txt'}],'blockers':[]}\n(p/'acceptance.json').write_text(json.dumps(a))\n''')
  script="import sys;sys.path.insert(0,'tools');import auto_run;\nwith auto_run.lock(): auto_run.run([sys.executable,'.local/fake.py'])"
  a=subprocess.run([sys.executable,'-c',script],cwd=self.root,text=True,capture_output=True);self.assertEqual(a.returncode,0,a.stderr);s=self.state();self.assertIsNone(s['active']);self.assertTrue(all(x['status']=='accepted' for x in s['sessions'].values()));self.assertNotEqual(s['sessions']['T01']['implementation_commit'],s['sessions']['T02']['implementation_commit'])
if __name__=='__main__':unittest.main()
