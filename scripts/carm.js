// usage: node carm.js <n> <arm: blob|rigid> <seedFrom> <seedTo> [budget=3]
const P=require('../src/cubes/sim3.js');const fs=require('fs');
const [n,arm,s0,s1,B]=[+process.argv[2],process.argv[3],+process.argv[4],+process.argv[5],+(process.argv[6]||3)];
const steps={3:{compact:5000,morph:45000,settle:3000},10:{compact:15000,morph:150000,settle:8000}}[B];
const F=`cube/${n}_${arm}_x${B}_${s0}_${s1}.jsonl`;fs.writeFileSync(F,'');
for(let s=s0;s<=s1;s++){const t0=Date.now();
 const r=P.run(Object.assign({n,seed:s,mode:arm==='blob'?'improved':'rigid',anneal:true,recEvery:1e9},steps));
 fs.appendFileSync(F,JSON.stringify({n,arm,B,seed:s,side:r.side,ms:Date.now()-t0,C:r.final.C,Q:r.final.Q})+'\n');}
