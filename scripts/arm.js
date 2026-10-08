// usage: node arm.js <n> <arm> <seedFrom> <seedTo>
const P=require('../src/squares/sim.js');const fs=require('fs');
const [n,arm,s0,s1]=[+process.argv[2],process.argv[3],+process.argv[4],+process.argv[5]];
const ARMS={rigid:{mode:'rigid',anneal:false},rigid_anneal:{mode:'rigid',anneal:true},blob:{mode:'naive',anneal:false},blob_anneal:{mode:'improved',anneal:true},octagon_anneal:{mode:'octagon',anneal:true}};
const F=`arms/${n}_${arm}_${s0}_${s1}.jsonl`;fs.writeFileSync(F,'');
for(let s=s0;s<=s1;s++){const t0=Date.now();const r=P.run(Object.assign({n,seed:s,compact:5000,morph:45000,settle:3000,recEvery:1e9},ARMS[arm]));
 fs.appendFileSync(F,JSON.stringify({n,arm,seed:s,side:r.side,ms:Date.now()-t0,X:r.final.X,Y:r.final.Y,T:r.final.T})+'\n');}
