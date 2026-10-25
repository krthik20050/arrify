import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {unzipSync,strFromU8} from 'fflate';
import {makeStickerUsdz} from '../lib/ar-usdz.mjs';
import {makeStickerGlb,registerModel} from '../lib/ar.mjs';
import {prepareStored,nativeStored} from '../lib/ar-storage.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
const text=bytes=>strFromU8(unzipSync(bytes)['model.usda']);
test('iPhone wall exports stay upright without forced plane-anchor rotation; desk exports retain their basis',()=>{
 const wall=text(makeStickerUsdz(png,80,40,0,0,0,'wall'));
 assert.doesNotMatch(wall,/preliminary:|Preliminary_AnchoringAPI/);
 assert.match(wall,/normal3f\[\] normals = \[\(0, 0, 1\)/);
 const floor=text(makeStickerUsdz(png,80,40));
 assert.match(floor,/alignment = "any"/);assert.match(floor,/normal3f\[\] normals = \[\(0, 1, 0\)/);
});
test('prepare passes the chosen surface into the native export and versions changed wall assets',async()=>{
 const input={png:`data:image/png;base64,${png.toString('base64')}`,widthMm:80,heightMm:40,placement:'wall'};
 const model=await prepareStored(input),usd=text(await nativeStored(model.url.split('/').pop().slice(0,-4)));
 assert.doesNotMatch(usd,/preliminary:/);assert.match(usd,/normal3f\[\] normals = \[\(0, 0, 1\)/);
 assert.equal(registerModel(input).url,model.url);
 const bytes=makeStickerGlb(png,80,40,'wall').bytes;
 const oldId=createHash('sha256').update(bytes).digest('hex');
 assert.notEqual(model.url,`/api/ar/models/${oldId}.glb`,'native export version must prevent reuse of cached old wall USDZ');
});
