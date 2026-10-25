import test from 'node:test';
import assert from 'node:assert/strict';
import {registerModel,getModelInfo} from '../lib/ar.mjs';
import {validPhoneOrigin,createHandoff,getHandoff,handoffQr} from '../lib/ar-handoff.mjs';
import {createServer} from '../server.mjs';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
test('phone origins must be HTTPS and cannot point to localhost or carry credentials',()=>{
 for(const value of ['http://preview.example','https://localhost:3001','https://127.0.0.1','https://[::1]','https://user:secret@preview.example','https://preview.example/path','https://preview.example/?x=1'])assert.equal(validPhoneOrigin(value),null,value);
 assert.equal(validPhoneOrigin('https://phone.example/'),'https://phone.example');
});
test('handoff carries the exact prepared layout and dimensions without browser storage',async()=>{
 const model=registerModel({png,widthMm:320,heightMm:200});const result=createHandoff({model:model.url,title:'Cart arrangement',kind:'layout',measured:true},'https://phone.example');const token=new URL(result.url).searchParams.get('handoff'),scene=getHandoff(token);
 assert.equal(scene.url,model.url);assert.equal(scene.widthMm,320);assert.equal(scene.heightMm,200);assert.equal(scene.kind,'layout');assert.equal(scene.measured,true);assert.equal(scene.title,'Cart arrangement');assert.equal(scene.expiresAt,result.expiresAt);assert.ok(result.expiresAt>Date.now());
 const qr=await handoffQr(token);assert.equal(qr.readUInt32BE(16),320);assert.equal(qr.readUInt32BE(20),320);assert.ok(qr.length>1000);assert.equal(getHandoff('unknown'),null);assert.equal(await handoffQr('unknown'),null);
});
test('unknown models and missing preview origin cannot create misleading QRs',()=>{assert.throws(()=>createHandoff({model:'/api/ar/models/'+'0'.repeat(64)+'.glb'},'https://phone.example'),/expired/);assert.throws(()=>createHandoff({},'http://localhost:3001'),/HTTPS/);});
test('model eviction invalidates dependent handoffs',()=>{
 const model=registerModel({png,widthMm:55});const shared=createHandoff({model:model.url},'https://phone.example');for(let i=0;i<26;i++)registerModel({png,widthMm:100+i});assert.equal(getModelInfo(model.url.split('/').pop().slice(0,-4)),null);assert.equal(getHandoff(new URL(shared.url).searchParams.get('handoff')),null);
});
test('HTTP QR flow returns the shared scene and expired states',async()=>{
 const server=createServer({phoneOrigin:'https://phone.example'});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 try{const model=registerModel({png,widthMm:75});const response=await fetch(origin+'/api/ar/handoffs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:model.url,title:'Sticker',measured:false})});assert.equal(response.status,200);const result=await response.json();assert.equal(new URL(result.url).origin,'https://phone.example');const token=new URL(result.url).searchParams.get('handoff');const scene=await fetch(origin+`/api/ar/handoffs/${token}`);assert.equal(scene.status,200);assert.equal((await scene.json()).widthMm,75);assert.equal(scene.headers.get('cache-control'),'no-store');assert.equal((await fetch(origin+result.qr)).headers.get('content-type'),'image/png');assert.equal((await fetch(origin+'/pages/try-live?handoff='+token)).status,200);assert.equal((await fetch(origin+'/api/ar/handoffs/'+'0'.repeat(32))).status,410);
 }finally{await new Promise(r=>server.close(r));}
});
test('an unconfigured local server explains why it cannot generate a phone QR',async()=>{
 const server=createServer({phoneOrigin:null});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;try{const response=await fetch(origin+'/api/ar/handoffs',{method:'POST',body:'{}'});assert.equal(response.status,409);assert.match((await response.json()).error,/HTTPS/);}finally{await new Promise(r=>server.close(r));}
});
