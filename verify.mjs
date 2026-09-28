import assert from 'node:assert/strict';
import {sample,calculate,validate,journals,initialJournals,reclassJournalRows,round2,extract,csv} from './dist/engine.mjs';
const close=(a,b,t=.000001)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
let c=calculate(sample);
close(c.totalCash,3483000);close(c.straightLine,95416.66666666667);
close(c.initialROU,c.initialLiability-48000);
assert.deepEqual(c.rows.slice(0,3).map(x=>x.payment),[0,0,0]);
close(c.rows[3].payment,100000);close(c.rows[12].payment,105000);close(c.rows[24].payment,110250);
close(c.rows.at(-1).closeLiability,0);close(c.rows.at(-1).closeROU,0);
close(c.rows[3].currentLiability,c.rows[3].closeLiability-c.rows[15].closeLiability);
// PV working: each row's discounted cash flow sums to the initial liability, and ties to a plain NPV.
close(c.rows.reduce((s,x)=>s+x.presentValue,0),c.initialLiability,.0001);
close(c.rows[3].presentValue,c.rows[3].payment*c.rows[3].discountFactor,1e-9);
close(c.periodicRate,sample.rate/1200);
// Current/noncurrent: the opening split at commencement foots to the initial liability.
close(c.initialCurrentLiability+c.initialNoncurrentLiability,c.initialLiability,.0001);
assert.ok(c.initialCurrentLiability>=0&&c.initialNoncurrentLiability>=0);
const simple={...sample,months:24,free:0,escalation:0,idc:0,incentive:0};const s=calculate(simple),rate=simple.rate/1200;
close(s.initialLiability,simple.rent*(1-(1+rate)**-24)/rate);
const zero=calculate({...simple,rate:0});close(zero.initialLiability,simple.rent*24);close(zero.rows[0].interest,0);
let tested=0;
for(const config of [sample,{...sample,type:'finance'},simple,{...simple,rate:0},{...sample,months:120,free:24,rate:25,escalation:12},{...sample,months:1,free:0,rate:0,incentive:0,idc:0},{...sample,prepayment:17393.23,idc:2153.21,incentive:1435.55}]){
 const v=calculate(config);
 for(const route of ['liability','expense']){
 let ll=round2(v.initialLiability),rou=round2(v.initialROU),pnl=0;
 let glCurrent=round2(v.initialCurrentLiability),glNoncurrent=round2(v.initialNoncurrentLiability);
 for(const r of v.rows){
  close(r.openLiability+r.interest-r.payment,r.closeLiability);close(r.openROU-r.amortization,r.closeROU);
  const js=journals(config,r,route),groups={};for(const j of js)(groups[j.event]??=[]).push(j);
  for(const rows of Object.values(groups))close(rows.reduce((s,j)=>s+j.debit-j.credit,0),0,.001);
  const lm=js.filter(x=>x.account.startsWith('220101')).reduce((s,x)=>s+x.credit-x.debit,0);ll=round2(ll+lm);
  const rm=js.filter(x=>x.account.startsWith('150110')).reduce((s,x)=>s+x.credit-x.debit,0);rou=round2(rou-rm);
  close(ll,round2(r.closeLiability),.001);close(rou,round2(r.closeROU),.001);
  // Current/noncurrent reclass: the same 220101 movement lands the current bucket here first,
  // then the reclass entry (if any) trues it up to the schedule's target split, leaving the
  // control total (current+noncurrent) unchanged and equal to the closing liability.
  glCurrent=round2(glCurrent+lm);
  const rc=reclassJournalRows(config,r);close(rc.reduce((s,j)=>s+j.debit-j.credit,0),0,.001);
  const curMove=rc.filter(x=>x.account.startsWith('220101')).reduce((s,x)=>s+x.credit-x.debit,0);
  glCurrent=round2(glCurrent+curMove);glNoncurrent=round2(glNoncurrent-curMove);
  // journals() rounds each period's interest/payment movement to cents, while the schedule's
  // own currentLiability is full precision; the current/noncurrent split is a difference of
  // differences, so it can amplify that chained rounding by a couple of cents at extreme
  // parameters (confirmed bounded and self-correcting over a 120-month/25% run, never growing
  // unbounded). Same class of noise the UI itself documents ("Rounding can produce 0.01
  // differences between displayed columns"); this tolerance just gives it headroom.
  close(glCurrent,round2(r.currentLiability),.03);close(glNoncurrent,round2(r.noncurrentLiability),.03);
  close(glCurrent+glNoncurrent,round2(r.closeLiability),.001);
  tested++;
 }
 close(ll,0,.001);close(rou,0,.001);close(glCurrent,0,.03);close(glNoncurrent,0,.03);
 const init=initialJournals(config,v);close(init.reduce((s,j)=>s+j.debit-j.credit,0),0,.001);
 }
}
assert.ok(validate({...sample,months:0}).length);assert.ok(validate({...sample,start:'2026-02-30'}).length);assert.ok(validate({...sample,start:'2026-01-15'}).length);
assert.throws(()=>calculate({...sample,incentive:100000000}),/negative/);
assert.equal(extract(['unstructured unsupported PDF']).missing.length,8);
assert.match(csv([{a:'=SUM(A1)',b:2}]),/"'=SUM/);
console.log(JSON.stringify({result:'passed',monthlyJournalChecks:tested,scenarios:7,sample:{initialLiability:c.initialLiability,initialROU:c.initialROU,monthlyExpense:c.straightLine}}));
