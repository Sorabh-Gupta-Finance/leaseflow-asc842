export const sample = {entity:'Aster Software India Pvt Ltd',leaseId:'DEMO-001',currency:'INR',start:'2026-01-01',months:36,rent:100000,escalation:5,free:3,rate:8,prepayment:0,incentive:60000,idc:12000,type:'operating'};
export function validate(a){
 const errors=[];
 for(const k of ['months','rent','escalation','free','rate','prepayment','incentive','idc']) if(!Number.isFinite(+a[k])) errors.push(`${k}: enter a number.`);
 if(!Number.isInteger(+a.months)||a.months<1||a.months>120)errors.push('Term must be 1–120 whole months.');
 if(!Number.isInteger(+a.free)||a.free<0||a.free>=a.months)errors.push('Free months must be a whole number below the lease term.');
 if(a.rent<=0||a.rent>1e9)errors.push('Monthly rent must be above zero and at most 1 billion.');
 if(a.rate<0||a.rate>30)errors.push('Annual nominal discount rate must be 0–30%.');
 if(a.escalation<0||a.escalation>25)errors.push('Annual increase must be 0–25%.');
 for(const k of ['prepayment','incentive','idc'])if(a[k]<0||a[k]>1e9)errors.push(`${k}: enter an amount from 0 to 1 billion.`);
 if(!/^\d{4}-\d{2}-01$/.test(a.start)||!Number.isFinite(Date.parse(a.start+'T00:00:00Z'))||new Date(a.start+'T00:00:00Z').toISOString().slice(0,10)!==a.start)errors.push('This demo supports commencement on the first day of a calendar month.');
 if(!['INR','USD','EUR','GBP'].includes(a.currency))errors.push('Unsupported currency.');
 if(!['operating','finance'].includes(a.type))errors.push('Select operating or finance.');
 if(!a.entity?.trim())errors.push('Enter the lessee entity.');
 return errors;
}
export function calculate(a){
 const errors=validate(a);if(errors.length)throw Error(errors.join(' '));
 const n=+a.months,r=+a.rate/1200;
 const payments=Array.from({length:n},(_,i)=>i<a.free?0:round2(+a.rent*(1+a.escalation/100)**Math.floor(i/12)));
 const initialLiability=payments.reduce((s,p,i)=>s+p/(1+r)**(i+1),0);
 const totalCash=payments.reduce((s,x)=>s+x,0);
 const initialROU=initialLiability+(+a.prepayment)-(+a.incentive)+(+a.idc);
 if(initialROU<0)throw Error('ROU asset would be negative. This scenario requires technical review and is outside demo scope.');
 const straightLine=(totalCash+(+a.prepayment)-(+a.incentive)+(+a.idc))/n;
 let liability=initialLiability,rou=initialROU;
 const rows=payments.map((payment,i)=>{
   const start=new Date(a.start+'T00:00:00Z');
   const date=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+i+1,0)).toISOString().slice(0,10);
   const openLiability=liability,interest=openLiability*r;
   liability=openLiability+interest-payment;
   if(Math.abs(liability)<1e-7)liability=0;
   const openROU=rou,amortization=a.type==='operating'?straightLine-interest:initialROU/n;
   rou=openROU-amortization;if(Math.abs(rou)<1e-7)rou=0;
   const discountFactor=1/(1+r)**(i+1);
   return {month:i+1,date,payment,discountFactor,presentValue:payment*discountFactor,openLiability,interest,closeLiability:liability,openROU,amortization,closeROU:rou,expense:a.type==='operating'?straightLine:interest+amortization};
 });
 rows.forEach((x,i)=>{
   const later=rows[Math.min(i+12,rows.length-1)].closeLiability;
   x.currentLiability=Math.max(0,x.closeLiability-later);
   x.noncurrentLiability=x.closeLiability-x.currentLiability;
   if(Math.abs(x.noncurrentLiability)<1e-7)x.noncurrentLiability=0;
 });
 const initialCurrentLiability=Math.max(0,initialLiability-rows[Math.min(11,rows.length-1)].closeLiability);
 const initialNoncurrentLiability=initialLiability-initialCurrentLiability;
 rows.forEach((x,i)=>{
   x.priorCurrentLiability=i===0?initialCurrentLiability:rows[i-1].currentLiability;
   x.reclassAmount=round2(x.currentLiability-x.priorCurrentLiability-x.interest+x.payment);
 });
 return {initialLiability,initialROU,totalCash,straightLine,periodicRate:r,initialCurrentLiability,initialNoncurrentLiability,totalExpense:rows.reduce((s,x)=>s+x.expense,0),rows};
}
export function round2(n){return Math.round((n+Number.EPSILON)*100)/100;}
export function journals(a,row,route='liability'){
 const out=[];
 const add=(event,account,dr,cr)=>{if(Math.abs(dr)+Math.abs(cr)<.005)return;out.push({date:row.date,leaseId:a.leaseId,entity:a.entity,currency:a.currency,event,account,debit:round2(dr),credit:round2(cr)});};
 const movement=(event,account,credit)=>add(event,account,credit<0?-credit:0,credit>0?credit:0);
 const interest=round2(round2(row.closeLiability)-round2(row.openLiability)+round2(row.payment));
 const amort=round2(round2(row.openROU)-round2(row.closeROU));
 const expense=round2(interest+amort);
 if(a.type==='operating'){
 add('MONTHLY-MEASUREMENT','610100 · Operating lease expense',expense,0);
 movement('MONTHLY-MEASUREMENT','220101 · Lease liability – current portion',interest);
 movement('MONTHLY-MEASUREMENT','150110 · Accumulated ROU reduction',amort);
 }else{
 add('MONTHLY-INTEREST','710100 · Finance lease interest',interest,0);movement('MONTHLY-INTEREST','220101 · Lease liability – current portion',interest);
 add('MONTHLY-AMORTIZATION','610200 · ROU amortization expense',amort,0);movement('MONTHLY-AMORTIZATION','150110 · Accumulated ROU amortization',amort);
 }
 add(route==='expense'?'AP-RECLASSIFICATION':'RENT-INVOICE','220101 · Lease liability – current portion',row.payment,0);
 add(route==='expense'?'AP-RECLASSIFICATION':'RENT-INVOICE',route==='expense'?'610000 · AP rent expense':'210100 · Accounts payable',0,row.payment);
 return out;
}
export function reclassJournalRows(a,row){
 const amt=round2(row.reclassAmount);
 if(Math.abs(amt)<.005)return [];
 const [from,to]=amt>0?['220102 · Lease liability – noncurrent portion','220101 · Lease liability – current portion']:['220101 · Lease liability – current portion','220102 · Lease liability – noncurrent portion'];
 const base={date:row.date,leaseId:a.leaseId,entity:a.entity,currency:a.currency,event:'CURRENT-NONCURRENT-RECLASS'};
 return [{...base,account:from,debit:Math.abs(amt),credit:0},{...base,account:to,debit:0,credit:Math.abs(amt)}];
}
export function initialJournals(a,c){
 const raw=[['150100 · ROU asset',c.initialROU,0],['220101 · Lease liability – current portion',0,c.initialCurrentLiability],['220102 · Lease liability – noncurrent portion',0,c.initialNoncurrentLiability],['140100 · Prepaid rent',0,+a.prepayment],['220200 · Incentive clearing',+a.incentive,0],['140200 · Initial direct cost clearing',0,+a.idc]];
 const rows=raw.filter(x=>x[1]||x[2]).map(([account,debit,credit])=>({date:a.start,leaseId:a.leaseId,entity:a.entity,currency:a.currency,event:'COMMENCEMENT',account,debit:round2(debit),credit:round2(credit)}));
 const diff=round2(rows.reduce((s,x)=>s+x.credit-x.debit,0));rows[0].debit=round2(rows[0].debit+diff);return rows;
}
export function classificationTest(a,initialLiability){
 const termPct=a.economicLifeMonths>0?a.months/a.economicLifeMonths:0;
 const pvPct=a.fairValue>0?initialLiability/a.fairValue:0;
 const termThreshold=(+a.termThreshold||0)/100,pvThreshold=(+a.pvThreshold||0)/100;
 const criteria=[
  {key:'ownership',met:!!a.ownershipTransfer},
  {key:'purchase',met:!!a.purchaseOption},
  {key:'term',met:termPct>=termThreshold},
  {key:'pv',met:pvPct>=pvThreshold},
  {key:'specialized',met:!!a.specializedAsset},
 ];
 return {criteria,finance:criteria.some(x=>x.met),termPct,pvPct,termThreshold,pvThreshold};
}
export function ibrBuildUp(reference,spread,adjustment){return round2(+reference+ +spread+ +adjustment);}
export function csv(rows){
 if(!rows.length)return '';
 const keys=Object.keys(rows[0]);
 const safe=x=>{let v=typeof x==='number'?String(round2(x)):String(x??'');if(typeof x!=='number'&&/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};
 return [keys.map(safe).join(','),...rows.map(r=>keys.map(k=>safe(r[k])).join(','))].join('\r\n');
}
export function extract(pages){
 const patterns={
 entity:/Lessee:\s*([^\n]+)/i,start:/Commencement date:\s*(\d{4}-\d{2}-\d{2})/i,
 months:/Lease term:\s*(\d+)\s*months/i,rent:/Monthly base rent:\s*(?:INR|USD|EUR|GBP)\s*([\d,]+(?:\.\d+)?)/i,
 currency:/Monthly base rent:\s*(INR|USD|EUR|GBP)/i,escalation:/Annual fixed escalation:\s*([\d.]+)\s*%/i,
 free:/Initial rent-free period:\s*(\d+)\s*months/i,incentive:/Incentive received at commencement:\s*(?:INR|USD|EUR|GBP)\s*([\d,]+(?:\.\d+)?)/i};
 const found={},missing=[],evidence={};
 for(const [key,re]of Object.entries(patterns)){
  const matches=[];pages.forEach((p,i)=>{const m=p.match(re);if(m)matches.push({value:m[1].trim(),quote:m[0],page:i+1});});
  const unique=[...new Set(matches.map(m=>m.value))];
  if(unique.length!==1){missing.push(key);continue;}
  const m=matches[0];found[key]=['entity','start','currency'].includes(key)?m.value:Number(m.value.replaceAll(',',''));evidence[key]=m;
 }
 return {found,missing,evidence};
}
