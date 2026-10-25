import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {unzipSync,strFromU8} from 'fflate';
import {makeStickerUsdz} from '../lib/ar-usdz.mjs';
import {products} from '../lib/catalog.mjs';
import {arEligible} from '../lib/ar.mjs';
import {removeDetachedMarks} from '../public/ar-texture.js';
import {createServer} from '../server.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
test('every eligible catalog sticker has prepared static artwork, GLB and USDZ files',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../data/ar-catalog.json',import.meta.url)));
 for(const p of products.filter(arEligible)){const item=manifest[p.handle];assert.ok(item,p.handle);for(const field of ['glb','usdz','texture']){assert.match(item[field],/^\/ar-prepared\/[a-z0-9-]+\.(glb|usdz|png)$/);assert.ok(existsSync(new URL('../public'+item[field],import.meta.url)),p.handle+': '+field);}}
});
test('detached badge cleanup preserves lettering within the dominant sticker artwork',()=>{
 const data=new Uint8ClampedArray(100*100*4);const fill=(x,y)=>{data[(y*100+x)*4+3]=255;};
 for(let y=30;y<70;y++)for(let x=30;x<70;x++)fill(x,y);
 for(let y=2;y<6;y++)for(let x=90;x<94;x++)fill(x,y);
 const result=removeDetachedMarks(data,100,100);assert.ok(result.removedPixels>0);assert.equal(data[(3*100+91)*4+3],0);assert.equal(data[(50*100+50)*4+3],255);
});
test('prepared USDZ embeds artwork, permits any-plane anchoring and uses aligned uncompressed entries',()=>{
 const zip=makeStickerUsdz(png,76.2,30);let offset=0,count=0;
 while(zip.readUInt32LE(offset)===0x04034b50){assert.equal(zip.readUInt16LE(offset+8),0);const size=zip.readUInt32LE(offset+18),name=zip.readUInt16LE(offset+26),extra=zip.readUInt16LE(offset+28),start=offset+30+name+extra;assert.equal(start%64,0);offset=start+size;count++;}
 assert.equal(count,2);const files=unzipSync(zip),usd=strFromU8(files['model.usda']);assert.deepEqual(Buffer.from(files['textures/sticker.png']),png);
 assert.match(usd,/defaultPrim = "Root"/);assert.match(usd,/def Xform "Root" \(prepend apiSchemas = \["Preliminary_AnchoringAPI"\]\)/);assert.match(usd,/alignment = "any"/);assert.match(usd,/inputs:opacity.connect/);assert.doesNotMatch(usd,/allowsContentScaling=0/);
});
test('iPhone cube is a direct native USDZ link without a preparation navigation',()=>{
 const link={dataset:{arUsdz:'https://example.com/ready.usdz',arGlb:'https://example.com/ready.glb'},href:'https://demo.test/pages/try-live?product=a',attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(){return 'Sticker';}};
 vm.runInNewContext(readFileSync(new URL('../public/native-ar.js',import.meta.url),'utf8'),{document:{createElement:()=>({relList:{supports:()=>true}}),querySelectorAll:()=>link.dataset.arLinked?[]:[link],body:{}},navigator:{userAgent:'iPhone'},location:{href:'https://demo.test'},URL,URLSearchParams,MutationObserver:class{observe(){}}});
 assert.equal(link.href,'https://example.com/ready.usdz#allowsContentScaling=0');assert.equal(link.attrs.rel,'ar');
});
test('Android native launch locks resizing and enables vertical placement with an explicit fallback',()=>{
 const link={dataset:{arUsdz:'https://example.com/ready.usdz',arGlb:'https://example.com/ready.glb'},href:'https://demo.test/pages/try-live?product=a',setAttribute(){},getAttribute(){return 'Sticker';}};
 vm.runInNewContext(readFileSync(new URL('../public/native-ar.js',import.meta.url),'utf8'),{document:{createElement:()=>({relList:{supports:()=>false}}),querySelectorAll:()=>link.dataset.arLinked?[]:[link],body:{}},navigator:{userAgent:'Android'},location:{href:'https://demo.test'},URL,URLSearchParams,MutationObserver:class{observe(){}}});
 assert.match(link.href,/resizable=false/);assert.match(link.href,/enable_vertical_placement=true/);assert.match(link.href,/browser_fallback_url=/);
});
test('desktop Safari retains the browser 3D route even when rel=ar is recognized',()=>{
 const link={dataset:{arUsdz:'https://example.com/ready.usdz',arGlb:'https://example.com/ready.glb'},href:'https://demo.test/pages/try-live?product=a',setAttribute(){throw new Error('Desktop must keep browser preview');},getAttribute(){return 'Sticker';}};
 vm.runInNewContext(readFileSync(new URL('../public/native-ar.js',import.meta.url),'utf8'),{document:{createElement:()=>({relList:{supports:()=>true}}),querySelectorAll:()=>link.dataset.arLinked?[]:[link],body:{}},navigator:{userAgent:'Macintosh Safari',platform:'MacIntel',maxTouchPoints:0},location:{href:'https://demo.test'},URL,URLSearchParams,MutationObserver:class{observe(){}}});
 assert.equal(link.href,'https://demo.test/pages/try-live?product=a');
});
test('prepared previews serve native files and stable phone links without generating a model',async()=>{
 const server=createServer({phoneOrigin:'https://demo.example'});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 try{const r=await fetch(origin+'/api/ar/ready/compass-sticker-1');assert.equal(r.status,200);const ready=await r.json();
  for(const [field,type]of [['glb','model/gltf-binary'],['usdz','model/vnd.usdz+zip']]){const asset=await fetch(origin+ready[field]);assert.equal(asset.status,200);assert.equal(asset.headers.get('content-type'),type);}
  const link=await(await fetch(origin+'/api/ar/ready-link/compass-sticker-1')).json();assert.equal(link.expiresAt,null);assert.equal(link.url,'https://demo.example/pages/try-live?product=compass-sticker-1');
  const page=await(await fetch(origin+'/pages/try-live?product=compass-sticker-1')).text();assert.match(page,/ar-scale="fixed"/);assert.doesNotMatch(page,/ar-scale="auto"/);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
