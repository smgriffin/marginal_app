// ===== Independent checker: reads the question TEXT and re-solves by brute force =====
const T=p=>p.q.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<sub>(.*?)<\/sub>/g,'$1').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/−/g,'-').replace(/[₀-₉]/g,c=>'0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(c)]);
const N=s=>+String(s).replace(/,/g,'');
const m1=(t,re)=>{const m=t.match(re);if(!m)throw new Error('parse: '+re);return m;};
function argmax(fn,lo,hi){let best=lo,bv=-Infinity;const n=4000;for(let i=0;i<=n;i++){const x=lo+(hi-lo)*i/n,v=fn(x);if(v>bv){bv=v;best=x;}}let a=Math.max(lo,best-(hi-lo)/n),b=Math.min(hi,best+(hi-lo)/n);for(let k=0;k<200;k++){const c=a+(b-a)*0.382,d=a+(b-a)*0.618;if(fn(c)<fn(d))a=c;else b=d;}const x=(a+b)/2;return fn(lo)>=fn(x)&&fn(lo)>=bv?lo:x;}
function integ(fn,a,b){const n=2000,h=(b-a)/n;let s=fn(a)+fn(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*fn(a+i*h);return s*h/3;}
const deriv=(fn,x)=>(fn(x+1e-5)-fn(x-1e-5))/2e-5;
// inverse demand "P(q) = a - q/B" or "a - q"
function invD(t){const m=m1(t,/P\(q\) = ([\d.,]+) - q(?:\/([\d.,]+))?/);const a=N(m[1]),B=m[2]?N(m[2]):1;return {a,B,P:q=>Math.max(0,a-q/B),qmax:a*B};}
function demP(t){const m=m1(t,/D\(p\) = ([\d.,]+) - ([\d.,]*)p/);const A=N(m[1]),b=m[2]?N(m[2]):1;return {P:q=>Math.max(0,(A-q)/b),qmax:A};}
// polynomial cost "C(q) = q³ - 8q² + 17q" / "q²/4" / "3q + 40" / "2q² + 3q"
function poly(expr){expr=expr.replace(/\s/g,'').replace(/-/g,'+-');const terms=expr.split('+').filter(Boolean).map(tm=>{let mt=tm.match(/^(-?[\d.]*)q(³|²)?(?:\/(\d+(?:\.\d+)?))?$/);if(mt){const c=(mt[1]===''?1:mt[1]==='-'?-1:+mt[1])/(mt[3]?+mt[3]:1),pw=mt[2]==='³'?3:mt[2]==='²'?2:1;return q=>c*q**pw;}if(/^-?[\d.]+$/.test(tm))return ()=>+tm;throw new Error('poly '+tm);});return q=>terms.reduce((s,f)=>s+f(q),0);}
const costOf=t=>{const m=m1(t,/C\(q\) = ([^.,;]*?q[²³]?(?:\/\d)?(?: [+-] [\d.]*q?[²³]?)*)(?=[.,;]| and| with| where|$)/);return poly(m[1]);};
const cMC=t=>{const m=t.match(/(?:constant MC|constant marginal cost|MC =|MC|marginal cost is constant at|marginal cost) (?:is )?(\d+(?:\.\d+)?)/);if(!m)throw new Error('mc');return +m[1];};
const monoQ=(P,C,qmax)=>argmax(q=>P(q)*q-C(q),0,qmax);
const ceilQ=(P,C,pb,qmax)=>argmax(q=>Math.min(pb,P(q))*q-C(q),0,qmax);
const close=(a,b,tol=0.02)=>Math.abs(a-b)<=Math.max(tol,Math.abs(b)*0.004);
// lottery / market helpers
const vals=t=>[...t.matchAll(/\b([A-F]) (\d+)\b/g)].map(m=>+m[2]);
const combos=(arr,k)=>{const out=[];const rec=(i,c)=>{if(c.length===k){out.push(c.slice());return;}for(let j=i;j<arr.length;j++){c.push(arr[j]);rec(j+1,c);c.pop();}};rec(0,[]);return out;};
const mcPrices=(v,S)=>{const cand=[];for(let p=0;p<=Math.max(...v)+1;p+=0.5){const gt=v.filter(x=>x>p).length,ge=v.filter(x=>x>=p).length;if(gt<=S&&S<=ge)cand.push(p);}return cand;};
const ORACLE={
 S0a:t=>{const m=m1(t,/f\(q\) = (.*)\. What is f′\((\d+)\)/);return deriv(poly(m[1].replace(/ /g,'')),+m[2]);},
 S0b:t=>{const m=m1(t,/Π\(q\) = (\d+(?:\.\d+)?)q - (\d+(?:\.\d+)?)q²/);return argmax(q=>+m[1]*q-+m[2]*q*q,0,1e5);},
 S0c:t=>{const m=m1(t,/Solve for q: (.*) = (.*)$/);const L=poly(m[1].replace(/ /g,'')),Rr=poly(m[2].replace(/ /g,''));let a=0,b=1000;for(let i=0;i<200;i++){const c=(a+b)/2;if((L(a)-Rr(a))*(L(c)-Rr(c))<=0)b=c;else a=c;}return a;},
 S0d:t=>{const m=m1(t,/root of (.*) = 0/);const fn=poly(m[1].replace(/ /g,''));let best=null;for(let x=0;x<=50;x+=0.001){if(Math.abs(fn(x))<1e-6)best=x;}let r=null;for(let x=-1;x<=50;x+=0.01){if(fn(x)*fn(x+0.01)<=0){r=x;}}return Math.round(r*100)/100+ (Math.abs(fn(Math.round(r*100)/100))<1e-6?0:0);},
 S0e:t=>{const m=m1(t,/h\(x\) = (\(x\/(\d+)\)²|x²\/(\d+))\. What is h′\((\d+)\)/);const x=+m[4];const fn=m[2]?(z=>(z/+m[2])**2):(z=>z*z/+m[3]);return deriv(fn,x);},
 S0f:t=>{if(/triangle/.test(t)){const m=m1(t,/base ([\d,]+) .*height (\d+)/);const b=N(m[1]),h=+m[2];return integ(x=>h*(1-x/b),0,b);}const m=m1(t,/width ([\d,]+) and heights (\d+) and (\d+)/);const w=N(m[1]),h1=+m[2],h2=+m[3];return integ(x=>h1+(h2-h1)*x/w,0,w);},
 S0g:t=>{let m=t.match(/goes from ([\d,]+) to ([\d,]+)/);if(m)return (N(m[2])-N(m[1]))/N(m[1])*100;m=m1(t,/price of \$(\d+(?:\.\d+)?) changes by (-?\d+(?:\.\d+)?)%/);return +m[1]*(1+ +m[2]/100);},
 'S0.i1':t=>{const m=m1(t,/Π\(q\) = (.*)\. Find/);const e=m[1].replace(/·/g,'').replace(/ /g,'');const fn=poly(e);const q=argmax(fn,0,1e4);return fn(q);},
 'S0.i2':t=>{const I=invD(t);const m=m1(t,/line at (\d+(?:\.\d+)?), from q = (\d+) to q = (\d+)/);return integ(q=>I.P(q)-+m[1],+m[2],+m[3]);},
 S1a:t=>{const m=m1(t,/values at \$([\d,]+)\. .* pay for it is \$([\d,]+)\. .* price of \$([\d,]+)\. What is the (buyer|seller|total)/);const [s,b,p]=[N(m[1]),N(m[2]),N(m[3])];return m[4]==='buyer'?b-p:m[4]==='seller'?p-s:b-s;},
 'S1.i1':t=>{const S=+m1(t,/^(\d) apartments/)[1];const r=[...t.matchAll(/r(\d) = (-?\d+)/g)].map(x=>+x[2]);const w=m1(t,/picks families ([\d, ]+)\./)[1].split(',').map(x=>+x-1);const best=Math.max(...combos(r,S).map(c=>c.reduce((a,b)=>a+b,0)));return best-w.reduce((a,i)=>a+r[i],0);},
 'S1.i2':t=>{const r=[...t.matchAll(/r(\d) = (-?\d+)/g)].map(x=>+x[2]);const m=m1(t,/family (\d) buys family (\d)'s/);return r[+m[1]-1]-r[+m[2]-1];},
 S2a:t=>{const v=vals(t);let S=+(t.match(/S = (\d)/)||t.match(/has (\d) apartments/))[1];if(/adds one more/.test(t))S++;return Math.max(...mcPrices(v,S));},
 S2b:t=>{const v=vals(t),S=+m1(t,/S = (\d)/)[1];return Math.min(...mcPrices(v,S));},
 S2d:t=>{const v=vals(t),S=+m1(t,/S = (\d)/)[1],p=+m1(t,/p̄ = (\d+)/)[1];return v.filter(x=>x>p).length-S;},
 'S2.i1':t=>{const v=vals(t),S=+m1(t,/S = (\d)/)[1],p=+m1(t,/p̄ = (\d+)/)[1];const ent=v.filter(x=>x>p);const cs=combos(ent,S);const exp=cs.reduce((a,c)=>a+c.reduce((x,y)=>x+y,0),0)/cs.length;const eff=Math.max(...combos(v,S).map(c=>c.reduce((a,b)=>a+b,0)));return eff-exp;},
 S3a:t=>{const m=m1(t,/at ([\d, ]+); consumer 2 at ([\d, ]+)\. .*p = (\d+(?:\.\d+)?)/);const all=[...m[1].split(','),...m[2].split(',')].map(Number);return all.filter(x=>x>+m[3]).length;},
 S3b:t=>{const m=m1(t,/at ([\d, ]+); consumer 2 at ([\d, ]+)\. The price is (\d+(?:\.\d+)?)/);const all=[...m[1].split(','),...m[2].split(',')].map(Number);return all.reduce((s,x)=>s+Math.max(0,x-+m[3]),0);},
 S3c:t=>{const m=m1(t,/v\(q\) = (\d+)q - q²\/(\d+)\. .* p = (\d+)/);return argmax(q=>+m[1]*q-q*q/+m[2]-+m[3]*q,0,1e4);},
 S3d:t=>{const m=m1(t,/v\(q\) = (\d+)q - q²\/2\. At p = (\d+)/);const v=q=>+m[1]*q-q*q/2;const q=argmax(x=>v(x)-+m[2]*x,0,1e4);return v(q)-+m[2]*q;},
 'S3.i1':t=>{const mm=t.match(/at ([\d, ]+); consumer 2 at ([\d, ]+)\. The price falls from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)/);if(mm){const all=[...mm[1].split(','),...mm[2].split(',')].map(Number);const cs=p=>all.reduce((s,x)=>s+Math.max(0,x-p),0);return cs(+mm[4])-cs(+mm[3]);}const m=m1(t,/at ([\d, ]+); consumer 2 at ([\d, ]+)\. .*MC (\d+)/);const all=[...m[1].split(','),...m[2].split(',')].map(Number);const c=+m[3];let best=0;for(let p=0;p<=20;p+=0.5){const q=all.filter(x=>x>=p).length;best=Math.max(best,(p-c)*q);}return best;},
 'S3.i2':t=>{const m=m1(t,/(\d) identical .* v\(q\) = (\d+)q - q²\/2\. At p = (\d+)/);const v=q=>+m[2]*q-q*q/2;const q=argmax(x=>v(x)-+m[3]*x,0,1e3);return +m[1]*(v(q)-+m[3]*q);},
 S4a:t=>{const m=m1(t,/sells (\d+) units at price (\d+)\. Average cost .* is (\d+)/);return +m[1]*+m[2]-+m[1]*+m[3];},
 S4c:t=>{const m=m1(t,/At q = (\d+): P = (\d+), AC = (\d+)\. At q = (\d+): P = (\d+), AC = (\d+)\. What is the (MR|MC)/);const [q1,P1,A1,q2,P2,A2]=[1,2,3,4,5,6].map(i=>+m[i]);return m[7]==='MR'?q2*P2-q1*P1:q2*A2-q1*A1;},
 'S4.i2':t=>{const m=m1(t,/At q = (\d+): P = (\d+), AC = (\d+)\. At q = (\d+): P = (\d+), AC = (\d+)/);const [q1,P1,A1,q2,P2,A2]=[1,2,3,4,5,6].map(i=>+m[i]);return q2*(P2-A2)-q1*(P1-A1);},
 S4e:t=>{let m=t.match(/B\(n\) = (\d+)n - (\d+(?:\.\d+)?)n²\. Each .* costs (\d+)/);if(m)return argmax(n=>+m[1]*n-+m[2]*n*n-+m[3]*n,0,1e5);m=m1(t,/for \$(\d+) million each\. .*P\(n\) = (\d+) - (\d+(?:\.\d+)?)n/);return argmax(n=>n*(+m[2]-+m[3]*n)-+m[1]*n,0,1e3);},
 S5a:t=>{const C=costOf(t),p=+m1(t,/at p = (\d+)/)[1];return argmax(q=>p*q-C(q),0,1e3);},
 S5b:t=>{const C=costOf(t);let mn=Infinity;for(let q=0.001;q<20;q+=0.001)mn=Math.min(mn,C(q)/q);return mn;},
 S5c:t=>{const C=costOf(t);return argmax(q=>-C(q)/q,0.01,20);},
 S5d:t=>{const C=costOf(t),q=+m1(t,/at q = (\d+)/)[1];return deriv(C,q);},
 'S5.i1':t=>{const C=costOf(t),p=+m1(t,/at p = (\d+)/)[1];const q=argmax(x=>p*x-C(x),0,50);return p*q-C(q)>0?q:0;},
 'S5.i2':t=>{const C=costOf(t),p=+m1(t,/at p = (\d+)/)[1];const q=argmax(x=>p*x-C(x),0,50);return Math.max(0,p*q-C(q));},
 S6a:t=>{const m=m1(t,/profit of \$([\d,]+)\. .*rents for \$([\d,]+).*earn \$([\d,]+) elsewhere.*has \$([\d,]+) of .*pay (\d+)%/);return N(m[1])-N(m[2])-N(m[3])-N(m[4])*+m[5]/100;},
 'S6.i1':t=>{const m=m1(t,/today for \$([\d,]+)\. .*resell for \$([\d,]+)\. .*year for \$([\d,]+)\. The interest rate is (\d+)%/);const [R0,R1,rent,i]=[N(m[1]),N(m[2]),N(m[3]),+m[4]];return Math.max(R0*(1+i/100),R1+rent)-R1;},
 'S6.i2':t=>{const m=m1(t,/Finishing costs \$(\d+)M\. .*sells for \$(\d+)M, and the \$\d+M could fund road repairs worth \$(\d+)M/);return +m[2]+ +m[3];},
 S7a:t=>{const D=demP(t);return D.P(0);},
 S7b:t=>{const I=invD(t),q=+m1(t,/at q = ([\d,]+)/)[1].replace(/,/g,'');return deriv(x=>I.P(x)*x,q);},
 S7g:t=>{const I=invD(t),C=costOf(t),q=N(m1(t,/at q = ([\d,]+)/)[1]);return I.P(q)*q-C(q);},
 S7c:t=>{const D=t.includes('D(p)')?demP(t):invD(t),C=costOf(t);const q=monoQ(D.P,C,D.qmax);return /price/.test(t.split('?')[0].slice(-40))?D.P(q):q;},
 S7d:t=>{const I=invD(t),C=costOf(t);const q=monoQ(I.P,C,I.qmax);return /price\?/.test(t)?I.P(q):q;},
 'S7.i1':t=>{const D=demP(t),C=costOf(t);const q=monoQ(D.P,C,D.qmax);return D.P(q)*q-C(q);},
 'S7.i2':t=>{const I=invD(t),C=costOf(t);const q=monoQ(I.P,C,I.qmax);return I.P(q)*q-C(q);},
 S8a:t=>{const m=m1(t,/D\(p\) = (\d+) - (\d*)p\. .* p = (\d+)/);const A=+m[1],B=m[2]?+m[2]:1,p=+m[3];const D=x=>A-B*x;return deriv(D,p)*p/D(p);},
 S8c:t=>{const e=+m1(t,/elasticity (-?\d+(?:\.\d+)?)/)[1],dp=+m1(t,/(rises|falls) (\d+(?:\.\d+)?)%/)[2]*(/falls/.test(t)?-1:1);const D=p=>Math.pow(p,e);return (D(1+dp/1e4)/D(1)-1)*1e4/1;},
 S8d:t=>{const m=m1(t,/elasticity (-?\d+(?:\.\d+)?) at (?:the price )?\$(\d+(?:\.\d+)?), (?:at which price demand equals|where) ([\d,]+)(?: units)?.*?(?:sell|only) ([\d,]+) units/);const e=+m[1],p0=+m[2],q0=N(m[3]),q1=N(m[4]);return p0*(1+((q1-q0)/q0)/e);},
 S8e:t=>{const m=m1(t,/p\^\(-(\d+(?:\.\d+)?)\)\. .* p = (\d+)/);const D=p=>Math.pow(p,-+m[1]);return deriv(D,+m[2])*+m[2]/D(+m[2]);},
 'S8.i1':t=>{const e=+m1(t,/elasticity (-?\d+(?:\.\d+)?)/)[1],dp=+m1(t,/price (\d+(?:\.\d+)?)%/)[1];return dp+e*dp;},
 'S8.i2':t=>{const D=demP(t);return D.P(argmax(q=>D.P(q)*q,0,D.qmax));},
 S9a:t=>{const P=+m1(t,/charges \$(\d+)/)[1],e=+m1(t,/there is (-?\d+(?:\.\d+)?)/)[1];const k=Math.pow(P,-e);const qOf=p=>k*Math.pow(p,e);const pOf=q=>Math.pow(q/k,1/e);const q0=qOf(P);return deriv(q=>pOf(q)*q,q0);},
 S9b:t=>{const m=m1(t,/charges (\d+) with marginal cost (\d+)/);return (+m[1]-+m[2])/+m[1];},
 S9c:t=>{const c=+m1(t,/costs \$(\d+)/)[1],a=+m1(t,/elasticity -(\d+(?:\.\d+)?)/)[1];return argmax(p=>(p-c)*Math.pow(p,-a),c,c*20);},
 S9d:t=>{const m=m1(t,/charges (\d+) with marginal cost (\d+)/);const P=+m[1],c=+m[2];let lo=1.0001,hi=1000;for(let i=0;i<200;i++){const a=(lo+hi)/2;const pa=argmax(p=>(p-c)*Math.pow(p,-a),c,c*1e3);if(pa>P)lo=a;else hi=a;}return lo;},
 'S9.i1':t=>{const m=m1(t,/at \$(\d+); elasticity is (-?\d+(?:\.\d+)?); MC is \$(\d+(?:\.\d+)?).*producing ([\d,]+) instead of ([\d,]+)/);const P=+m[1],e=+m[2],mc=+m[3],dq=N(m[4])-N(m[5]);return (P*(1+1/e)-mc)*dq;},
 'S9.i2':t=>{const P=+m1(t,/charges \$(\d+)/)[1],e=+m1(t,/there is (-?\d+(?:\.\d+)?)/)[1];let lo=0,hi=P;for(let i=0;i<100;i++){const c=(lo+hi)/2;const pa=argmax(p=>(p-c)*Math.pow(p,e),c,c*50+P*5);if(pa<P)lo=c;else hi=c;}return lo;},
 S10a:t=>{const m=m1(t,/cost is (\d+)\. .* levies a (tax|subsidy) of (\d+)/);return m[2]==='tax'?+m[1]+ +m[3]:+m[1]-+m[3];},
 S10b:t=>{const I=invD(t),c=cMC(t);let m=t.match(/tax of (\d+)/);if(m){const tx=+m[1];return I.P(monoQ(I.P,q=>(c+tx)*q,I.qmax));}m=m1(t,/subsidy of (\d+)/);return monoQ(I.P,q=>(c-+m[1])*q,I.qmax);},
 S10c:t=>{const a=+m1(t,/elasticity -(\d+(?:\.\d+)?)/)[1],tx=+m1(t,/tax of (\d+(?:\.\d+)?)/)[1];const c=5;const p0=argmax(p=>(p-c)*Math.pow(p,-a),c,c*50),p1=argmax(p=>(p-c-tx)*Math.pow(p,-a),c+tx,(c+tx)*50);return p1-p0;},
 S10d:t=>{const I=invD(t),C=costOf(t),tx=+m1(t,/tax of (\d+)/)[1];return I.P(monoQ(I.P,q=>C(q)+tx*q,I.qmax))-I.P(monoQ(I.P,C,I.qmax));},
 'S10.i1':t=>{const I=invD(t),c=cMC(t),tx=+m1(t,/tax of (\d+)/)[1];return tx*monoQ(I.P,q=>(c+tx)*q,I.qmax);},
 S11b:t=>{const I=invD(t),c=cMC(t);const m=t.match(/(?:ceiling of|any price up to) (\d+)/);return ceilQ(I.P,q=>c*q,+m[1],I.qmax);},
 S11c:t=>{const I=invD(t),C=costOf(t),pb=+m1(t,/ceiling of (\d+)/)[1];return ceilQ(I.P,C,pb,I.qmax);},
 S11d:t=>{const I=invD(t),C=costOf(t),pb=+m1(t,/ceiling of (\d+)/)[1];const q=ceilQ(I.P,C,pb,I.qmax);return (I.a-pb)*I.B-q;},
 S11e:t=>{const I=invD(t),q=N(m1(t,/right of q = ([\d,]+)/)[1]);return (I.P(q+1e-3)*(q+1e-3)-I.P(q+2e-3)*(q+2e-3))/-1e-3;},
 'S11.i1':t=>{const I=invD(t),C=costOf(t);const qM=monoQ(I.P,C,I.qmax),pM=I.P(qM);let lo=0,hi=pM;for(let i=0;i<60;i++){const pb=(lo+hi)/2;if(ceilQ(I.P,C,pb,I.qmax)>qM+1e-4)hi=pb;else lo=pb;}return hi;},
 'S11.i2':t=>{const I=invD(t),C=costOf(t),pb=+m1(t,/ceiling of (\d+)/)[1];const q=ceilQ(I.P,C,pb,I.qmax);return Math.min(pb,I.P(q))*q-C(q);},
 S12a:t=>{const I=invD(t);let m=t.match(/falls from (\d+) to (\d+)/);const cs=p=>integ(q=>Math.max(0,I.P(q)-p),0,I.qmax);if(m)return cs(+m[2])-cs(+m[1]);return cs(+m1(t,/price is (\d+)/)[1]);},
 S12b:t=>{const p=+m1(t,/Price (\d+(?:\.\d+)?)/)[1],q=+m1(t,/quantity (\d+)/)[1];if(/constant marginal cost/.test(t)){const c=+m1(t,/marginal cost (\d+)/)[1];return (p-c)*q;}const C=costOf(t);return p*q-C(q);},
 S12c:t=>{const I=invD(t),c=cMC(t);return argmax(q=>integ(x=>I.P(x)-c,0,q),0,I.qmax);},
 S12d:t=>{const I=invD(t),c=cMC(t);const TS=q=>integ(x=>I.P(x)-c,0,q);return TS(argmax(TS,0,I.qmax))-TS(monoQ(I.P,q=>c*q,I.qmax));},
 S12f:t=>{const I=invD(t),c=cMC(t),m=m1(t,/from ([\d,.]+) to ([\d,.]+)\?/);return integ(x=>I.P(x)-c,N(m[1]),N(m[2]));},
 'S12.i1':t=>{const I=invD(t),C=costOf(t);const TS=q=>integ(x=>I.P(x),0,q)-C(q);return TS(argmax(TS,0,I.qmax))-TS(monoQ(I.P,C,I.qmax));},
 'S12.i2':t=>{const I=invD(t),C=costOf(t);const q=monoQ(I.P,C,I.qmax);return integ(x=>I.P(x),0,q)-C(q);},
 'S13.i1':t=>{const I=invD(t),c=+m1(t,/C\(q\) = (\d+)q/)[1];const q=monoQ(I.P,x=>c*x,I.qmax);return (I.P(q)-c)*q;},
 'S13.i2':t=>{const I=invD(t),c=+m1(t,/C\(q\) = (\d+)q/)[1];return integ(x=>Math.max(0,I.P(x)-c),0,I.qmax);},
 S14a:t=>{const c=+m1(t,/visitor is \$(\d+)/)[1];const who=/adult ticket/.test(t)?'A':'S';const a=+m1(t,new RegExp(`D_${who}\\(p\\) = [\\d]+·p\\^\\(-([\\d.]+)\\)`))[1];return argmax(p=>(p-c)*Math.pow(p,-a),c,c*30);},
 S14b:t=>{const c=+m1(t,/MC (\d+)/)[1],m=m1(t,/P1 = (\d+) - q1, P2 = (\d+) - q2/),g=+m1(t,/does group (\d) pay/)[1];const A=+m[g];const q=argmax(x=>(A-x-c)*x,0,A);return A-q;},
 S14c:t=>{const m=m1(t,/q1 = (\d+) - p and q2 = (\d+) - p\. .* p = (\d+)/);return Math.max(0,+m[1]-+m[3])+Math.max(0,+m[2]-+m[3]);},
 S14d:t=>{const c=+m1(t,/MC (\d+)/)[1],m=m1(t,/P1 = (\d+) - q1,? (?:and )?P2 = (\d+) - q2/);const A1=+m[1],A2=+m[2];return argmax(p=>(p-c)*(Math.max(0,A1-p)+Math.max(0,A2-p)),c,A1);},
 'S14.i1':t=>{const c=+m1(t,/MC (\d+)/)[1],m=m1(t,/P1 = (\d+) - q1, P2 = (\d+) - q2/);const A1=+m[1],A2=+m[2];const pd=argmax(p=>(p-c)*(A2-p),c,A2),pu=argmax(p=>(p-c)*(Math.max(0,A1-p)+Math.max(0,A2-p)),c,A1);const cs=p=>0.5*Math.max(0,A2-p)**2;return cs(pu)-cs(pd);},
 'S14.i2':t=>{const c=+m1(t,/MC (\d+)/)[1],m=m1(t,/P1 = (\d+) - q1, P2 = (\d+) - q2/);const A1=+m[1],A2=+m[2];const pr=A=>{const p=argmax(x=>(x-c)*(A-x),c,A);return (p-c)*(A-p);};const U=p=>(p-c)*(Math.max(0,A1-p)+Math.max(0,A2-p));return pr(A1)+pr(A2)-U(argmax(U,c,A1));},
 S15c:t=>{const d=m1(t,/δ = \((-?\d+), (-?\d+), (-?\d+)\)/).slice(1).map(Number),k=+m1(t,/person (\d)'s/)[1]-1;const D=d.reduce((a,b)=>a+b,0);return D/3-d[k];},
 'S15.i1':t=>{const m=m1(t,/d1 gives surpluses \((-?\d+), (-?\d+), (-?\d+)\); d2 gives \((-?\d+), (-?\d+), (-?\d+)\)\. .*person (\d)'s/);const v1=[1,2,3].map(i=>+m[i]),v2=[4,5,6].map(i=>+m[i]),k=+m[7]-1;const D=v1.reduce((a,b)=>a+b,0)-v2.reduce((a,b)=>a+b,0);return v1[k]+(D/3-(v1[k]-v2[k]));},
 'S15.i2':t=>{const m=m1(t,/up to \$(\d+) .* accept \$(\d+)/);return +m[1]-+m[2];},
 S16a:t=>{const m=m1(t,/by \+(\d+) and .* by (-\d+)\. Weights: g_C = (\d+(?:\.\d+)?), g_M = (\d+(?:\.\d+)?)/);return +m[3]*+m[1]+ +m[4]*+m[2];},
 S16b:t=>{const m=m1(t,/by (\d+) and lowers profit by (\d+)/);return +m[2]/+m[1];},
 'S16.i1':t=>{const m=m1(t,/country ([\d,]+) and costs the foreign firm ([\d,]+)/);return N(m[1])/N(m[2]);},
 'S16.i2':t=>{const I=invD(t),c=cMC(t);const q=monoQ(I.P,x=>c*x,I.qmax),pM=I.P(q);const cs=p=>integ(x=>Math.max(0,I.P(x)-p),0,I.qmax);return ((pM-c)*q)/(cs(c)-cs(pM));},
 // foreign monopoly: W(t) = CS + t·q
 _F:t=>{const I=invD(t),c=+m1(t,/marginal cost (\d+) per unit/)[1];const out=tx=>{const q=monoQ(I.P,x=>(c+tx)*x,I.qmax),p=I.P(q);return {q,p,cs:integ(x=>Math.max(0,I.P(x)-p),0,q),pi:(p-c-tx)*q};};return {I,c,out};},
 S17a:t=>{const F=ORACLE._F(t),o=F.out(0);return /profit does it earn/.test(t)?o.pi:/price maximizes/.test(t)?o.p:o.q;},
 S17b:t=>{const F=ORACLE._F(t);const tx=+m1(t,/tax of (\d+) per unit/)[1];const o=F.out(tx);const w=o.cs+tx*o.q;if(/change relative/.test(t)){const z=F.out(0);return w-z.cs;}return w;},
 S17c:t=>{const F=ORACLE._F(t);const s=+m1(t,/subsidy of (\d+) per unit/)[1];const o=F.out(-s);return o.cs-s*o.q;},
 S17d:t=>{const F=ORACLE._F(t);const pb=+m1(t,/ceiling of (\d+)/)[1],tx=+m1(t,/import tax of (\d+)/)[1];const q=ceilQ(F.I.P,x=>(F.c+tx)*x,pb,F.I.qmax);const p=Math.min(pb,F.I.P(q));return integ(x=>Math.max(0,F.I.P(x)-p),0,q)+tx*q;},
 S17e:t=>{const F=ORACLE._F(t);const pb=+m1(t,/ceiling of (\d+)/)[1],K=N(m1(t,/costs the firm ([\d,]+) per year/)[1]);let lo=0,hi=pb;for(let i=0;i<80;i++){const tx=(lo+hi)/2;const q=ceilQ(F.I.P,x=>(F.c+tx)*x,pb,F.I.qmax);const pi=Math.min(pb,F.I.P(q))*q-(F.c+tx)*q;if(pi>=K)lo=tx;else hi=tx;}return lo;},
 'S17.i2':t=>{const F=ORACLE._F(t);return argmax(tx=>{const o=F.out(tx);return o.cs+tx*o.q;},0,F.I.a);}
};
ORACLE['S2a*']=ORACLE.S2a;ORACLE['S4e*']=ORACLE.S4e;ORACLE['S7c*']=ORACLE.S7c;ORACLE['S8d*']=ORACLE.S8d;ORACLE['S9c*']=t=>{const c=+m1(t,/visitor is \$(\d+)/)[1],A=N(m1(t,/D\(p\) = ([\d,]+)·p/)[1]);const p=argmax(x=>(x-c)*A*x**-2,c,c*30);return A*p**-2;};
ORACLE['S14d*']=ORACLE.S14d;ORACLE['S10b*']=ORACLE.S10b;ORACLE['S11b*']=ORACLE.S11b;ORACLE['S12a*']=ORACLE.S12a;ORACLE['S17b*']=ORACLE.S17b;
// multiple-choice checks (the marked-correct option must match the brute-force verdict)
const MCO={
 S11a:t=>{const I=invD(t),c=cMC(t),pb=+m1(t,/ceiling of (\d+)/)[1];return I.P(monoQ(I.P,q=>c*q,I.qmax))>pb?'Yes':'No';},
 S13a:t=>{const I=invD(t),m=m1(t,/C\(q\) = (\d+)q \+ (\d+)/);return integ(x=>Math.max(0,I.P(x)-+m[1]),0,I.qmax)>+m[2]?'Yes':'No';},
 S13b:t=>{const I=invD(t),m=m1(t,/C\(q\) = (\d+)q \+ (\d+)/);const q=monoQ(I.P,x=>+m[1]*x,I.qmax);return (I.P(q)-+m[1])*q>+m[2]?'Yes':'No';},
 S7e:t=>{const m=m1(t,/values ([\d, ]+)\. Each unit costs (\d+)/);const v=m[1].split(',').map(Number),c=+m[2];let best=0,bp=0;for(const p of v){const pr=(p-c)*v.filter(x=>x>=p).length;if(pr>best){best=pr;bp=p;}}return String(bp);},
 S6b:t=>{const m=m1(t,/generate \$(\d+(?:\.\d+)?) million in revenue\. The same \$[\d.]+ million invested elsewhere would return \$(\d+(?:\.\d+)?) million/);return +m[1]>+m[2]?'Proceed':'Abandon and invest elsewhere';},
 'S17.i1':t=>{const F=ORACLE._F(t);const tx=+m1(t,/a tax of (\d+) per unit/)[1];const W=x=>{const o=F.out(x);return o.cs+x*o.q;};const opts=[['No interference',W(0)],[`A tax of ${tx} per unit`,W(tx)],[`A subsidy of ${tx} per unit`,W(-tx)]];return opts.reduce((a,b)=>b[1]>a[1]?b:a)[0];},
 'S4.i1':t=>{const rows=[...t.matchAll(/q = (\d+): P = (\d+), AC = (\d+)/g)].map(m=>[+m[1],+m[1]*(+m[2]-+m[3])]);return 'q = '+rows.reduce((a,b)=>b[1]>a[1]?b:a)[0];}
};
ORACLE.S12i=(t,raw)=>{const lab=[...raw.matchAll(/<text[^>]*text-anchor="(end|middle)"[^>]*>([\d,.]+)<\/text>/g)].map(m=>[m[1],N(m[2])]);const ps=lab.filter(x=>x[0]==='end').map(x=>x[1]),qs=lab.filter(x=>x[0]==='middle').map(x=>x[1]);const [a,pM,c]=ps,[qM,qS]=qs;const B=qS/(a-c);const P=q=>a-q/B;const q=argmax(x=>(P(x)-c)*x,0,a*B);
 if(/consumer surplus/.test(t))return integ(x=>P(x)-P(q),0,q);if(/dead-weight/.test(t))return integ(x=>P(x)-c,q,qS);return (P(q)-c)*q;};ORACLE['S12d*']=ORACLE.S12i;
MCO['S2.i2']=t=>{const v=[...t.matchAll(/\b([A-F]) (\d+)\b/g)].map(m=>[m[1],+m[2]]),S=+m1(t,/S = (\d)/)[1],p=+m1(t,/p̄ = (\d+)/)[1];const vv=v.map(x=>x[1]);const low=Math.min(...mcPrices(vv,S));const ok=v.filter(x=>x[1]>p&&x[1]<=low).map(x=>'Resident '+x[0]);return ok;};
MCO['S17.i3']=t=>{const c=+m1(t,/constant MC (\d+)/)[1],A=N(m1(t,/D\(p\) = ([\d,]+)·p/)[1]);const opt=tx=>argmax(p=>(p-c-tx)*A*p**-2,c+tx,(c+tx)*40);const W=tx=>{const p=opt(tx);return A/p+tx*A*p**-2;};const tx=/subsidy of 1/.test(t)?-1:1;return W(tx)>W(0)?'Yes':'No';};
MCO['S10.i2']=t=>{const tx=+m1(t,/tax of (\d+)/)[1];if(/constant elasticity/.test(t)){const a=+m1(t,/elasticity -(\d+(?:\.\d+)?)/)[1],c=5;const ce=argmax(p=>(p-c-tx)*p**-a,c+tx,(c+tx)*60)-argmax(p=>(p-c)*p**-a,c,c*60);const P=q=>20-q;const li=P(argmax(q=>(P(q)-c-tx)*q,0,20))-P(argmax(q=>(P(q)-c)*q,0,20));return ce>li+1e-6?'Constant elasticity':li>ce+1e-6?'Linear':'Same increase';}
 const C=costOf(t),P=q=>20-q;const r=P(argmax(q=>P(q)*q-C(q)-tx*q,0,20))-P(argmax(q=>P(q)*q-C(q),0,20)),k=P(argmax(q=>(P(q)-5-tx)*q,0,20))-P(argmax(q=>(P(q)-5)*q,0,20));return k>r+1e-6?'Constant MC':r>k+1e-6?'Rising MC':'Same increase';};
Object.assign(MCO,{
 S1b:t=>{const m=m1(t,/value \$([\d,]+), buyer's willingness to pay \$([\d,]+), price \$([\d,]+)/);const [s,b,p]=[N(m[1]),N(m[2]),N(m[3])];return p>b?'No: the buyer loses':p<s?'No: the seller loses':'Yes';},
 S1c:t=>{const S=+m1(t,/allocates (\d) apartments/)[1];const r=[...t.matchAll(/r(\d) = (\d+)/g)].map(x=>+x[2]);const w=m1(t,/Families ([\d, ]+) win/)[1].split(',').map(x=>+x-1);return w;},
 S1d:t=>{const S=+m1(t,/has (\d) apartments/)[1];const r=[...t.matchAll(/r(\d) = (-?\d+)/g)].map(x=>+x[2]);const ok=[];for(let R=Math.min(...r)-1;R<=Math.max(...r)+1;R+=0.5){const strict=r.filter(x=>x>R).length,ind=r.filter(x=>x===R).length;if(strict===S&&ind===0)ok.push(R);}return `${Math.min(...ok)-0.5} < R < ${Math.max(...ok)+0.5}`;},
 S2c:t=>{const v=[...t.matchAll(/\b([A-F]) (\d+)\b/g)].map(m=>+m[2]),S=+m1(t,/S = (\d)/)[1],p=+m1(t,/Is p = (\d+)/)[1];const gt=v.filter(x=>x>p).length,ge=v.filter(x=>x>=p).length;return gt>S?'No: too many strictly want one':ge<S?'No: too few are willing':'Yes';},
 S5e:t=>{const m=m1(t,/\(q = (\d+)\), a firm's price is (\d+) and average variable cost is (\d+)\. Its fixed cost of ([\d.,]+) is (sunk|avoidable)/);const q=+m[1],p=+m[2],avc=+m[3],F=N(m[4]);const prod=(p-avc)*q-F,shut=m[5]==='sunk'?-F:0;return prod>shut?'Produce':'Shut down';},
 S8b:t=>{const m=m1(t,/D\(p\) = (\d+) - (\d*)p\. At p = (\d+)/);const A=+m[1],B=m[2]?+m[2]:1,p=+m[3];const e=Math.abs(-B*p/(A-B*p));return Math.abs(e-1)<1e-9?'Unit elastic':e>1?'Elastic':'Inelastic';},
 S9e:t=>{const m=m1(t,/elasticity (-?\d+(?:\.\d+)?) at price \$(\d+).*MC at [\d,]+ units is \$(\d+(?:\.\d+)?)/);const e=+m[1],P=+m[2],mc=+m[3],q=N(m1(t,/sells ([\d,]+) units/)[1]);const k=q*P**-e;const pOf=x=>(x/k)**(1/e);const mr=(pOf(q*1.000001)*q*1.000001-pOf(q)*q)/(q*1e-6);return (mr>mc?'More than':'Less than')+' '+q.toLocaleString('en-US');},
 S15b:t=>{const d=m1(t,/by \((-?\d+), (-?\d+), (-?\d+)\)/).slice(1).map(Number);const s=d.reduce((a,b)=>a+b,0);return d.every(x=>x>=0)&&d.some(x=>x>0)?'Pareto improvement':s>0?'Kaldor–Hicks improvement, not a Pareto improvement':'Neither';},
 S15a:t=>{const m=m1(t,/x = \((-?\d+), (-?\d+), (-?\d+)\), y = \((-?\d+), (-?\d+), (-?\d+)\)/);const x=[1,2,3].map(i=>+m[i]),y=[4,5,6].map(i=>+m[i]);const ge=x.every((v,i)=>v>=y[i]),le=x.every((v,i)=>v<=y[i]);return ge&&le?'Pareto indifferent':ge?'x Pareto dominates y':le?'y Pareto dominates x':'Pareto noncomparable';}});
// ===== v5 additions: competitive markets (Classes 7–8, Week 4). Each oracle re-solves from the question text. =====
const slopeOf=s=>s==='q'?1:/^q\//.test(s)?1/N(s.slice(2)):N(s.replace('q',''));
function linMkt(t){const d=m1(t,/Pᵈ\(q\) = ([\d.,]+) - (q(?:\/[\d.,]+)?|[\d.]+q)/),s=m1(t,/Pˢ\(q\) = (?:([\d.,]+) \+ )?(q(?:\/[\d.,]+)?|[\d.]+q)/);
 const a=N(d[1]),b=slopeOf(d[2]),e=s[1]?N(s[1]):0,g=slopeOf(s[2]);const Pd=q=>a-b*q,Ps=q=>e+g*q;
 const root=(fn,lo,hi)=>{for(let i=0;i<200;i++){const c=(lo+hi)/2;if(fn(lo)*fn(c)<=0)hi=c;else lo=c;}return (lo+hi)/2;};const qmax=a/b;
 const q0=root(q=>Pd(q)-Ps(q),0,qmax);return {Pd,Ps,q0,p0:Pd(q0),qmax,root,D:p=>root(q=>Pd(q)-p,0,qmax),S:p=>root(q=>Ps(q)-p,0,1e9)};}
const vcons=t=>[...t.matchAll(/v(\d)?\(q\) = (\d+)q - q²\/2/g)].map(m=>+m[2]);
const cfirm=s=>{const m=s.match(/^q²(\/(\d))?$/);const k=m[2]?+m[2]:1;return q=>q*q/k;};
const firms=t=>[...t.matchAll(/c(\d)?\(q\) = (q²(?:\/\d)?)/g)].map(m=>cfirm(m[2]));
const bis=(fn,lo,hi)=>{for(let i=0;i<300;i++){const c=(lo+hi)/2;if(fn(lo)*fn(c)<=0)hi=c;else lo=c;}return (lo+hi)/2;};
const shiftOf=t=>{const m=m1(t,/(cuts|raises) supply by (\d+)% at every price/);return (m[1]==='cuts'?-1:1)*+m[2];};
const NUM='(-?\\d+(?:\\.\\d+)?)';
const elastD=t=>+m1(t,new RegExp(`(?:elasticity of demand (?:for a good )?is|demand has elasticity|demand elasticity) ${NUM}`,'i'))[1];
const elastS=t=>{const m=t.match(new RegExp(`(?:elasticity of supply is|supply has elasticity) ${NUM}`,'i'));return m?+m[1]:null;};
const approxX=(s,eD,eS)=>bis(x=>eD*x-(s+eS*x),-1e4,1e4);
const level=t=>{const m=m1(t,/p0 = \$([\d.]+) per .*? and q0 = ([\d,.]+)/);return {p0:+m[1],q0:N(m[2])};};
const tasks=t=>{const A=N(m1(t,/D\(p\) = ([\d,]+)·p\^\(-([\d.]+)\)/)[1]),eps=+m1(t,/p\^\(-([\d.]+)\)/)[1],w=+m1(t,/\$(\d+) (?:per (?:worker-)?day|per worker-day)/)[1];return {A,eps,w,L:al=>argmax(q=>-Math.abs(q-A*(w/al)**-eps),0,A*10)/al};};
Object.assign(ORACLE,{
 S18a:t=>{const m=m1(t,/There are (\d+) consumers, .*v\(q\) = (\d+)q - q²\/2.*price p = (\d+)/);const v=q=>+m[2]*q-q*q/2;return +m[1]*argmax(q=>v(q)-+m[3]*q,0,1e3);},
 S18b:t=>{const m=m1(t,/There are (\d+) firms, each with cost c\(q\) = (q²(?:\/\d)?)\. At price p = (\d+)/);const c=cfirm(m[2]);return +m[1]*argmax(q=>+m[3]*q-c(q),0,1e3);},
 _E:t=>{const m=m1(t,/(\d+) identical consumers each have v\(q\) = (\d+)q - q²\/2; (\d+) identical firms each have c\(q\) = (q²(?:\/\d)?)/);let n=+m[1];const a=+m[2],mm=+m[3],c=cfirm(m[4]);const r=t.match(/consumers rises to (\d+)/);if(r)n=+r[1];
  const qd=p=>argmax(q=>a*q-q*q/2-p*q,0,a),qs=p=>argmax(q=>p*q-c(q),0,1e3);const p=bis(x=>n*qd(x)-mm*qs(x),0,a);return {n,a,mm,c,p,qd,qs};},
 S18c:t=>{const E=ORACLE._E(t);return /price\?/.test(t)?E.p:/total quantity/.test(t)?E.n*E.qd(E.p):E.qd(E.p);},
 S18d:t=>{const m=m1(t,/P̃\(x\) = ([\d.]+) - \(([\d,.]+) \+ x\)\/(\d+)\. .*at x = (\d+)/);const P=x=>+m[1]-(N(m[2])+x)/+m[3];const x=+m[4];const eP=deriv(P,x)*x/P(x);return 1/eP;},
 'S18.i1':t=>{const E=ORACLE._E(t);const x=E.qs(E.p),others=(E.mm-1)*x;const P=X=>bis(p=>E.n*E.qd(p)-X,0,E.a);const Pt=y=>P(others+y);const h=x*0.01;const eP=(Pt(x+h)-Pt(x-h))/(2*h)*x/Pt(x);return 100*Math.abs(eP);},
 'S18.i2':t=>{const E=ORACLE._E(t);const q=E.qd(E.p);return E.n*(E.a*q-q*q/2-E.p*q);},
 S19a:t=>approxX(shiftOf(t),elastD(t),elastS(t)),
 'S19a*':t=>approxX(shiftOf(t),elastD(t),elastS(t)),
 S19b:t=>{const eD=elastD(t);return eD*approxX(shiftOf(t),eD,elastS(t));},
 S19c:t=>{const L=level(t),eD=elastD(t),x=approxX(shiftOf(t),eD,elastS(t));return /new equilibrium price/.test(t)?L.p0*(1+x/100):L.q0*(1+eD*x/100);},
 S19d:t=>{const L=level(t),eD=elastD(t),x=approxX(shiftOf(t),eD,elastS(t));const pa=L.p0*(1+x/100),qa=L.q0*(1+eD*x/100);const Pd=q=>L.p0+(pa-L.p0)*(q-L.q0)/(qa-L.q0);return Math.abs(integ(q=>Math.max(0,Pd(q)-Math.min(L.p0,pa)),0,Math.max(L.q0,qa))-integ(q=>Math.max(0,Pd(q)-Math.max(L.p0,pa)),0,Math.max(L.q0,qa)));},
 'S19.i1':t=>{const L=level(t),eD=elastD(t),x=approxX(shiftOf(t),eD,elastS(t));return L.p0*(1+x/100)*L.q0*(1+eD*x/100)-L.p0*L.q0;},
 'S19.i2':t=>{const s=shiftOf(t),eD=elastD(t),x=+m1(t,/rises by about ([\d.]+)%/)[1];return bis(eS=>approxX(s,eD,eS)-x,0.001,50);},
 S20a:t=>{const m=m1(t,/wage of \$(\d+) and produces α = (\d+)/);return bis(p=>p*+m[2]-+m[1],0,1e4);},
 S20b:t=>{const T2=tasks(t),al=+m1(t,/produces α = (\d+)/)[1];return T2.A*(T2.w/al)**-T2.eps;},
 S20c:t=>{const T2=tasks(t),al=+m1(t,/produces α = (\d+)/)[1];return T2.A*(T2.w/al)**-T2.eps/al;},
 S20d:t=>{const eps=+m1(t,/p\^\(-([\d.]+)\)/)[1],x=+m1(t,/rises by (\d+)%/)[1];const L=al=>al**(eps-1);const h=1e-6;return (Math.log(L(1+h))-Math.log(L(1)))/h*x;},
 'S20.i1':t=>{const T2=tasks(t);const m=m1(t,/from α = (\d+) to α = (\d+)/);const L=al=>T2.A*(T2.w/al)**-T2.eps/al;return L(+m[2])-L(+m[1]);},
 'S20.i2':t=>{const eps=+m1(t,/p\^\(-([\d.]+)\)/)[1];const L=al=>al**eps/al;return deriv(x=>Math.log(L(Math.exp(x))),0);},
 S21a:t=>{const [a1,a2]=vcons(t),Q=+m1(t,/There are (\d+) units in total/)[1];return argmax(q=>a1*q-q*q/2+a2*(Q-q)-(Q-q)**2/2,0,Q);},
 S21b:t=>{const [c1,c2]=firms(t),Q=+m1(t,/must produce (\d+) units/)[1];return argmax(q=>-(c1(q)+c2(Q-q)),0,Q);},
 S21c:t=>{const [a1,a2]=vcons(t),Q=+m1(t,/and (\d+) units are available/)[1];const q=argmax(x=>a1*x-x*x/2+a2*(Q-x)-(Q-x)**2/2,0,Q);return a1-q;},
 'S21.i1':t=>{const [a1,a2]=vcons(t),[c1,c2]=firms(t);const qd=(a,p)=>argmax(q=>a*q-q*q/2-p*q,0,a),qs=(c,p)=>argmax(q=>p*q-c(q),0,1e3);return bis(p=>qd(a1,p)+qd(a2,p)-qs(c1,p)-qs(c2,p),0,Math.max(a1,a2));},
 'S21.i2':t=>{const [a1,a2]=vcons(t),Q=+m1(t,/of the (\d+) available units/)[1];const G=q=>a1*q-q*q/2+a2*(Q-q)-(Q-q)**2/2;return G(argmax(G,0,Q))-G(Q/2);},
 S22a:t=>{const M=linMkt(t),pF=+m1(t,/price floor of pF = (\d+)/)[1];const qF=M.D(pF);return /excess supply/.test(t)?M.S(pF)-qF:qF;},
 S22b:t=>{const M=linMkt(t),pF=+m1(t,/floor is set at (\d+)/)[1];const qF=M.D(pF);return integ(q=>M.Pd(q)-M.Ps(q),qF,M.q0);},
 S22c:t=>{const M=linMkt(t),pF=+m1(t,/floor is set at (\d+)/)[1];const qF=M.D(pF);if(/producers' surplus change/.test(t))return integ(q=>pF-M.Ps(q),0,qF)-integ(q=>M.p0-M.Ps(q),0,M.q0);return integ(q=>Math.max(0,M.Pd(q)-M.p0),0,M.qmax)-integ(q=>Math.max(0,M.Pd(q)-pF),0,M.qmax);},
 'S22.i1':t=>{const M=linMkt(t),pF=+m1(t,/floor is set at (\d+)/)[1];return (pF-M.p0)*M.D(pF);},
 _T:t=>{const M=linMkt(t),tx=+m1(t,/A tax of (\d+) per unit/)[1];const qT=M.root(q=>M.Pd(q)-M.Ps(q)-tx,0,M.q0);return {M,tx,qT,pd:M.Pd(qT),ps:M.Ps(qT)};},
 S23a:t=>ORACLE._T(t).qT,
 'S23a*':t=>{const o=ORACLE._T(t);return o.M.q0-o.qT;},
 S23b:t=>{const o=ORACLE._T(t);return /buyers pay/.test(t)?o.pd:o.ps;},
 S23c:t=>{const o=ORACLE._T(t);return /What percent/.test(t)?100*(o.pd-o.M.p0)/o.tx:(o.pd-o.M.p0)*o.qT;},
 S23d:t=>{const o=ORACLE._T(t);return /tax revenue/.test(t)?o.tx*o.qT:integ(q=>o.M.Pd(q)-o.M.Ps(q),o.qT,o.M.q0);},
 'S23.i1':t=>{const N0=N(m1(t,/has ([\d,]+) apartments/)[1]),m=m1(t,/Pᵈ\(q\) = ([\d,]+) - q\/(\d+)/);const Pd=q=>N(m[1])-q/+m[2];
  const z=t.match(/rises to ([\d,]+)/);if(z)return Pd(N(z[1]));const s=+m1(t,/subsidy of \$(\d+)/)[1];const rentL=bis(r=>(r-s)-Pd(N0),0,1e6);return /net of the subsidy/.test(t)?rentL-s:rentL-Pd(N0);},
 'S23.i2':t=>ORACLE._T(t).ps,
 S24a:t=>{const L=level(t),s=shiftOf(t);const qs=L.q0*(1+s/100);return /quantity is supplied/.test(t)?qs:L.q0-qs;},
 _Q:t=>{const L=level(t),s=shiftOf(t),eD=elastD(t);const qs=L.q0*(1+s/100);const pf=bis(p=>eD*(p-L.p0)/L.p0-(qs-L.q0)/L.q0,L.p0,L.p0*100);return {L,s,eD,qs,pf};},
 S24b:t=>{const o=ORACLE._Q(t);return /full price per unit\?/.test(t)?o.pf:o.pf-o.L.p0;},
 S24c:t=>{const m=m1(t,/at \$(\d+) per hour and buy (\d+) gallons.*\$([\d.]+) per gallon/);return +m[3]*+m[2]/+m[1]*60;},
 S24d:t=>{const o=ORACLE._Q(t);return (o.pf-o.L.p0)*o.qs;},
 'S24.i1':t=>{const o=ORACLE._Q(t),x=approxX(o.s,o.eD,elastS(t));return o.pf-o.L.p0*(1+x/100);},
 'S24.i2':t=>{const p0=+m1(t,/sells at \$([\d.]+) per gallon/)[1],eD=elastD(t),cut=+m1(t,/cuts supply (\d+)%/)[1],m=m1(t,/at \$(\d+) per hour and buy (\d+) gallons/);
  const pf=bis(p=>eD*(p-p0)/p0+cut/100,p0,p0*100);return (pf-p0)*+m[2]/+m[1]*60;}
});
ORACLE['S18c*']=ORACLE.S18c;
Object.assign(MCO,{
 S20e:t=>{const eps=+m1(t,/p\^\(-([\d.]+)\)/)[1];const L=al=>al**(eps-1);const r=L(2)/L(1);return Math.abs(r-1)<1e-9?'Employment is unchanged':r>1?'Employment rises':'Employment falls';},
 'S22.i2':t=>{const M=linMkt(t),pF=+m1(t,/floor is set at (\d+)/)[1];const qF=M.D(pF);const d=integ(q=>pF-M.Ps(q),0,qF)-integ(q=>M.p0-M.Ps(q),0,M.q0);return d>0?"Yes: producers' surplus rises":"No: producers' surplus falls";}
});


// v5: math toolkit for the Risk weeks
const gam=t=>[...t.matchAll(/\$([\d,]+) with probability (\d+(?:\.\d+)?)/g)].map(m=>[N(m[1]),+m[2]]);
ORACLE.S0i=t=>gam(t).reduce((a,[x,p])=>a+x*p,0);
ORACLE.S0j=t=>{const g=gam(t);const e=g.reduce((a,[x,p])=>a+x*p,0);return g.reduce((a,[x,p])=>a+p*(x-e)**2,0);};
module.exports={ORACLE,MCO,T,close};
