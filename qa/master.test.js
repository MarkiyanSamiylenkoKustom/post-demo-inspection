const fs=require('fs'); const {JSDOM}=require('jsdom');
let pass=0, fail=0;
function ok(n,c){ if(c){pass++;} else {fail++; console.log("FAIL:",n);} }
const FORMS=["index.html","scope-sheet.html","demo-day.html","moisture-check.html","initial-job-walk.html","weekly-project-update.html","end-of-day.html"];
const ALL=["hub.html",...FORMS];
const PAGES=JSON.parse(fs.readFileSync(__dirname+'/../pages.json','utf8'));
const VER=Object.fromEntries(Object.entries(PAGES).map(([k,v])=>[k,v.version]));
const CODE={ "index.html":"pdri","scope-sheet.html":"scope","demo-day.html":"demo","moisture-check.html":"moist",
  "initial-job-walk.html":"ijw","weekly-project-update.html":"wpu","end-of-day.html":"eod" };
function load(file, opts){
  opts=opts||{};
  return new JSDOM(fs.readFileSync(file,'utf8'), {
    runScripts:'dangerously', url:'https://x'+Math.random().toString(36).slice(2)+'.local/', pretendToBeVisual:true,
    beforeParse(w){
      w.__mailto=[]; w.__copied=[]; w.__errs=[];
      w.addEventListener('error', e=>w.__errs.push(e.message));
      const oc=w.HTMLAnchorElement.prototype.click;
      w.HTMLAnchorElement.prototype.click=function(){ if((this.href||'').startsWith('mailto:')) w.__mailto.push(this.href); else oc.call(this); };
      Object.defineProperty(w.navigator,'clipboard',{value:{writeText:t=>{w.__copied.push(t);return Promise.resolve();}},configurable:true});
      w.navigator.serviceWorker={register:()=>Promise.resolve()};
      if(opts.navLang) Object.defineProperty(w.navigator,'languages',{value:[opts.navLang],configurable:true});
      if(opts.savedLang) w.localStorage.setItem('kustom_lang', opts.savedLang);
      if(opts.jobs) w.localStorage.setItem('kustom_jobs_v1', JSON.stringify(opts.jobs));
      if(opts.stats) w.localStorage.setItem('kustom_stats_v1', JSON.stringify(opts.stats));
      function Node(){ this.connect=()=>{}; this.start=()=>{w.__audioStarts=(w.__audioStarts||0)+1}; this.stop=()=>{}; }
      w.AudioContext=function(){ this.currentTime=0; this.state='running'; this.sampleRate=44100; this.destination={};
        this.createGain=()=>{const n=new Node(); n.gain={setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}; return n;};
        this.createOscillator=()=>{const n=new Node(); n.frequency={value:0,setValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}; return n;};
        this.createBuffer=(c,l)=>({getChannelData:()=>new Float32Array(l)});
        this.createBufferSource=()=>new Node();
        this.createBiquadFilter=()=>{const n=new Node(); n.frequency={value:0}; return n;};
        this.resume=()=>{}; };
    }
  }).window;
}
const click=(w,el)=>el&&el.dispatchEvent(new w.Event('click',{bubbles:true}));
const type=(w,el,val)=>{el.value=val; el.dispatchEvent(new w.Event('input',{bubbles:true}));};

(async ()=>{
  // ---------- 0) Static: versions, sw, hub links ----------
  for(const f of ALL) ok(`${f} footer ${VER[f]}`, fs.readFileSync(f,'utf8').includes(VER[f]+'</footer>'));
  const sw=fs.readFileSync('sw.js','utf8');
  ok("sw cache present", /"pdri-v\d+"/.test(sw));
  for(const f of ALL) ok(`sw shell has ${f}`, sw.includes(`"./${f}"`));
  const hub=fs.readFileSync('hub.html','utf8');
  for(const f of FORMS) ok(`hub links ${f}`, hub.includes(`href="${f}"`));

  // ---------- 1) Language: autodetect + saved wins + no JS errors ----------
  for(const f of ALL){
    const wa=load(f,{navLang:'uk-UA'});
    ok(`${f} autodetect uk`, wa.document.documentElement.getAttribute('lang')==='uk' && wa.__errs.length===0);
    ok(`${f} autodetect not persisted`, wa.localStorage.getItem('kustom_lang')===null);
    const wb=load(f,{navLang:'es-MX',savedLang:'en'});
    ok(`${f} saved en beats device es`, wb.document.documentElement.getAttribute('lang')==='en');
    const wc=load(f,{navLang:'de-DE'});
    ok(`${f} fallback en`, wc.document.documentElement.getAttribute('lang')==='en');
  }

  // ---------- 2) Every form: copy note format, send gate, tracker, job chips ----------
  const seedJobs=[{j:'25-04-11111',c:'Chip, Test',t:Date.now()}];
  for(const f of FORMS){
    const w=load(f,{jobs:seedJobs}); const d=w.document;
    // recent-jobs chip fills
    const jc=[...d.querySelectorAll('button')].find(b=>b.textContent.includes('25-04-11111'));
    ok(`${f} recent-job chip`, !!jc);
    click(w,jc);
    ok(`${f} chip fills`, d.getElementById('job').value==='25-04-11111' && d.getElementById('cust').value==='Chip, Test');
    // send blocked when job cleared
    type(w, d.getElementById('job'), '');
    click(w, d.getElementById('sendBtn'));
    await new Promise(r=>setTimeout(r,250));
    ok(`${f} send gated w/o job`, w.__mailto.length===0);
    // restore + copy
    type(w, d.getElementById('job'), '25-04-11111');
    click(w, d.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,250));
    const note=w.__copied[w.__copied.length-1]||'';
    ok(`${f} copy works`, !!note);
    ok(`${f} red title + raw markup`, note.startsWith('<b><font color="#C8102E">') && note.includes('<br/>'));
    ok(`${f} note is English`, !/[а-яіїєґ]/i.test(note));
    // stats + history
    const st=JSON.parse(w.localStorage.getItem('kustom_stats_v1'))||[];
    ok(`${f} stats logged as ${CODE[f]}`, st.length>=1 && st[0].f===CODE[f]);
    const hist=JSON.parse(w.localStorage.getItem(CODE[f]==='pdri'?'pdri_hist_v1':CODE[f]+'_hist_v1'))||[];
    ok(`${f} recent notes saved`, hist.length>=1);
    const kids=[...d.querySelectorAll('.wrap > *')].map(x=>x.className);
    ok(`${f} wrap = form-col + preview-col`, kids.length===2 && kids[0]==='form-col' && kids[1]==='preview-col');
    ok(`${f} egg ball present`, !!d.querySelector('[id$="Ball"], #eggBall'));
    ok(`${f} top controls + comfort`, !!d.getElementById('toTopBtn') && !!d.getElementById('topResetBtn'));
  }

  // ---------- 3) Translation spot checks (uk + es) ----------
  const SPOT={
    "hub.html":       {uk:"Звіт за день", es:"Reporte de fin de día"},
    "index.html":     {uk:"Ізоляція підпілля", es:"Aislamiento del ático"},
    "scope-sheet.html":{uk:"Чи усунуто джерело втрати?", es:null},
    "demo-day.html":  {uk:"Товщина гіпсокартону та підкладки", es:null},
    "moisture-check.html":{uk:"Статус сушіння", es:null},
    "initial-job-walk.html":{uk:"План дій", es:null},
    "weekly-project-update.html":{uk:"Виконані роботи", es:null},
    "end-of-day.html":{uk:"Зроблене сьогодні", es:"Trabajo completado hoy"},
  };
  for(const f of ALL){
    const wu=load(f,{savedLang:'uk'});
    ok(`${f} uk spot`, wu.document.body.textContent.includes(SPOT[f].uk));
    if(SPOT[f].es){
      const we=load(f,{savedLang:'es'});
      ok(`${f} es spot`, we.document.body.textContent.includes(SPOT[f].es));
    }
  }

  // ---------- 4) PDRI specifics ----------
  {
    const w=load("index.html",{}); const d=w.document;
    const cost=[...d.querySelectorAll('.phrase-bar .ph')].map(b=>b.textContent);
    ok("pdri 6 cost chips 0-10..150+", cost.includes('$0-10K')&&cost.includes('$150K+'));
    const seg=(k,v)=>[...d.querySelectorAll(`[data-seg="${k}"] button`)].find(b=>b.getAttribute('data-v')===v);
    const chip=(g,v)=>[...d.querySelectorAll(`[data-chips="${g}"] button`)].find(b=>b.getAttribute('data-v')===v);
    click(w,seg('insul','Yes')); click(w,chip('insulwhere','Attic insulation')); click(w,seg('insulTypeAttic','Blown-in'));
    ok("pdri insul type row", d.getElementById('insulTypeAtticRow').classList.contains('show'));
    const html=d.body.innerHTML;
    ok("pdri cabBlock order", html.indexOf('Are Cabinets Affected')<html.indexOf('id="cabBlock"')&&html.indexOf('id="cabBlock"')<html.indexOf('Are Baseboards Removed'));
    const ta=d.querySelector('.room-card .room-grid textarea');
    const css=fs.readFileSync('index.html','utf8');
    ok("pdri room cells 76px", !!ta && /\.room-card \.room-grid textarea\{min-height:76px\}/.test(css));
    type(w,d.getElementById('job'),'25-04-22222'); type(w,d.getElementById('cust'),'QA, Full');
    click(w,d.getElementById('copyBtn'));
    await new Promise(r=>setTimeout(r,250));
    ok("pdri insul bullet", (w.__copied[0]||'').includes('attic insulation (blown-in)'));
  }
  // scope-sheet dynamic room translation (MutationObserver)
  {
    const w=load("scope-sheet.html",{savedLang:'uk'});
    const add=[...w.document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Додати кімнату'));
    ok("scope add-room btn (uk)", !!add);
    click(w,add);
    await new Promise(r=>setTimeout(r,350));
    ok("scope dynamic card translated", [...w.document.querySelectorAll('label,h2,b')].some(e=>e.textContent.includes('Це підпілля чи горище?')));
  }
  // EOD specifics
  {
    const w=load("end-of-day.html",{}); const d=w.document;
    w.localStorage.setItem('kustom_tech_v1','Memo, Tech');
    const chip=v=>[...d.querySelectorAll('#workChips button')].find(b=>b.getAttribute('data-v')===v);
    const seg=(k,v)=>[...d.querySelectorAll(`[data-lseg="${k}"] button`)].find(b=>b.getAttribute('data-v')===v);
    ok("eod 19 tiles", d.querySelectorAll('#workChips button').length===19);
    click(w,seg('photos','No'));
    ok("eod photos cond", d.getElementById('photoswhyCond').classList.contains('show'));
    click(w,chip('Paint')); click(w,chip('Tile'));
    ok("eod tiles toggle", chip('Paint').classList.contains('on'));
  }

  // ---------- 5) Hub: easter egg + stats card ----------
  {
    const now=Date.now();
    const w=load("hub.html",{stats:[{t:now,f:'eod',j:'1',s:120},{t:now-9*864e5,f:'pdri',j:'2',s:600}]});
    const d=w.document;
    ok("hub stats card visible", d.getElementById('statsCard').style.display==='');
    ok("hub stats total 2 / week 1", d.getElementById('stN').textContent==='2' && d.getElementById('stW').textContent==='1');
    ok("egg: 7 worker imgs", [1,2,3,4,5,6,7].every(n=>{const e=d.getElementById('eggW'+n); return e&&e.tagName==='IMG'&&e.src.startsWith('data:image/png;base64,');}));
    ok("egg: van img + 3 ball frames", d.getElementById('eggBus').tagName==='IMG' && d.querySelectorAll('#eggBall .orb svg').length===3);
    ok("egg: orb display block", w.getComputedStyle(d.querySelector('#eggBall .orb')).display==='block');
    click(w, d.getElementById('eggBall'));
    ok("egg: play + fullscreen sparkles + audio", d.getElementById('eggStage').classList.contains('play') && d.getElementById('eggSky').querySelectorAll('.eggSpark').length===28 && (w.__audioStarts||0)>50);
    await new Promise(r=>setTimeout(r,2100));
    ok("egg: workers in", [1,2,3,4,5,6,7].every(n=>d.getElementById('eggW'+n).classList.contains('in')));
    await new Promise(r=>setTimeout(r,6000));
    ok("egg: reset clean", !d.getElementById('eggStage').classList.contains('play') && d.getElementById('eggSky').children.length===0);
  }

  console.log(`\n========== MASTER QA: ${pass} passed, ${fail} failed ==========`);
  process.exit(fail?1:0);
})();
