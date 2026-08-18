const fs=require('fs'); const {JSDOM}=require('jsdom');
let pass=0, fail=0;
function ok(n,c){ if(c){pass++;} else {fail++; console.log("FAIL:",n);} }
const click=(w,el)=>el.dispatchEvent(new w.Event('click',{bubbles:true}));
const type=(w,el,v)=>{el.value=v; el.dispatchEvent(new w.Event('input',{bubbles:true}));};
function load(file,opts){
  opts=opts||{};
  return new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',url:'https://x'+Math.random().toString(36).slice(2)+'.local/',pretendToBeVisual:true,
    beforeParse(w){ w.__copied=[]; w.navigator.serviceWorker={register:()=>Promise.resolve()};
      Object.defineProperty(w.navigator,'clipboard',{value:{writeText:t=>{w.__copied.push(t);return Promise.resolve();}},configurable:true});
      if(opts.savedLang) w.localStorage.setItem('kustom_lang',opts.savedLang);
      w.AudioContext=function(){};
    }}).window;
}
(async ()=>{
  // ---- LONG NOTE on scope-sheet: inflate the Additional info field (guaranteed note field) ----
  const w=load('scope-sheet.html'); const d=w.document;
  type(w, d.getElementById('job'), '25-04-31313');
  type(w, d.getElementById('cust'), 'Split, Test');
  const addl=[...d.querySelectorAll('textarea')].find(t=>(t.placeholder||'').includes('estimator or PM'));
  ok("additional-info field found", !!addl);
  const LINE='Flooring removed throughout the area including transitions, pad disposed, tack strip pulled along all walls';
  type(w, addl, Array.from({length:80},(_,i)=>'Item '+(i+1)+': '+LINE).join('\n'));
  await new Promise(r=>setTimeout(r,150));
  click(w, d.getElementById('copyBtn'));
  await new Promise(r=>setTimeout(r,250));
  ok("first copy happened", w.__copied.length===1);
  const p1=w.__copied[0];
  ok("part1 under 3000", p1.length<=3000);
  ok("part1 tagged", p1.includes('(PART 1/'));
  const n=parseInt((p1.match(/\(PART 1\/(\d+)\)/)||[])[1]||'0');
  ok("multiple parts", n>=2);
  ok("splitter toast visible", d.getElementById('nsToast').style.display==='block');
  for(let k=2;k<=n;k++){
    click(w, d.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,200));
  }
  ok("all parts copied", w.__copied.length===n);
  const parts=w.__copied;
  ok("every part <= 3000", parts.every(p=>p.length<=3000));
  ok("continuations tagged + headed", parts.slice(1).every((p,i)=>p.includes('(PART '+(i+2)+'/'+n+')') && p.includes('--- CONTINUED ---') && p.includes('25-04-31313')));
  ok("first and last items not lost", parts.some(p=>p.includes('Item 1:')) && parts.some(p=>p.includes('Item 80:')));
  click(w, d.getElementById('copyBtn'));
  await new Promise(r=>setTimeout(r,200));
  ok("cycles back to part1", w.__copied[w.__copied.length-1].includes('(PART 1/'));
  // ---- SHORT NOTE stays single-copy, untouched ----
  const w2=load('end-of-day.html'); const d2=w2.document;
  type(w2, d2.getElementById('job'), '25-04-31314');
  type(w2, d2.getElementById('cust'), 'Short, Note');
  click(w2, [...d2.querySelectorAll('#workChips button')][4]);
  click(w2, d2.getElementById('copyBtn'));
  await new Promise(r=>setTimeout(r,250));
  ok("short note single copy", w2.__copied.length===1);
  ok("short note has no PART tag", !w2.__copied[0].includes('(PART'));
  ok("no splitter toast for short", d2.getElementById('nsToast').style.display!=='block');
  // hard-max guarantee with a very long customer name
  const w4=load('scope-sheet.html'); const d4=w4.document;
  type(w4, d4.getElementById('job'), '25-04-31315');
  type(w4, d4.getElementById('cust'), 'Extraordinarily-Longname Hyphenated-Familyname von Testcustomer y Garcia de la Cruz-Smith Junior III');
  const addl4=[...d4.querySelectorAll('textarea')].find(t=>(t.placeholder||'').includes('estimator or PM'));
  type(w4, addl4, Array.from({length:90},(_,i)=>'Row '+(i+1)+': '+'y'.repeat(120)).join('\n'));
  await new Promise(r=>setTimeout(r,150));
  const btn4=d4.getElementById('copyBtn');
  click(w4, btn4);
  await new Promise(r=>setTimeout(r,200));
  const n4=parseInt((w4.__copied[0].match(/\(PART 1\/(\d+)\)/)||[])[1]||'0');
  ok("longname: split engaged", n4>=2);
  await new Promise(r=>setTimeout(r,2800));
  ok("longname: button shows next part (after form flash)", btn4.textContent==='Copy Part 2/'+n4);
  for(let k=2;k<=n4;k++){ click(w4, btn4); await new Promise(r=>setTimeout(r,150)); }
  ok("longname: ALL parts <= 2980 hard max", w4.__copied.every(p=>p.length<=2980));
  ok("longname: button restored after cycle", btn4.textContent!=='Copy Part 1/'+n4 && !btn4.textContent.includes('Part'));
  // editing mid-cycle resets state and label
  click(w4, btn4); await new Promise(r=>setTimeout(r,2800));
  ok("mid-cycle label", btn4.textContent.includes('Copy Part 2/'));
  type(w4, d4.getElementById('job'), '25-04-31316');
  await new Promise(r=>setTimeout(r,100));
  ok("edit resets label", !btn4.textContent.includes('Part'));
  // uk toast language
  const w3=load('scope-sheet.html',{savedLang:'uk'});
  ok("uk lang set for toast source", w3.document.documentElement.getAttribute('lang')==='uk');
  console.log(`\nSPLITTER: ${pass} passed, ${fail} failed`);
  process.exit(fail?1:0);
})();
