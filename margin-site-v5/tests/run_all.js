// Runs on every update (GitHub Actions): ids never removed, every generator fuzzed and independently checked, every pack validated.
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');const {load}=require('./harness');
const root=path.join(__dirname,'..');let bad=0;const M=load(path.join(root,'index.html'));
const all=new Set();M.ALL().forEach(s=>{all.add(s.id);s.micros.forEach(m=>all.add(m.id));s.integ.forEach((_,i)=>all.add(s.id+'.i'+(i+1)));});
const shipped=JSON.parse(fs.readFileSync(path.join(__dirname,'margin_item_ids.json'),'utf8'));
const gone=shipped.filter(id=>!all.has(id));if(gone.length){console.log('MISSING ids (progress would be lost):',gone.join(' '));bad++;}else console.log(`ids: all ${shipped.length} shipped ids present (${all.size} now)`);
const core=M.ALL().map(s=>s.id);
const idx=JSON.parse(fs.readFileSync(path.join(root,'packs','index.json'),'utf8'));
for(const file of ['_template.js',...(idx.packs||[])]){const src=fs.readFileSync(path.join(root,'packs',file),'utf8');try{const p=M.evalPack(src);const e=M.validatePack(p,core);if(e.length){console.log(`pack ${file}: FAIL`,e.join(' | '));bad++;}else console.log(`pack ${file}: ok (${p.skills.length} skills)`);}catch(e){console.log(`pack ${file}: FAIL ${e.message}`);bad++;}}
try{console.log(execFileSync('node',[path.join(__dirname,'fuzz.js'),path.join(root,'index.html'),process.env.FUZZ_N||'120'],{encoding:'utf8'}).trim());}catch(e){console.log(e.stdout);bad++;}
process.exit(bad?1:0);
