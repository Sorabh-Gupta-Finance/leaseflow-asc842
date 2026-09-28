import assert from 'node:assert/strict';
import {sample,calculate,validate,journals,initialJournals,round2,extract,csv} from './dist/engine.mjs';
const close=(a,b,t=.000001)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
let c=calculate(sample);
close(c.totalCash,3483000);close(c.straightLine,95416.66666666667);
close(c.initialROU,c.initialLiability-48000);
assert.deepEqual(c.rows.slice(0,3).map(x=>x.payment),[0,0,0]);
close(c.rows[3].payment,100000);close(c.rows[12].payment,105000);close(c.rows[24].payment,110250);
close(c.rows.at(-1).closeLiability,0);close(c.rows.at(-1).closeROU,0);
close(c.rows[3].currentLiability,c.rows[3].closeLiability-c.rows[15].closeLiability);
const simple={...sample,months:24,free:0,escalation:0,idc:0,incentive:0};const s=calculate(simple),rate=simple.rate/1200;
close(s.initialLiability,simple.rent*(1-(1+rate)**-24)/rate);
const zero=calculate({...simple,rate:0});close(zero.initialLiability,simple.rent*24);close(zero.rows[0].interest,0);
let tested=0;
for(const config of [sample,{...sample,type:'finance'},simple,{...simple,rate:0},{...sample,months:120,free:24,rate:25,escalation:12},{...sample,months:1,free:0,rate:0,incentive:0,idc:0},{...sample,prepayment:17393.23,idc:2153.21,incentive:1435.55}]){
 const v=calculate(config);
 for(const route of ['liability','expense']){
 let ll=round2(v.initialLiability),rou=round2(v.initialROU),pnl=0;
 for(const r of v.rows){
  close(r.openLiability+r.interest-r.payment,r.closeLiability);close(r.openROU-r.amortization,r.closeROU);
  const js=journals(config,r,route),groups={};for(const j of js)(groups[j.event]??=[]).push(j);
  for(const rows of Object.values(groups))close(rows.reduce((s,j)=>s+j.debit-j.credit,0),0,.001);
  const lm=js.filter(x=>x.account.startsWith('220100')).reduce((s,x)=>s+x.credit-x.debit,0);ll=round2(ll+lm);
  const rm=js.filter(x=>x.account.startsWith('150110')).reduce((s,x)=>s+x.credit-x.debit,0);rou=round2(rou-rm);
  close(ll,round2(r.closeLiability),.001);close(rou,round2(r.closeROU),.001);tested++;
 }
 close(ll,0,.001);close(rou,0,.001);
 const init=initialJournals(config,v);close(init.reduce((s,j)=>s+j.debit-j.credit,0),0,.001);
 }
}
assert.ok(validate({...sample,months:0}).length);assert.ok(validate({...sample,start:'2026-02-30'}).length);assert.ok(validate({...sample,start:'2026-01-15'}).length);
assert.throws(()=>calculate({...sample,incentive:100000000}),/negative/);
assert.equal(extract(['unstructured unsupported PDF']).missing.length,8);
assert.match(csv([{a:'=SUM(A1)',b:2}]),/"'=SUM/);
console.log(JSON.stringify({result:'passed',monthlyJournalChecks:tested,scenarios:7,sample:{initialLiability:c.initialLiability,initialROU:c.initialROU,monthlyExpense:c.straightLine}}));
