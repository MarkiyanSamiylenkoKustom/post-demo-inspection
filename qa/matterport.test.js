const fs=require('fs'); const {JSDOM}=require('jsdom');
let pass=0, fail=0;
function ok(n,c){ if(c){pass++;} else {fail++; console.log("FAIL:",n);} }
const click=(w,el)=>el.dispatchEvent(new w.Event('click',{bubbles:true}));
const type=(w,el,v)=>{el.value=v; el.dispatchEvent(new w.Event('input',{bubbles:true}));};
function load(file){
  return new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',url:'https://x'+Math.random().toString(36).slice(2)+'.local/',pretendToBeVisual:true,
    beforeParse(w){ w.__copied=[]; w.navigator.serviceWorker={register:()=>Promise.resolve()};
      Object.defineProperty(w.navigator,'clipboard',{value:{writeText:t=>{w.__copied.push(t);return Promise.resolve();}},configurable:true});
      w.AudioContext=function(){};
    }}).window;
}
const L1='https://my.matterport.com/show/?m=AAAA1111', L2='https://my.matterport.com/show/?m=BBBB2222';
(async ()=>{
  // ---- PDRI: two links -> two raw lines under the Matterport header ----
  {
    const w=load('index.html'); const d=w.document;
    ok("pdri mplink is textarea", d.getElementById('mplink').tagName==='TEXTAREA');
    type(w, d.getElementById('job'), '25-04-50001');
    type(w, d.getElementById('cust'), 'Multi, Port');
    type(w, d.getElementById('mplink'), L1+'\n'+L2);
    click(w, d.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,250));
    const n=w.__copied[0]||'';
    ok("pdri: both links present", n.includes(L1) && n.includes(L2));
    ok("pdri: links on separate lines", n.includes(L1+'<br/>'+L2) || (n.split('<br/>').includes(L1) && n.split('<br/>').includes(L2)));
    // single link unchanged
    const w1=load('index.html'); const d1=w1.document;
    type(w1, d1.getElementById('job'), '25-04-50002');
    type(w1, d1.getElementById('cust'), 'Single, Port');
    type(w1, d1.getElementById('mplink'), L1);
    click(w1, d1.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,250));
    ok("pdri: single link intact", (w1.__copied[0]||'').split('<br/>').includes(L1));
  }
  // ---- scope: numbered bullets ----
  {
    const w=load('scope-sheet.html'); const d=w.document;
    type(w, d.getElementById('job'), '25-04-50003');
    type(w, d.getElementById('cust'), 'Scope, Port');
    const done=[...d.querySelectorAll('[data-lseg="prescan"] button')].find(b=>b.getAttribute('data-v')==='Completed');
    click(w, done);
    type(w, d.getElementById('prescanLink'), L1+'\n'+L2);
    click(w, d.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,250));
    const n=w.__copied[0]||'';
    ok("scope: link 1 unnumbered", n.includes('Pre-Demo Matterport Link: '+L1));
    ok("scope: link 2 numbered", n.includes('Pre-Demo Matterport Link 2: '+L2));
  }
  // ---- demo: numbered kv lines ----
  {
    const w=load('demo-day.html'); const d=w.document;
    type(w, d.getElementById('job'), '25-04-50004');
    type(w, d.getElementById('cust'), 'Demo, Port');
    const yes=[...d.querySelectorAll('[data-lseg="pdm"] button')].find(b=>b.getAttribute('data-v')==='Yes');
    click(w, yes);
    type(w, d.getElementById('pdmlink'), L1+'\n'+L2);
    click(w, d.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,250));
    const n=w.__copied[0]||'';
    ok("demo: link 1", n.includes('POST-DEMO MATTERPORT LINK:</b> '+L1) || n.includes('POST-DEMO MATTERPORT LINK:')&&n.includes(L1));
    ok("demo: link 2 numbered", n.includes('POST-DEMO MATTERPORT LINK 2:') && n.includes(L2));
    // single link keeps original single-kv shape
    const w1=load('demo-day.html'); const d1=w1.document;
    type(w1, d1.getElementById('job'), '25-04-50005');
    type(w1, d1.getElementById('cust'), 'One, Port');
    click(w1, [...d1.querySelectorAll('[data-lseg="pdm"] button')].find(b=>b.getAttribute('data-v')==='Yes'));
    type(w1, d1.getElementById('pdmlink'), L1);
    click(w1, d1.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,250));
    ok("demo: single link no numbering", (w1.__copied[0]||'').includes(L1) && !(w1.__copied[0]||'').includes('LINK 2:'));
  }
  // draft roundtrip: PDRI textarea persists both lines
  {
    const w=load('index.html'); const d=w.document;
    type(w, d.getElementById('mplink'), L1+'\n'+L2);
    await new Promise(r=>setTimeout(r,900));
    const draft=w.localStorage.getItem('pdri_draft_v1')||'';
    ok("pdri draft keeps both links", draft.includes('AAAA1111') && draft.includes('BBBB2222'));
  }
  console.log(`\nMATTERPORT: ${pass} passed, ${fail} failed`);
  process.exit(fail?1:0);
})();
