// usage: node sarm.js <n> <budget: 5|10> <seedFrom> <seedTo>
const P=require('../src/squares/sim.js');const fs=require('fs');
const [n,B,s0,s1]=process.argv.slice(2).map(Number);
const cfg={3:{compact:5000,morph:45000,settle:3000},5:{compact:8000,morph:75000,settle:5000},10:{compact:15000,morph:150000,settle:8000}}[B];
const F=`scale/${n}_x${B}_${s0}_${s1}.jsonl`;fs.writeFileSync(F,'');
for(let s=s0;s<=s1;s++){const t0=Date.now();const r=P.run(Object.assign({n,seed:s,mode:'improved',anneal:true,recEvery:1e9},cfg));
 fs.appendFileSync(F,JSON.stringify({n,B,seed:s,side:r.side,ms:Date.now()-t0,X:r.final.X,Y:r.final.Y,T:r.final.T})+'\n');}
