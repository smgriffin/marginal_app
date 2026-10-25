// Loads a Margin app HTML file into Node with a stub DOM and returns its internals.
const fs=require('fs'),vm=require('vm');
function load(file){
  const html=fs.readFileSync(file,'utf8');
  const src=html.match(/<script>([\s\S]*)<\/script>/)[1];
  const el=()=>new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},dataset:{},appendChild(){},remove(){},focus(){},addEventListener(){},setAttribute(){}},{get:(t,k)=>k in t?t[k]:(k==='innerHTML'||k==='textContent'||k==='value'?'':undefined),set:(t,k,v)=>{t[k]=v;return true;}});
  const document={querySelector:()=>el(),querySelectorAll:()=>[],createElement:()=>el(),body:el(),addEventListener(){},getElementById:()=>el()};
  const ctx={document,window:{},navigator:{},console,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Blob:function(){},URL:{createObjectURL:()=>''},confirm:()=>true,location:{protocol:'file:'},fetch:()=>Promise.reject(new Error('no fetch')),Date,Math,JSON,Promise,performance:{now:()=>Date.now()}};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  const expose='\n;globalThis.__M={SKILLS,ALL:()=>ALL,SK:()=>SK,itemFor,mkOpts,cardIds,genAt,makeProblem:typeof makeProblem!=="undefined"?makeProblem:null,validatePack,evalPack,rebuild,ST:()=>ST,setST:s=>{ST=s;},isRight,fmtAns,'+
   '_:typeof __TEST!=="undefined"?__TEST:{}};';
  vm.runInContext(src+expose,ctx,{filename:file});
  return ctx.__M;
}
module.exports={load};
