import {createHash} from 'node:crypto';
import {byHandle} from './catalog.mjs';
export const arEligible=p=>Boolean(p&&/^(Stickers|Bumper Sticker|Holographic stickers|Glitter Stickers|Infinity Stickers)$/.test(p.product_type)&&p.images.length);
export function arProduct(handle){const p=byHandle.get(handle);if(!arEligible(p))return null;return {id:p.id,handle:p.handle,title:p.title,widthMm:null,heightMm:null,sizeNote:'Exact printed dimensions are not verified in this catalog. Enter a measured width, or treat the preview as an estimate.',variants:p.variants.map(v=>({id:v.id,title:v.title,available:v.available}))};}
const models=new Map();const TTL=30*60*1000,MAX_MODELS=24;
export function pngDimensions(png){if(png.length<33||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.toString('ascii',12,16)!=='IHDR')throw new Error('A PNG sticker texture is required.');const width=png.readUInt32BE(16),height=png.readUInt32BE(20);if(width<1||height<1||width>2048||height>2048)throw new Error('Texture must be at most 2048 × 2048 pixels.');return {width,height};}
export function makeStickerGlb(png,widthMm,heightMm,placement="floor",rotation=0,tilt=0,lean=0){
 const dims=pngDimensions(png);widthMm=Number(widthMm);heightMm=heightMm==null?widthMm*dims.height/dims.width:Number(heightMm);
 if(!Number.isFinite(widthMm)||!Number.isFinite(heightMm)||widthMm<5||widthMm>1000||heightMm<1||heightMm>1000)throw new Error('Preview dimensions are outside the supported range.');
 const w=widthMm/2000,h=heightMm/2000;
 if(!['floor','wall'].includes(placement))throw new Error('Choose a desk or wall surface.');
 rotation=Number(rotation);tilt=Number(tilt);lean=Number(lean);if([rotation,tilt,lean].some(angle=>!Number.isFinite(angle)||Math.abs(angle)>180))throw new Error('Rotation must be between -180 and 180 degrees on each axis.');
 // Explicit front/back surfaces give native viewers non-zero depth without relying on double-sided USDZ materials.
 const points=[[-w,.0006,h],[w,.0006,h],[w,.0006,-h],[-w,.0006,-h],[-w,0,h],[w,0,h],[w,0,-h],[-w,0,-h]];
 const r=rotation*Math.PI/180,t=tilt*Math.PI/180,l=lean*Math.PI/180;
 const transform=([x,y,z])=>{const xx=x*Math.cos(r)-z*Math.sin(r),zz=x*Math.sin(r)+z*Math.cos(r);const yy=y*Math.cos(t)-zz*Math.sin(t),zt=y*Math.sin(t)+zz*Math.cos(t),xl=xx*Math.cos(l)-yy*Math.sin(l),yl=xx*Math.sin(l)+yy*Math.cos(l);return placement==='wall'?[xl,-zt,yl]:[xl,yl,zt];};
 const transformed=points.map(transform),positions=new Float32Array(transformed.flat());
 const normal=transform([0,1,0]),normals=new Float32Array([...Array(4).fill(normal).flat(),...Array(4).fill(normal.map(v=>-v)).flat()]);
 const uv=new Float32Array([0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0]);const indices=new Uint16Array([0,1,2,0,2,3,4,6,5,4,7,6]);
 const minimum=[0,1,2].map(i=>Math.min(...transformed.map(p=>p[i]))),maximum=[0,1,2].map(i=>Math.max(...transformed.map(p=>p[i])));
 const chunks=[Buffer.from(positions.buffer),Buffer.from(normals.buffer),Buffer.from(uv.buffer),Buffer.from(indices.buffer),png];let offset=0;
 const views=chunks.map((b,i)=>{const v={buffer:0,byteOffset:offset,byteLength:b.length,...(i<3?{target:34962}:i===3?{target:34963}:{})};offset+=Math.ceil(b.length/4)*4;return v;});
 const bin=Buffer.concat(chunks.flatMap(b=>[b,Buffer.alloc((4-b.length%4)%4)]));
 const gltf={asset:{version:'2.0',generator:'Stick It Up AR prototype'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0}]}],materials:[{pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:1},alphaMode:'MASK',alphaCutoff:.15,doubleSided:false}],textures:[{sampler:0,source:0}],samplers:[{magFilter:9729,minFilter:9729,wrapS:33071,wrapT:33071}],images:[{bufferView:4,mimeType:'image/png'}],buffers:[{byteLength:bin.length}],bufferViews:views,accessors:[{bufferView:0,componentType:5126,count:8,type:'VEC3',min:minimum,max:maximum},{bufferView:1,componentType:5126,count:8,type:'VEC3'},{bufferView:2,componentType:5126,count:8,type:'VEC2'},{bufferView:3,componentType:5123,count:12,type:'SCALAR'}]};
 const raw=Buffer.from(JSON.stringify(gltf)),json=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),header=Buffer.alloc(20),binHeader=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);binHeader.writeUInt32LE(bin.length);binHeader.writeUInt32LE(0x004e4942,4);
 return {bytes:Buffer.concat([header,json,binHeader,bin]),widthMm,heightMm};
}
export function registerModel(input){
 if(typeof input.png!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(input.png)||input.png.length>4_000_000)throw new Error('Texture is missing or too large.');
 const png=Buffer.from(input.png.split(',')[1],'base64');const result=makeStickerGlb(png,input.widthMm,input.heightMm,input.placement,input.rotation,input.tilt,input.lean);
 const now=Date.now();for(const [key,value]of models)if(now-value.created>TTL)models.delete(key);
 // The ID identifies the GLB/native pair; version wall exports to avoid a phone
 // reusing a cached USDZ from the previous horizontal-anchor strategy.
 const id=createHash('sha256').update(result.bytes).update(input.placement==='wall'?'wall-native-unanchored-v1':'').digest('hex');if(!models.has(id)){while(models.size>=MAX_MODELS)models.delete(models.keys().next().value);models.set(id,{...result,created:now});}
 return {url:`/api/ar/models/${id}.glb`,widthMm:result.widthMm,heightMm:result.heightMm,expiresInSeconds:Math.max(1,Math.floor((TTL-(now-models.get(id).created))/1000))};
}
export function getModel(id){const value=models.get(id);if(!value||Date.now()-value.created>TTL){models.delete(id);return null;}return value.bytes;}
export function setNativeModel(id,bytes){const model=models.get(id);if(model)model.native=bytes;}
export function getNativeModel(id){if(!getModel(id))return null;return models.get(id).native||null;}
export function getModelInfo(id){if(!getModel(id))return null;const model=models.get(id);return {url:`/api/ar/models/${id}.glb`,...(model.native?{iosSrc:`/api/ar/models/${id}.usdz`}:{}),widthMm:model.widthMm,heightMm:model.heightMm,expiresAt:model.created+TTL};}
