import test from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {makeStickerGlb,registerModel} from '../lib/ar.mjs';
import {makeStickerUsdz} from '../lib/ar-usdz.mjs';
import {prepareStored,nativeStored} from '../lib/ar-storage.mjs';
import {removePhotoShadow} from '../public/ar-texture.js';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
function normal(bytes){const n=bytes.readUInt32LE(12),g=JSON.parse(bytes.toString('utf8',20,20+n)),offset=28+n+g.bufferViews[1].byteOffset;return [0,1,2].map(i=>bytes.readFloatLE(offset+i*4));}
test('three independent axes include perpendicular and complete-turn orientations',()=>{
 const tilted=normal(makeStickerGlb(png,80,40,'floor',0,90,0).bytes);assert.ok(Math.abs(tilted[2]-1)<1e-6);
 const leaned=normal(makeStickerGlb(png,80,40,'floor',0,0,90).bytes);assert.ok(Math.abs(leaned[0]+1)<1e-6);
 for(const angle of [-180,180])assert.doesNotThrow(()=>makeStickerGlb(png,80,40,'floor',angle,angle,angle));
 for(const angle of [181,Infinity,NaN])assert.throws(()=>makeStickerGlb(png,80,40,'floor',0,0,angle));
 const a=registerModel({png:`data:image/png;base64,${png.toString('base64')}`,widthMm:80});
 const b=registerModel({png:`data:image/png;base64,${png.toString('base64')}`,widthMm:80,lean:90});assert.notEqual(a.url,b.url);
});
test('iPhone USDZ and the preparation route bake the third rotation without changing anchor basis',async()=>{
 const source=strFromU8(unzipSync(makeStickerUsdz(png,80,40,0,0,90))['model.usda']);
 assert.match(source,/alignment = "any"/);assert.match(source,/normal3f\[\] normals = \[\(-1,/);
 const result=await prepareStored({png:`data:image/png;base64,${png.toString('base64')}`,widthMm:80,heightMm:40,lean:90});
 const usd=strFromU8(unzipSync(await nativeStored(result.url.split('/').pop().slice(0,-4)))['model.usda']);assert.equal(usd,source);
});
test('photo-shadow cleanup removes only pale neutral pixels reachable from the exterior',()=>{
 const w=7,h=7,data=new Uint8ClampedArray(w*h*4);
 const pixel=(x,y,r,g,b)=>data.set([r,g,b,255],(y*w+x)*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)pixel(x,y,220,220,220);
 for(let y=2;y<=4;y++)for(let x=2;x<=4;x++)pixel(x,y,0,0,0);
 pixel(3,3,220,220,220);pixel(0,3,220,60,60);
 removePhotoShadow(data,w,h);
 assert.equal(data[3],0);assert.equal(data[(3*w+3)*4+3],255);assert.equal(data[(3*w)*4+3],255);assert.equal(data[(2*w+2)*4+3],255);
});
