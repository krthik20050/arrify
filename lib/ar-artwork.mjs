import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {removeEdgeWhite,removeDetachedMarks} from '../public/ar-texture.js';
export const ARTWORK_VERSION='clean-v2';
const reviewedSources={'limited-edition-sticker-1':1};
export function selectArtworkSource(product){
 const index=reviewedSources[product.handle]??product.images.findIndex(im=>!new URL(im.src,'http://localhost').pathname.toLowerCase().endsWith('.gif'));
 if(index<0)return {src:`/assets/card-stills/${product.id}.png`,index:-1,reason:'Captured animation still'};
 return {src:product.images[index].src,index,reason:reviewedSources[product.handle]!=null?'Visually reviewed alternate without promotional badge':'First still catalog image; conservative detached-mark cleanup'};
}
export async function prepareArtwork(product,{fetchImpl=fetch,maxDimension=768,sourceBytes}={}){
 const source=selectArtworkSource(product);let input=sourceBytes;
 if(!input){if(source.src.startsWith('/assets/'))input=await readFile(new URL(`../public${source.src}`,import.meta.url));else{const url=new URL(source.src);if(url.protocol!=='https:'||url.hostname!=='cdn.shopify.com')throw new Error('Only captured Shopify artwork sources are supported.');const response=await fetchImpl(url,{signal:AbortSignal.timeout(20000),redirect:'error'});if(!response.ok)throw new Error(`Artwork source returned ${response.status}`);input=Buffer.from(await response.arrayBuffer());if(input.length>8_000_000)throw new Error('Artwork source too large.');}}
 const {data,info}=await sharp(input,{limitInputPixels:32_000_000}).rotate().resize({width:maxDimension,height:maxDimension,fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 removeEdgeWhite(data,info.width,info.height);const cleanup=removeDetachedMarks(data,info.width,info.height);
 let left=info.width,top=info.height,right=-1,bottom=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)throw new Error('No artwork remained; source requires manual review.');
 const width=right-left+1,height=bottom-top+1,png=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).extract({left,top,width,height}).png().toBuffer();
 return {png,width,height,source,cleanup,version:ARTWORK_VERSION};
}
