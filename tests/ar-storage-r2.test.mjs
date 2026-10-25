import test from 'node:test';
import assert from 'node:assert/strict';
import {createR2Store,r2Configured} from '../lib/ar-r2.mjs';
import {prepareStored} from '../lib/ar-storage.mjs';

const settings={R2_ENDPOINT:'https://example.r2.cloudflarestorage.com',R2_ACCESS_KEY_ID:'a'.repeat(32),R2_SECRET_ACCESS_KEY:'b'.repeat(64),R2_BUCKET:'catalog'};
test('R2 configuration is explicit and rejects malformed credentials and endpoints',()=>{
 assert.equal(r2Configured({}),false);
 assert.equal(r2Configured(settings),true);
 for(const override of [{R2_ENDPOINT:'http://example.com'},{R2_ENDPOINT:'https://user:secret@example.com'},{R2_ACCESS_KEY_ID:'your_access_key_id'},{R2_SECRET_ACCESS_KEY:'your_secret_access_key'}])assert.throws(()=>createR2Store({...settings,...override}));
});
test('overlapping preparations retain model bytes and expiry metadata while uploads are pending',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 const saved=new Map();
 const store={async write(name,value){await gate;saved.set(name,Buffer.from(value));}};
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
 const pending=Array.from({length:30},(_,i)=>prepareStored({png,widthMm:100+i},store));
 release();
 const models=await Promise.all(pending);
 for(const model of models){
  const id=model.url.split('/').pop().slice(0,-4);
  assert.ok(saved.get(`sticker-ar/models/${id}.glb`).length>100);
  const info=JSON.parse(saved.get(`sticker-ar/metadata/${id}.json`));
  assert.equal(info.url,model.url);assert.ok(info.expiresAt>Date.now());
 }
});
test('R2 binary and metadata survive a fresh store instance; missing objects alone return null',async()=>{
 const objects=new Map();
 const client={async send(command){const input=command.input;
  if(input.Body!==undefined){objects.set(input.Key,Buffer.from(input.Body));return {};}
  const value=objects.get(input.Key);if(!value)throw Object.assign(new Error('Not found'),{name:'NoSuchKey',$metadata:{httpStatusCode:404}});
  return {Body:{transformToByteArray:async()=>new Uint8Array(value)}};
 }};
 const first=createR2Store(settings,client);
 await first.write('models/test.glb',Buffer.from([0,255,13,10]),'model/gltf-binary');
 await first.write('metadata/test.json',JSON.stringify({widthMm:80}),'application/json');
 const second=createR2Store(settings,client);
 assert.deepEqual(await second.read('models/test.glb',true),Buffer.from([0,255,13,10]));
 assert.deepEqual(await second.read('metadata/test.json'),{widthMm:80});
 assert.equal(await second.read('missing.json'),null);
 const denied=createR2Store(settings,{send:async()=>{throw Object.assign(new Error('Denied'),{$metadata:{httpStatusCode:403}});}});
 await assert.rejects(denied.read('metadata/test.json'),/Denied/);
});
