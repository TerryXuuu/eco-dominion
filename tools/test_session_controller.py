"""Isolated governance failure-path tests; never marks delivered sessions accepted."""
import unittest,tempfile,shutil,subprocess,json
from pathlib import Path
SOURCE=Path(__file__).resolve().parents[1]
class Governance(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)/'repo';shutil.copytree(SOURCE,self.root,ignore=shutil.ignore_patterns('.git','__pycache__'))
 def tearDown(self):self.tmp.cleanup()
 def runctl(self,*args):return subprocess.run(['python',str(self.root/'tools/session_controller.py'),*args],cwd=self.root,text=True,capture_output=True)
 def test_architecture_drift_blocks(self):
  (self.root/'docs/ARCHITECTURE_FREEZE.md').write_text('unapproved change');r=self.runctl('validate');self.assertNotEqual(r.returncode,0);self.assertIn('Architecture drift',r.stderr)
 def test_duplicate_active_blocks(self):
  p=self.root/'orchestration/state.json';s=json.loads(p.read_text());s['sessions']['S02']['status']='active';p.write_text(json.dumps(s));self.assertNotEqual(self.runctl('validate').returncode,0)
 def test_checkpoint_and_missing_tests_cannot_accept(self):
  self.assertEqual(self.runctl('init').returncode,0);self.assertEqual(self.runctl('checkpoint').returncode,0)
  self.assertNotEqual(self.runctl('checkpoint').returncode,0);self.assertNotEqual(self.runctl('check').returncode,0)
  self.assertNotEqual(self.runctl('accept').returncode,0);s=json.loads((self.root/'orchestration/state.json').read_text());self.assertEqual(s['active'],'S01');self.assertEqual(s['sessions']['S01']['status'],'active')
 def test_block_resume_preserves_checkpoint_and_prior_evidence(self):
  self.assertEqual(self.runctl('init').returncode,0);self.assertEqual(self.runctl('checkpoint').returncode,0);before=json.loads((self.root/'orchestration/state.json').read_text())['sessions']['S01']['checkpoint'];e=self.root/'evidence/S01/failed.log';e.write_text('observed failure');self.assertEqual(self.runctl('block','Owner decision unavailable; review R01').returncode,0);self.assertNotEqual(self.runctl('check').returncode,0);self.assertEqual(self.runctl('resume').returncode,0);after=json.loads((self.root/'orchestration/state.json').read_text());self.assertEqual(after['sessions']['S01']['checkpoint'],before);self.assertTrue(e.exists());self.assertEqual(after['active'],'S01')
 def test_isolated_synthetic_accept_records_implementation_and_activates_next(self):
  # Replace plan in temporary copy only. This fixture is not gameplay/user approval.
  mp=self.root/'orchestration/manifest.json';sp=self.root/'orchestration/state.json';m=json.loads(mp.read_text());s=json.loads(sp.read_text());m['sessions']=m['sessions'][:2]
  for i,e in enumerate(m['sessions']):e['checks']=[];e['id']=f'T{i+1:02d}';e['requires']=[] if i==0 else ['T01'];e['test']=['node','--test','tests/engine.test.mjs']
  s['active']='T01';s['sessions']={e['id']:{'status':'active' if i==0 else 'pending','implementation_commit':None,'checkpoint':None,'blocker':None,'next_action':'fixture'} for i,e in enumerate(m['sessions'])};mp.write_text(json.dumps(m));sp.write_text(json.dumps(s));self.assertEqual(self.runctl('render-ledgers').returncode,0)
  self.assertEqual(self.runctl('init').returncode,0);self.assertEqual(self.runctl('checkpoint').returncode,0)
  folder=self.root/'evidence/T01';folder.mkdir();(folder/'fixture.txt').write_text('Synthetic controller transition observation in isolated test.');a={'session':'T01','architecture_version':'2.3','summary':'Synthetic governance fixture','changed_files':['evidence/T01/fixture.txt'],'automated_checks':[{'status':'pass','evidence':'evidence/T01/fixture.txt'}],'manual_checks':[{'status':'pass','evidence':'evidence/T01/fixture.txt'}],'blockers':[]};(folder/'acceptance.json').write_text(json.dumps(a))
  subprocess.run(['git','add','.'],cwd=self.root,check=True,capture_output=True);subprocess.run(['git','commit','-m','T01: isolated controller fixture'],cwd=self.root,check=True,capture_output=True);head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=self.root,text=True).strip()
  r=self.runctl('accept');self.assertEqual(r.returncode,0,r.stderr);after=json.loads(sp.read_text());self.assertEqual(after['sessions']['T01']['implementation_commit'],head);self.assertEqual(after['active'],'T02');self.assertEqual(subprocess.check_output(['git','status','--porcelain'],cwd=self.root,text=True).strip(),'');self.assertNotEqual(self.runctl('accept').returncode,0)
if __name__=='__main__':unittest.main()
