import {randomBytes} from 'node:crypto';
import {put,head,BlobNotFoundError} from '@vercel/blob';
import QRCode from 'qrcode';
import {registerModel,getModel,getModelInfo,setNativeModel,getNativeModel} from './ar.mjs';
import {makeStickerUsdz} from './ar-usdz.mjs';
import {createHandoff,getHandoff,handoffQr,validPhoneOrigin} from './ar-handoff.mjs';
import {createR2Store,r2Configured} from './ar-r2.mjs';
let r2;
const r2Store=()=>r2Configured()?(r2??=createR2Store()):null;
const durable=()=>Boolean(r2Configured()||process.env.BLOB_READ_WRITE_TOKEN);
const key=(kind,id)=>`sticker-ar/${kind}/${id}`;
async function read(name,binary=false){
 if(r2Store())return r2Store().read(name,binary);
 try{const blob=await head(name);const response=await fetch(blob.url,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Stored preview could not be read.');return binary?Buffer.from(await response.arrayBuffer()):response.json();}
 catch(error){if(error instanceof BlobNotFoundError||error?.status===404)return null;throw error;}
}
async function write(name,value,type){if(r2Store())return r2Store().write(name,value,type);return put(name,value,{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:type,cacheControlMaxAge:60});}
export async function prepareStored(input,storageOverride){
 const model=registerModel(input),id=model.url.split('/').pop().slice(0,-4),native=makeStickerUsdz(Buffer.from(input.png.split(',')[1],'base64'),model.widthMm,model.heightMm,input.rotation,input.tilt,input.lean,input.placement);setNativeModel(id,native);
 if(!storageOverride&&!durable())return {...model,iosSrc:`/api/ar/models/${id}.usdz`};
 // Capture before awaiting I/O: other requests can evict entries from the bounded map.
 const bytes=getModel(id),metadata=getModelInfo(id),store=storageOverride||r2Store();
 const persist=(...args)=>store?store.write(...args):write(...args);
 const ios=await persist(key('models',`${id}.usdz`),native,'model/vnd.usdz+zip');
 const info={...metadata,iosSrc:store?`/api/ar/models/${id}.usdz`:ios.url,placement:input.placement==='wall'?'wall':'floor'};
 await persist(key('models',`${id}.glb`),bytes,'model/gltf-binary');
 await persist(key('metadata',`${id}.json`),JSON.stringify(info),'application/json');return {...model,iosSrc:info.iosSrc};
}
export async function nativeStored(id){if(!durable())return getNativeModel(id);const info=await read(key('metadata',`${id}.json`));return info&&info.expiresAt>Date.now()?read(key('models',`${id}.usdz`),true):null;}
export async function modelStored(id){if(!durable())return getModel(id);const info=await read(key('metadata',`${id}.json`));return info&&info.expiresAt>Date.now()?read(key('models',`${id}.glb`),true):null;}
export async function createStoredHandoff(input,origin){
 if(!durable())return createHandoff(input,origin);
 origin=validPhoneOrigin(origin);if(!origin)throw new Error('An HTTPS preview origin is required.');
 const match=String(input.model||'').match(/^\/api\/ar\/models\/([a-f0-9]{64})\.glb$/);
 const info=match&&await read(key('metadata',`${match[1]}.json`));if(!info||info.expiresAt<=Date.now())throw new Error('Preview expired. Prepare it again.');
 const token=randomBytes(16).toString('hex'),url=`${origin}/pages/try-live?handoff=${token}`;
 const kind=['layout','poster-layout'].includes(input.kind)?input.kind:'single';
 const scene={...info,title:String(input.title||'Sticker preview').slice(0,160),kind,measured:input.measured===true,placement:input.placement==='wall'?'wall':'floor',url:info.url,phoneUrl:url};
 await write(key('handoffs',`${token}.json`),JSON.stringify(scene),'application/json');return {url,qr:`/api/ar/handoffs/${token}/qr.png`,expiresAt:scene.expiresAt,requiresLaptop:false};
}
export async function handoffStored(token){if(!durable())return getHandoff(token);const scene=await read(key('handoffs',`${token}.json`));return scene&&scene.expiresAt>Date.now()?scene:null;}
export async function qrStored(token){if(!durable())return handoffQr(token);const scene=await handoffStored(token);return scene?QRCode.toBuffer(scene.phoneUrl,{type:'png',width:320,margin:4,errorCorrectionLevel:'M'}):null;}
