import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sample,extract} from './dist/engine.mjs';
const canvas=await import(process.env.PDF_TEST_CANVAS_MODULE || '@napi-rs/canvas');
globalThis.DOMMatrix=canvas.DOMMatrix;globalThis.ImageData=canvas.ImageData;globalThis.Path2D=canvas.Path2D;
const pdfjs=await import('./dist/vendor/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('./dist/vendor/pdf.worker.min.mjs',import.meta.url).href;
const pdf=await pdfjs.getDocument({data:new Uint8Array(await readFile('./dist/sample-lease.pdf')),isEvalSupported:false}).promise;
const pages=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),t=await p.getTextContent();pages.push(t.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join(''));}
await pdf.destroy();const ex=extract(pages);assert.deepEqual(ex.missing,[]);for(const [key,v] of Object.entries(ex.found))assert.equal(v,sample[key]);assert.equal(ex.evidence.rent.page,1);
assert.match(pages.join('\n'),/Payment timing:\s*Monthly in arrears/i);assert.match(pages.join('\n'),/Demo scope:\s*Fixed rent; monthly arrears; no options; no modifications\./i);
console.log(JSON.stringify({result:'passed',pdfFields:Object.keys(ex.found).length,pages:pages.length}));
