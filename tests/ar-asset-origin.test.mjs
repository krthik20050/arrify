import test from 'node:test';
import assert from 'node:assert/strict';
import {assetOrigin,resolveReadyAssets} from '../lib/ar-ready.mjs';
import {execFileSync} from 'node:child_process';
test('R2 remapping preserves metadata and local fallback without changing the manifest',()=>{
 const item={texture:'/ar-prepared/a.png',glb:'/ar-prepared/a.glb',usdz:'/ar-prepared/a.usdz',widthMm:76.2};
 assert.equal(resolveReadyAssets(item,''),item);
 const remote=resolveReadyAssets(item,'https://assets.example.com');
 assert.equal(remote.usdz,'https://assets.example.com/ar-prepared/a.usdz');
 assert.equal(remote.widthMm,76.2);assert.equal(item.glb,'/ar-prepared/a.glb');assert.equal(resolveReadyAssets(null),null);
});
test('legacy prepared asset paths redirect to the configured host without requiring local files',()=>{
 const output=execFileSync(process.execPath,['--input-type=module','-e',`import {requestHandler} from './server.mjs';let code,headers;await requestHandler()({method:'GET',url:'/ar-prepared/catalog-migration.glb'},{writeHead(c,h){code=c;headers=h;},end(){console.log(JSON.stringify({code,headers}));}});`],{cwd:new URL('..',import.meta.url),env:{...process.env,AR_ASSET_BASE_URL:'https://assets.example.com'},encoding:'utf8'});
 const result=JSON.parse(output);
 assert.equal(result.code,302);assert.equal(result.headers.Location,'https://assets.example.com/ar-prepared/catalog-migration.glb');
});
test('asset origin rejects insecure URLs, credentials and CSP injection paths',()=>{
 assert.equal(assetOrigin('https://assets.example.com/'),'https://assets.example.com');
 for(const value of ['http://example.com','https://a:b@example.com','https://example.com/path','https://example.com/?q=x','https://example.com/#x'])assert.throws(()=>assetOrigin(value));
});
test('studio permits artwork fetches from the configured R2 catalog origin',()=>{
 const output=execFileSync(process.execPath,['--input-type=module','-e',`import {requestHandler} from './server.mjs';let headers;await requestHandler()({method:'GET',url:'/pages/sticker-studio'},{writeHead(c,h){headers=h;},end(){console.log(JSON.stringify(headers));}});`],{cwd:new URL('..',import.meta.url),env:{...process.env,AR_ASSET_BASE_URL:'https://assets.example.com'},encoding:'utf8'});
 const policy=JSON.parse(output)['Content-Security-Policy'];
 assert.match(policy,/connect-src[^;]*https:\/\/assets\.example\.com/);
 assert.ok(!policy.includes('wasm-unsafe-eval'));
});
test('canvas artwork requests return PNG bytes from the app instead of a cross-origin redirect',()=>{
 const output=execFileSync(process.execPath,['--input-type=module','-e',`import {requestHandler} from './server.mjs';globalThis.fetch=async()=>new Response(Buffer.from('canvas-png'),{status:200});let code,headers;await requestHandler()({method:'GET',url:'/api/ar/image/wasted-sticker?canvas=1'},{setHeader(){},writeHead(c,h){code=c;headers=h;},end(body){console.log(JSON.stringify({code,headers,body:String(body)}));}});`],{cwd:new URL('..',import.meta.url),env:{...process.env,AR_ASSET_BASE_URL:'https://assets.example.com'},encoding:'utf8'});
 const result=JSON.parse(output);assert.equal(result.code,200);assert.equal(result.headers['Content-Type'],'image/png');assert.equal(result.headers.Location,undefined);assert.equal(result.body,'canvas-png');
});
