import test from 'node:test';
import assert from 'node:assert/strict';
import {requestHandler} from '../server.mjs';
test('poster catalog API supplies imported records and same-origin image paths',async()=>{
 let code,data;await requestHandler()({url:'/api/posters/catalog',method:'GET'},{writeHead(status){code=status;},end(body){data=body;},setHeader(){}});
 assert.equal(code,200);const json=JSON.parse(data);assert.equal(json.source,'https://www.posterized.in');assert.ok(json.products.length>=1900);
 assert.ok(json.products.every(p=>p.id.startsWith('posterized-')&&p.title&&p.images.length&&p.images.every(i=>i.startsWith('/poster-assets/'))));
 assert.ok(json.collections.length>200);assert.ok(json.products.every(p=>p.variants.every(v=>Number.isFinite(v.price))));
});
import {existsSync,readFileSync} from 'node:fs';
import {posterCatalog} from '../lib/poster-catalog.mjs';
test('every captured image is mirrored locally and collection membership is valid',()=>{
 const catalog=posterCatalog(),base=new URL('../data/posters/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('manifest.json',base)));
 assert.deepEqual(manifest.failures,[]);
 assert.equal(manifest.downloadedImageCount,manifest.imageCount);
 const imageMap=JSON.parse(readFileSync(new URL('images.json',base)));
 assert.equal(Object.keys(imageMap).length,manifest.imageCount);
 for(const image of Object.values(imageMap))assert.ok(existsSync(new URL('../public'+image,import.meta.url)),image);
 const ids=new Set(catalog.products.map(p=>p.id));
 assert.equal(catalog.products.length,manifest.productCount);
 for(const collection of catalog.collections)assert.ok(collection.productIds.every(id=>ids.has(id)));
 assert.ok(manifest.observations.every(o=>o.terminalEmptyPage&&o.pageCounts.at(-1)===0));
});
