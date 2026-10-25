import {readFileSync} from 'node:fs';
let catalog={};try{catalog=JSON.parse(readFileSync(new URL('../data/ar-catalog.json',import.meta.url),'utf8'));}catch{}
export function assetOrigin(value=process.env.AR_ASSET_BASE_URL){
 if(!value)return '';
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('AR_ASSET_BASE_URL must be an HTTPS origin without a path or credentials.');
 return url.origin;
}
export const arAssetOrigin=assetOrigin();
export function resolveReadyAssets(item,origin=arAssetOrigin){
 if(!item||!origin)return item;
 const resolved={...item};
 for(const field of ['texture','glb','usdz'])if(resolved[field]?.startsWith('/ar-prepared/'))resolved[field]=origin+resolved[field];
 return resolved;
}
export const readyModel=handle=>resolveReadyAssets(catalog[handle]||null);
