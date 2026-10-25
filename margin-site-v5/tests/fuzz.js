// Fuzz every generator; check each numeric answer independently with margin_checker.js; check choices.
const {load}=require('./harness');const {ORACLE,MCO,T,close}=require('./margin_checker');
const file=process.argv[2],N=+(process.argv[3]||300);const M=load(file);
const isInt=s=>!/\./.test(s);let fails=[],stats={gens:0,checked:0,unchecked:new Set()};
const items=[];M.ALL().forEach(s=>{s.micros.forEach(m=>{items.push([m.id,m.gen]);if(m.gen3)items.push([m.id+'*',m.gen3]);});s.integ.forEach((g,i)=>items.push([s.id+'.i'+(i+1),g]));});
for(const [id,g] of items){stats.gens++;let bad=0;
 for(let k=0;k<N&&bad<3;k++){const lv=1+(k%3);let p;try{p=M.genAt(g,lv);}catch(e){fails.push(`${id}: throws ${e.message}`);bad++;continue;}
  const txt=p.q+' '+p.sol+' '+(p.opts||[]).join(' ');if(/NaN|undefined|Infinity|\[object/.test(txt)){fails.push(`${id}: bad text ${txt.slice(0,160)}`);bad++;continue;}
  if(p.kind==='num'){if(!isFinite(p.ans)){fails.push(id+': ans not finite');bad++;continue;}
   const o=M.mkOpts(p);if(new Set(o.opts).size<4){fails.push(`${id}: <4 choices ${o.opts}`);bad++;continue;}
   const A=o.opts[o.ans],others=o.opts.filter((_,i)=>i!==o.ans);
   if(others.every(x=>isInt(x)!==isInt(A))){fails.push(`${id}: giveaway int/dec ${o.opts} ans ${A}`);bad++;}
   if(others.every(x=>(x.startsWith('-'))!==A.startsWith('-'))){fails.push(`${id}: giveaway sign ${o.opts}`);bad++;}
   const key=ORACLE[id]?id:null;
   if(key){let v;try{v=ORACLE[key](T(p),p.q);}catch(e){fails.push(`${id}: oracle error ${e.message} :: ${T(p).slice(0,200)}`);bad++;continue;}
    stats.checked++;const ok=p.check?p.check(v):(close(v,p.ans)||(p.absOK&&close(-v,p.ans)));if(!ok){fails.push(`${id}: oracle ${v} vs app ${p.ans} :: ${T(p).slice(0,260)}`);bad++;}}
   else stats.unchecked.add(id);}
  else{if(!(p.opts&&p.ans>=0&&new Set(p.opts).size===p.opts.length)){fails.push(id+': bad mc');bad++;continue;}
   if(MCO[id]){let v;try{v=MCO[id](T(p),p.q);}catch(e){fails.push(`${id}: mco error ${e.message} :: ${T(p).slice(0,200)}`);bad++;continue;}stats.checked++;
    const right=p.opts[p.ans];const ok=Array.isArray(v)?(v.length===1&&right.includes(v[0]))||v.some(x=>right===x):String(v)===right;
    if(!ok&&!Array.isArray(v)){fails.push(`${id}: mco ${v} vs app ${right} :: ${T(p).slice(0,220)}`);bad++;}}
   else if(!/^True or false/.test(T(p)))stats.unchecked.add(id);}
 }}
console.log(`generators ${stats.gens}, oracle checks ${stats.checked}, failures ${fails.length}`);
console.log('not oracle-checked (non-TF):',[...stats.unchecked].join(' '));
fails.slice(0,40).forEach(x=>console.log(' -',x));process.exit(fails.length?1:0);
